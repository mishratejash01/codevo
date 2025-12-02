import { Editor } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  disableCopyPaste?: boolean;
  language?: string; // New Prop
}

export const CodeEditor = ({ value, onChange, readOnly = false, disableCopyPaste = false, language = "python" }: CodeEditorProps) => {
  
  const handleEditorDidMount = (editor: any, monaco: any) => {
    if (disableCopyPaste) {
      const container = editor.getContainerDomNode();
      
      const preventDefault = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };

      container.addEventListener('copy', preventDefault, true);
      container.addEventListener('paste', preventDefault, true);
      container.addEventListener('cut', preventDefault, true);
      container.addEventListener('contextmenu', preventDefault, true);
      
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => null);
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => null);
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => null);
    }
  };

  return (
    <div className="h-full w-full relative group bg-black">
      <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/20 to-secondary/20 rounded-none blur opacity-20 group-hover:opacity-40 transition duration-1000 pointer-events-none"></div>
      
      <div className="h-full w-full overflow-hidden border-none shadow-2xl bg-black">
        <Editor
          height="100%"
          language={language} // Pass the dynamic language here
          value={value}
          onChange={(value) => onChange(value || '')}
          onMount={handleEditorDidMount}
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
            contextmenu: !disableCopyPaste,
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
