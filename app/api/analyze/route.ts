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
      { status: 400 }
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

  const results = await Promise.allSettled(
    parsers.map((parser) => parser.getDependencies())
  );

  results.forEach((result, index) => {
    const parserName = parsers[index].constructor.name;
    if (result.status === "fulfilled") {
      console.info(`${parserName} succeeded for ${username}/${repo}`);
      result.value.forEach((tech) => techStack.add(tech));
    } else {
      console.error(
        `${parserName} failed for ${username}/${repo}: ${result.reason}`
      );
    }
  });

  if (techStack.size === 0) {
    console.warn(
      `No tech stack detected for ${username}/${repo}. Check parser logs for errors or unsupported manifest files.`
    );
  }

  return NextResponse.json({ techStack: Array.from(techStack) });
}
