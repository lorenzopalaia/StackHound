import { NextResponse, NextRequest } from "next/server";
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const repo = searchParams.get("repo");

  const token = request.headers.get("X-GitHub-Token");

  if (!username || !repo) {
    return NextResponse.json(
      { error: "Username and repo are required" },
      { status: 400 },
    );
  }

  try {
    const authToken = token ?? undefined;
    const parsers = [
      new NodeParser(username, repo, undefined, authToken),
      new PythonParser(username, repo, undefined, authToken),
      new JavaParser(username, repo, undefined, authToken),
      new DotNetParser(username, repo, undefined, authToken),
      new RubyParser(username, repo, undefined, authToken),
      new PHPParser(username, repo, undefined, authToken),
      new GoParser(username, repo, undefined, authToken),
      new RustParser(username, repo, undefined, authToken),
      new DartParser(username, repo, undefined, authToken),
      new ElixirParser(username, repo, undefined, authToken),
      new DockerParser(username, repo, undefined, authToken),
    ];

    const allTechStacks = await Promise.all(
      parsers.map((p) => p.getDependencies()),
    );

    const combinedTechStack = new Set<string>();
    allTechStacks.forEach((stack) => {
      stack.forEach((tech) => combinedTechStack.add(tech));
    });

    const uniqueTechStack = Array.from(combinedTechStack).sort();

    return NextResponse.json({ techStack: uniqueTechStack });
  } catch (error) {
    console.error(`Error analyzing ${username}/${repo}:`, error);
    let errorMessage = "Failed to analyze repository.";
    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes("404 Not Found")) {
        errorMessage = `Repository not found or file missing. If private, ensure token has 'repo' scope. (${error.message})`;
        status = 404;
      } else if (
        error.message.includes("401") ||
        error.message.includes("403")
      ) {
        errorMessage = `Authentication failed. Check your token and its permissions. (${error.message})`;
        status = 403;
      } else {
        errorMessage = error.message;
      }
    }
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
