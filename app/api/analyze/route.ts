import { NextResponse } from "next/server";
import {
  NodeParser,
  PythonParser,
  JavaParser,
  DotNetParser,
  RubyParser,
  PHPParser,
  GoParser,
  RustParser,
  DartParser,
  ElixirParser,
  DockerParser,
} from "@/lib/techStackParser";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const repo = searchParams.get("repo");

  if (!username || !repo) {
    return NextResponse.json(
      { error: "Missing username or repo parameter" },
      { status: 400 },
    );
  }

  console.info(`API received request for: username=${username}, repo=${repo}`);

  const techStack = new Set<string>();

  const parsers = [
    new NodeParser(username, repo),
    new PythonParser(username, repo),
    new JavaParser(username, repo),
    new DotNetParser(username, repo),
    new RubyParser(username, repo),
    new PHPParser(username, repo),
    new GoParser(username, repo),
    new RustParser(username, repo),
    new DartParser(username, repo),
    new ElixirParser(username, repo),
    new DockerParser(username, repo),
  ];

  // Esegui tutti i parser in parallelo
  const results = await Promise.allSettled(
    parsers.map((parser) => parser.getDependencies()), // getDependencies deve essere async in TypeScript
  );

  results.forEach((result, index) => {
    const parserName = parsers[index].constructor.name;
    if (result.status === "fulfilled") {
      console.info(`${parserName} succeeded for ${username}/${repo}`);
      result.value.forEach((tech) => techStack.add(tech));
    } else {
      console.error(
        `${parserName} failed for ${username}/${repo}: ${result.reason}`,
      );
    }
  });

  if (techStack.size === 0) {
    console.warn(
      `No tech stack detected for ${username}/${repo}. Check parser logs for errors or unsupported manifest files.`,
    );
  }

  return NextResponse.json({ techStack: Array.from(techStack) });
}

// --- Note Importanti ---
// 1.  **@/lib/techStackParser.ts**: Devi creare questo file e tradurre le classi Python in TypeScript.
//     - La classe base `TechStackParser` avrà un metodo `getContent` asincrono che usa `fetch` per scaricare il file da GitHub.
//     - Ogni sottoclasse (`NodeParser`, `PythonParser`, ecc.) implementerà il metodo `parse` e `getDependencies` (che sarà `async`).
//     - Le classi parser dovrebbero accettare le mappe delle dipendenze appropriate (es. `NODE_DEPENDENCIES`) nel loro costruttore o accedervi direttamente se importate nello stesso modulo.
// 2.  **dependencies.ts**: Devi creare questo file (probabilmente nella root del progetto Next.js) ed esportare le costanti delle dipendenze (es. `export const NODE_DEPENDENCIES = { ... };`).
// 3.  **Gestione Errori**: Il codice attuale logga gli errori dei singoli parser ma restituisce comunque un array (potenzialmente vuoto) con status 200. Potresti voler modificare questo comportamento per restituire uno status 500 in caso di errori critici.
// 4.  **Percorsi**: Verifica attentamente i percorsi di importazione per `dependencies.ts` e `@/lib/techStackParser.ts`.
