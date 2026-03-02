/**
 * JavaScript Web Worker with Interactive Input
 *
 * Runs user JS code in an isolated worker thread so infinite loops
 * cannot freeze the main UI.  Follows the same message protocol as
 * pyodide.worker.js:
 *
 *   Main -> Worker:  RUN { code }
 *   Main -> Worker:  INPUT_RESPONSE { text }
 *   Main -> Worker:  INTERRUPT
 *   Worker -> Main:  OUTPUT { text }
 *   Worker -> Main:  INPUT_REQUEST
 *   Worker -> Main:  FINISHED
 *   Worker -> Main:  ERROR { message }
 *   Worker -> Main:  READY
 */

let userCode = "";
let collectedInputs = [];
let previousOutput = "";
let isExecuting = false;

// ---- helpers ---------------------------------------------------------------

function formatValue(val) {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (typeof val === "object") {
    try { return JSON.stringify(val, null, 2); } catch { return String(val); }
  }
  return String(val);
}

function emit(text) {
  self.postMessage({ type: "OUTPUT", text });
}

// ---- execute user code -----------------------------------------------------

async function executeWithInputs(code, inputs) {
  let currentOutput = "";
  let inputIndex = 0;
  let needsMoreInput = false;

  // Build console overrides
  const makeLogger = (prefix, ansiOpen, ansiClose) => (...args) => {
    const line = args.map(formatValue).join(" ");
    const text = prefix
      ? ansiOpen + line + ansiClose + "\r\n"
      : line + "\r\n";
    currentOutput += text;
    if (currentOutput.length > previousOutput.length) {
      emit(currentOutput.slice(previousOutput.length));
      // keep previousOutput in sync as we emit
      previousOutput = currentOutput;
    }
  };

  const customConsole = {
    log:   makeLogger(false, "", ""),
    info:  makeLogger(false, "", ""),
    warn:  makeLogger(true, "\x1b[33m", "\x1b[0m"),
    error: makeLogger(true, "\x1b[31m", "\x1b[0m"),
    debug: makeLogger(false, "", ""),
    dir:   (...args) => customConsole.log(...args),
    table: (data) => {
      try { customConsole.log(JSON.stringify(data, null, 2)); }
      catch { customConsole.log(String(data)); }
    },
    clear: () => {},
  };

  // prompt() replacement — synchronous-style via collected inputs
  const customPrompt = (message) => {
    if (message !== undefined && message !== null) {
      const promptText = String(message);
      currentOutput += promptText;
      if (currentOutput.length > previousOutput.length) {
        emit(currentOutput.slice(previousOutput.length));
        previousOutput = currentOutput;
      }
    }
    if (inputIndex < inputs.length) {
      return inputs[inputIndex++];
    }
    // Signal that we need more input
    needsMoreInput = true;
    throw new Error("__NEED_MORE_INPUT__");
  };

  // alert() shim
  const customAlert = (msg) => customConsole.log(msg);

  try {
    // Wrap in async so user can use top-level await
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction("console", "prompt", "alert", code);
    await fn(customConsole, customPrompt, customAlert);
    return { needsInput: false, error: null };
  } catch (err) {
    const msg = err?.message ?? String(err);
    if (msg.includes("__NEED_MORE_INPUT__")) {
      return { needsInput: true, error: null };
    }
    return { needsInput: false, error: msg };
  }
}

async function runCode() {
  isExecuting = true;

  const result = await executeWithInputs(userCode, collectedInputs);

  if (!isExecuting) return; // interrupted

  if (result.needsInput) {
    // Don't reset previousOutput — keep it so delta works on re-run
    self.postMessage({ type: "INPUT_REQUEST" });
    return;
  }

  if (result.error) {
    emit("\x1b[31mError: " + result.error + "\x1b[0m\r\n");
  }

  isExecuting = false;
  self.postMessage({ type: "FINISHED" });
}

// ---- message handler -------------------------------------------------------

self.onmessage = async (event) => {
  const { type, code, text } = event.data;

  if (type === "RUN") {
    userCode = code;
    collectedInputs = [];
    previousOutput = "";
    await runCode();
  }

  if (type === "INPUT_RESPONSE") {
    if (!isExecuting) return;
    collectedInputs.push(text);
    // Re-run from scratch with all collected inputs (delta output skips already-shown text)
    await runCode();
  }

  if (type === "INTERRUPT") {
    isExecuting = false;
    collectedInputs = [];
    previousOutput = "";
    emit("\n⚠️ Interrupted\n");
    self.postMessage({ type: "FINISHED" });
  }
};

// Signal ready immediately — no heavy init needed for JS
self.postMessage({ type: "READY" });
