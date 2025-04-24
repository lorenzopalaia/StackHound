import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"; // Scegli lo stile che preferisci

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export const CodeBlock = ({
  code,
  language = "bash",
  className,
}: CodeBlockProps) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={atomDark} // Applica lo stile importato
      className={className} // Applica la classe passata
      customStyle={{
        padding: "1rem",
        borderRadius: "0.375rem", // Equivalente a rounded-md di Tailwind
        backgroundColor: "#1f2937", // Un colore di sfondo scuro, puoi personalizzarlo
        overflowX: "auto",
        fontSize: "0.875rem", // Equivalente a text-sm di Tailwind
      }}
      showLineNumbers={false} // Opzionale: mostra i numeri di riga
      wrapLines={true} // Opzionale: va a capo automaticamente
    >
      {code.trim()}
    </SyntaxHighlighter>
  );
};

// Nota: Puoi esplorare altri stili disponibili in 'react-syntax-highlighter/dist/esm/styles/prism'
// o 'react-syntax-highlighter/dist/esm/styles/hljs'
