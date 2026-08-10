import React, { useEffect } from "react";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";

interface EditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

export const Editor: React.FC<EditorProps> = ({ code, onChange }) => {
  const monaco = useMonaco();

  useEffect(() => {
    if (!monaco) return;

    monaco.languages.register({ id: "hatchet" });

    monaco.languages.setMonarchTokensProvider("hatchet", {
      keywords: ["struct", "extends", "proc", "var", "const", "if", "else", "switch", "case", "default", "return"],
      typeKeywords: ["int", "string", "bool", "float"],
      operators: ["=", "==", "!=", "+", "-", "*", "/"],

      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, {
            cases: {
              "@keywords": "keyword",
              "@typeKeywords": "type",
              "@default": "identifier"
            }
          }],
          [/"([^"\\]|\\.)*"/, "string"],
          [/\d+/, "number"],
          [/\/\/.*/, "comment"],
        ],
      },
    });

    monaco.editor.defineTheme("hatchetDark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "C586C0", fontStyle: "bold" },
        { token: "type", foreground: "4EC9B0" },
        { token: "identifier", foreground: "9CDCFE" },
        { token: "string", foreground: "CE9178" },
        { token: "comment", foreground: "6A9955" },
      ],
      colors: {
        "editor.background": "#1E1E1E",
      },
    });
  }, [monaco]);

  return (
    <MonacoEditor
      height="100%"
      defaultLanguage="hatchet"
      theme="hatchetDark"
      value={code}
      onChange={onChange}
      options={{
        fontSize: 14,
        minimap: { enabled: true },
        automaticLayout: true,
        scrollBeyondLastLine: false,
      }}
    />
  );
};