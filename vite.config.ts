import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from 'url';
import { componentTagger } from "lovable-tagger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Judge0 language ID mapping (shared with api/execute.js)
const JUDGE0_LANG_MAP: Record<string, number> = {
  python: 71, java: 62, cpp: 54, c: 50,
  javascript: 63, typescript: 74, sql: 82, bash: 46,
};

/**
 * Vite plugin: local dev proxy for /api/execute
 * Mirrors what api/execute.js does on Vercel — calls Judge0 CE server-side,
 * normalises the response. Runs in Node.js so no CORS issues.
 */
function apiExecuteProxy() {
  return {
    name: 'api-execute-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/execute', async (req: any, res: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          return res.end();
        }
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }

        // Read request body
        let raw = '';
        for await (const chunk of req) raw += chunk;

        let body: any;
        try { body = JSON.parse(raw); } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }

        const { source_code, language, stdin } = body;
        if (!source_code || !language) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing source_code or language' }));
        }

        const langId = JUDGE0_LANG_MAP[language] || 71;

        try {
          const j0 = await fetch(
            'https://ce.judge0.com/submissions/?base64_encoded=false&wait=true',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ source_code, language_id: langId, stdin: stdin || '' }),
            },
          );
          if (!j0.ok) throw new Error(`Judge0 HTTP ${j0.status}`);

          const data = await j0.json();
          if (data.message && !data.status) throw new Error(data.message);

          const sid = data.status?.id;
          const stdout = data.stdout || '';
          const stderr = data.stderr || '';
          const co = data.compile_output || '';
          const time = data.time ? parseFloat(data.time) * 1000 : 0;
          const memory = data.memory || 0;

          let result;
          if (sid === 6)       result = { stdout: '', stderr: co || 'Compilation failed', code: 1, signal: null, time, memory, isCompileError: true };
          else if (sid === 5)  result = { stdout, stderr: 'Time Limit Exceeded', code: -1, signal: 'SIGKILL', time, memory, isCompileError: false };
          else if (sid === 3)  result = { stdout, stderr: '', code: 0, signal: null, time, memory, isCompileError: false };
          else if (sid >= 11)  result = { stdout, stderr: stderr || data.status?.description || 'Runtime Error', code: 1, signal: null, time, memory, isCompileError: false };
          else                 result = { stdout, stderr: stderr || data.status?.description || '', code: 1, signal: null, time, memory, isCompileError: false };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (e: any) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            stdout: '', stderr: `Server error: ${e.message}`, code: 1,
            signal: null, time: 0, memory: 0, isCompileError: false,
          }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      "Cross-Origin-Embedder-Policy": "unsafe-none",
      "Cross-Origin-Opener-Policy": "unsafe-none",
    },
  },
  plugins: [
    react(),
    apiExecuteProxy(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
