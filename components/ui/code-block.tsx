import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export const CodeBlock = ({ code, language = "bash" }: CodeBlockProps) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={atomDark}
      className="bg-muted"
      customStyle={{
        padding: "1rem",
        borderRadius: "0.375rem",
        overflowX: "auto",
        fontSize: "0.875rem",
      }}
      showLineNumbers={false}
      wrapLines={true}
    >
      {code.trim()}
    </SyntaxHighlighter>
  );
};
