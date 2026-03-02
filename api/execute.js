/**
 * Vercel Serverless Proxy for code execution.
 *
 * Why: External APIs (Piston, Judge0) have CORS issues from browsers.
 * This runs on the SAME origin as the app — zero CORS problems.
 *
 * Primary:  Judge0 CE (ce.judge0.com) — free, no API key
 * Fallback: Wandbox (wandbox.org) — free, no API key
 */

// Judge0 language IDs
const JUDGE0_LANG_MAP = {
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  javascript: 63,
  typescript: 74,
  sql: 82,
  bash: 46,
};

// Wandbox compiler names (fallback)
const WANDBOX_COMPILER_MAP = {
  python: 'cpython-3.12.7',
  java: 'openjdk-jdk-22+36',
  cpp: 'gcc-13.2.0',
  c: 'gcc-13.2.0-c',
  javascript: 'nodejs-20.17.0',
  typescript: 'typescript-5.6.2',
  bash: 'bash',
};

async function executeViaJudge0(sourceCode, languageId, stdin) {
  const resp = await fetch(
    'https://ce.judge0.com/submissions/?base64_encoded=false&wait=true',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_code: sourceCode, language_id: languageId, stdin }),
    }
  );

  if (!resp.ok) throw new Error(`Judge0 HTTP ${resp.status}`);

  const data = await resp.json();

  // If Judge0 returns a message instead of results (API blocked, etc.)
  if (data.message && !data.status) throw new Error(data.message);

  const statusId = data.status?.id;
  const stdout = data.stdout || '';
  const stderr = data.stderr || '';
  const compileOutput = data.compile_output || '';
  const time = data.time ? parseFloat(data.time) * 1000 : 0;
  const memory = data.memory || 0;

  // Status 6 = Compilation Error
  if (statusId === 6) {
    return { stdout: '', stderr: compileOutput || 'Compilation failed', code: 1, signal: null, time, memory, isCompileError: true };
  }
  // Status 5 = TLE
  if (statusId === 5) {
    return { stdout, stderr: 'Time Limit Exceeded', code: -1, signal: 'SIGKILL', time, memory, isCompileError: false };
  }
  // Status 3 = Accepted
  if (statusId === 3) {
    return { stdout, stderr: '', code: 0, signal: null, time, memory, isCompileError: false };
  }
  // Runtime Error (11+)
  if (statusId >= 11) {
    return { stdout, stderr: stderr || data.status?.description || 'Runtime Error', code: 1, signal: null, time, memory, isCompileError: false };
  }
  // Other
  return { stdout, stderr: stderr || data.status?.description || '', code: statusId === 3 ? 0 : 1, signal: null, time, memory, isCompileError: false };
}

async function executeViaWandbox(sourceCode, compiler, stdin) {
  const resp = await fetch('https://wandbox.org/api/compile.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: sourceCode, compiler, stdin, save: false }),
  });

  if (!resp.ok) throw new Error(`Wandbox HTTP ${resp.status}`);

  const data = await resp.json();
  const exitCode = parseInt(data.status || '0', 10);
  const stdout = data.program_output || '';
  const stderr = data.program_error || '';
  const compilerError = data.compiler_error || '';
  const isCompileError = compilerError.length > 0 && exitCode !== 0;

  return {
    stdout,
    stderr: isCompileError ? compilerError : stderr,
    code: exitCode,
    signal: data.signal || null,
    time: 0,
    memory: 0,
    isCompileError,
  };
}

export default async function handler(req, res) {
  // Allow CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { source_code, language, stdin } = req.body || {};

  if (!source_code || !language) {
    return res.status(400).json({ error: 'Missing source_code or language' });
  }

  // Try Judge0 first, fall back to Wandbox
  const judge0Id = JUDGE0_LANG_MAP[language];
  const wandboxCompiler = WANDBOX_COMPILER_MAP[language];

  // Attempt 1: Judge0
  if (judge0Id) {
    try {
      const result = await executeViaJudge0(source_code, judge0Id, stdin || '');
      return res.status(200).json(result);
    } catch (e) {
      console.error('Judge0 failed:', e.message);
      // Fall through to Wandbox
    }
  }

  // Attempt 2: Wandbox
  if (wandboxCompiler && language !== 'sql') {
    try {
      const result = await executeViaWandbox(source_code, wandboxCompiler, stdin || '');
      return res.status(200).json(result);
    } catch (e) {
      console.error('Wandbox failed:', e.message);
    }
  }

  return res.status(502).json({
    stdout: '',
    stderr: 'All code execution servers are unavailable. Please try again later.',
    code: 1,
    signal: null,
    time: 0,
    memory: 0,
    isCompileError: false,
  });
}
