import { useEffect } from 'react';
import { useMonaco } from '@monaco-editor/react';

export const useIntellisense = () => {
  const monaco = useMonaco();

  useEffect(() => {
    if (!monaco) return;

    const createSuggestion = (
      label: string,
      kind: any,
      insertText: string,
      documentation: string,
      range: any
    ) => ({
      label,
      kind,
      insertText,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation,
      range,
    });

    // 1. C++ Snippets
    const cppProvider = monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          createSuggestion('cout', monaco.languages.CompletionItemKind.Snippet, 'std::cout << ${1:value} << std::endl;', 'Standard Output Stream', range),
          createSuggestion('cin', monaco.languages.CompletionItemKind.Snippet, 'std::cin >> ${1:variable};', 'Standard Input Stream', range),
          createSuggestion('vector', monaco.languages.CompletionItemKind.Class, 'std::vector<${1:Type}> ${2:name};', 'Dynamic array', range),
          createSuggestion('include', monaco.languages.CompletionItemKind.Module, '#include <${1:iostream}>', 'Include header file', range),
          createSuggestion('main', monaco.languages.CompletionItemKind.Snippet, 'int main() {\n\t${1}\n\treturn 0;\n}', 'Main function template', range),
        ];
        return { suggestions };
      }
    });

    // 2. Java Snippets
    const javaProvider = monaco.languages.registerCompletionItemProvider('java', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          createSuggestion('sout', monaco.languages.CompletionItemKind.Snippet, 'System.out.println(${1});', 'Print to standard output', range),
          createSuggestion('psvm', monaco.languages.CompletionItemKind.Snippet, 'public static void main(String[] args) {\n\t${1}\n}', 'Main method', range),
          createSuggestion('class', monaco.languages.CompletionItemKind.Snippet, 'public class ${1:Name} {\n\t${2}\n}', 'Class definition', range),
        ];
        return { suggestions };
      }
    });

    // 3. Python Snippets
    const pythonProvider = monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          createSuggestion('def', monaco.languages.CompletionItemKind.Snippet, 'def ${1:function_name}(${2:args}):\n\t${3:pass}', 'Function definition', range),
          createSuggestion('ifmain', monaco.languages.CompletionItemKind.Snippet, 'if __name__ == "__main__":\n\t${1:main()}', 'Script entry point', range),
        ];
        return { suggestions };
      }
    });

    return () => {
      cppProvider.dispose();
      javaProvider.dispose();
      pythonProvider.dispose();
    };
  }, [monaco]);
};
