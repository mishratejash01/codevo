import { Editor } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export const CodeEditor = ({ value, onChange, readOnly = false }: CodeEditorProps) => {
  return (
    <div className="h-full w-full relative group bg-black">
      {/* Subtle Glow effect behind the editor */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/20 to-secondary/20 rounded-none blur opacity-20 group-hover:opacity-40 transition duration-1000 pointer-events-none"></div>
      
      <div className="h-full w-full overflow-hidden border-none shadow-2xl bg-black">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={value}
          onChange={(value) => onChange(value || '')}
          theme="vs-dark"
          loading={
            <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
              <Loader2 className="animate-spin h-5 w-5"/> 
              <span className="font-mono text-sm">Initializing Editor...</span>
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            readOnly,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 20, bottom: 20 },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderLineHighlight: "all",
            matchBrackets: "always",
            roundedSelection: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            }
          }}
        />
      </div>
    </div>
  );
};
