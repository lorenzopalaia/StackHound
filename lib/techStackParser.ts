import {
  NODE_DEPS,
  PYTHON_DEPS,
  JAVA_DEPS,
  DOTNET_DEPS,
  RUBY_DEPS,
  PHP_DEPS,
  GO_DEPS,
  RUST_DEPS,
  DART_DEPS,
  ELIXIR_DEPS,
  DOCKER_DEPS,
} from "@/dependencies";

type DependencyMap = Record<string, string>;

abstract class TechStackParser {
  protected username: string;
  protected repo: string;
  protected manifest?: string;
  protected manifestPath?: string;
  protected dependencyMap?: DependencyMap;
  protected authToken?: string;
  public techStack: Set<string>;

  constructor(
    username: string,
    repo: string,
    manifest?: string,
    dependencies?: DependencyMap,
    manifestPath?: string,
    authToken?: string,
  ) {
    this.username = username;
    this.repo = repo;
    this.manifest = manifest;
    this.dependencyMap = dependencies;

    this.manifestPath = manifestPath
      ? `${manifestPath.replace(/\/$/, "")}/`
      : "";
    this.authToken = authToken;
    this.techStack = new Set<string>();
  }

  protected getBranch(): string {
    return "main";
  }

  protected async getContent(): Promise<string> {
    if (!this.manifest) {
      throw new Error("Manifest file not specified for this parser.");
    }

    const fullManifestPath = `${this.manifestPath}${this.manifest}`;
    const branch = this.getBranch();
    const url = `https://raw.githubusercontent.com/${this.username}/${this.repo}/${branch}/${fullManifestPath}`;

    const headers: HeadersInit = {};
    if (this.authToken) {
      headers["Authorization"] = `token ${this.authToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (branch === "main") {
        const masterUrl = `https://raw.githubusercontent.com/${this.username}/${this.repo}/master/${fullManifestPath}`;

        const masterResponse = await fetch(masterUrl, { headers });

        if (masterResponse.ok) {
          return await masterResponse.text();
        }

        if (response.status === 404 || masterResponse.status === 404) {
          throw new Error(
            `HTTP error! status: 404 Not Found for ${fullManifestPath} on both main and master branches. Repository might be private, misspelled, or does not contain the file. Check token permissions if private.`,
          );
        }
        throw new Error(
          `HTTP error! status: ${response.status} for ${url} (and master branch failed with status ${masterResponse.status})`,
        );
      }
      if (response.status === 404) {
        throw new Error(
          `HTTP error! status: 404 Not Found for ${url}. Repository might be private, misspelled, or does not contain the file. Check token permissions if private.`,
        );
      }
      throw new Error(`HTTP error! status: ${response.status} for ${url}`);
    }
    return await response.text();
  }

  protected abstract parse(content: string): void;

  public async getDependencies(): Promise<Set<string>> {
    if (!this.manifest) {
      return new Set<string>();
    }

    try {
      const content = await this.getContent();
      this.parse(content);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("HTTP error!")) {
      } else {
        console.error(
          `Unexpected error getting dependencies for ${this.username}/${this.repo} using ${this.constructor.name}:`,
          error,
        );
      }

      return new Set<string>();
    }
    return this.techStack;
  }

  protected filter(deps: Iterable<string>): void {
    if (!this.dependencyMap) {
      console.warn(
        `Warning: No dependency map provided for ${this.constructor.name}.`,
      );
      return;
    }
    const addedTech = new Set<string>();
    for (const dep of deps) {
      const normalizedDep = dep; //.toLowerCase();
      if (normalizedDep in this.dependencyMap) {
        const tech = this.dependencyMap[normalizedDep];
        if (!this.techStack.has(tech)) {
          this.techStack.add(tech);
          addedTech.add(tech);
        }
      }
    }
  }
}

class NodeParser extends TechStackParser {
  constructor(
    username: string,
    repo: string,
    path?: string,
    authToken?: string,
  ) {
    super(username, repo, "package.json", NODE_DEPS, path, authToken);
  }

  protected parse(content: string): void {
    try {
      const data = JSON.parse(content);
      const dependencies = data.dependencies || {};
      const devDependencies = data.devDependencies || {};

      const allDeps = { ...dependencies, ...devDependencies };
      this.filter(Object.keys(allDeps));
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(
          `Error decoding JSON from ${this.manifestPath}${this.manifest} for ${this.username}/${this.repo}: ${error.message}`,
        );
      } else {
        console.error(
          `Unexpected error during Node parsing for ${this.username}/${this.repo}:`,
          error,
        );
      }
    }
  }
}

class PythonParser extends TechStackParser {
  constructor(
    username: string,
    repo: string,
    path?: string,
    authToken?: string,
  ) {
    super(username, repo, "requirements.txt", PYTHON_DEPS, path, authToken);
  }

  protected parse(content: string): void {
    try {
      const lines = content.split("\n");
      const packageNames = lines
        .map((line) => this.parsePackageName(line))
        .filter((name): name is string => name !== null);
      this.filter(packageNames);
    } catch (error) {
      console.error(
        `Unexpected error during Python parsing for ${this.username}/${this.repo}:`,
        error,
      );
    }
  }

  private parsePackageName(line: string): string | null {
    line = line.trim();

    if (!line || line.startsWith("#") || line.startsWith("-e")) {
      return null;
    }

    const mainPart = line.split(/[=<>~\[@\s]/)[0].trim();

    const match = mainPart.match(/^([a-zA-Z0-9._-]+)/);
    if (match && match[1]) {
      return match[1].toLowerCase().replace(/[._]/g, "-");
    }
    return null;
  }
}

class JavaParser extends TechStackParser {
  constructor(
    username: string,
    repo: string,
    path?: string,
    authToken?: string,
  ) {
    super(username, repo, "pom.xml", JAVA_DEPS, path, authToken);
  }

  protected parse(content: string): void {
    console.warn(
      `[JavaParser] Warning: Using regex to parse ${this.manifestPath}${this.manifest}. Results may be inaccurate for complex files.`,
    );
    try {
      const artifactIdRegex =
        /<dependency>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?<\/dependency>/g;
      const dependencies: string[] = [];
      let match;
      while ((match = artifactIdRegex.exec(content)) !== null) {
        dependencies.push(match[1].trim());
      }
      this.filter(dependencies);
    } catch (error) {
      console.error(
        `Unexpected error during Java parsing for ${this.username}/${this.repo}:`,
        error,
      );
    }
  }
}

class DotNetParser extends TechStackParser {
  constructor(
    username: string,
    repo: string,
    path?: string,
    authToken?: string,
  ) {
    super(username, repo, "packages.config", DOTNET_DEPS, path, authToken);
  }

  protected parse(content: string): void {
    console.warn(
      `[DotNetParser] Warning: Using regex to parse ${this.manifestPath}${this.manifest}. Only supports legacy packages.config, not .csproj. Results may be incomplete.`,
    );
    try {
      const packageIdRegex = /<package\s+[^>]*id="([^"]+)"/g;
      const dependencies: string[] = [];
      let match;
      while ((match = packageIdRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
      }
      this.filter(dependencies);
    } catch (error) {
      console.error(
        `Unexpected error during .NET (packages.config) parsing for ${this.username}/${this.repo}:`,
        error,
      );
    }
  }
}

class RubyParser extends TechStackParser {
  constructor(
    username: string,
    repo: string,
    path?: string,
    authToken?: string,
  ) {
    super(username, repo, "Gemfile", RUBY_DEPS, path, authToken);
  }

  protected parse(content: string): void {
    console.warn(
      `[RubyParser] Warning: Using regex to parse ${this.manifestPath}${this.manifest}. May not capture all dependencies in complex Gemfiles.`,
    );
    try {
      const gemRegex = /^\s*gem\s+['"]([^'"]+)['"]/gm;
      const dependencies: string[] = [];
      let match;
      while ((match = gemRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
      }
      this.filter(dependencies);
    } catch (error) {
      console.error(
        `Unexpected error during Ruby parsing for ${this.username}/${this.repo}:`,
        error,
      );
    }
  }
}

class PHPParser extends TechStackParser {
  constructor(
    username: string,
    repo: string,
    path?: string,
    authToken?: string,
  ) {
    super(username, repo, "composer.json", PHP_DEPS, path, authToken);
  }

  protected parse(content: string): void {
    try {
      const data = JSON.parse(content);

      const dependencies = data.require || {};
      const devDependencies = data["require-dev"] || {};
      const allDeps = { ...dependencies, ...devDependencies };

      this.filter(Object.keys(allDeps));
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(
          `Error decoding JSON from ${this.manifestPath}${this.manifest} for ${this.username}/${this.repo}: ${error.message}`,
        );
      } else {
        console.error(
          `Unexpected error during PHP parsing for ${this.username}/${this.repo}:`,
          error,
        );
      }
    }
  }
}

class GoParser extends TechStackParser {
  constructor(
    username: string,
    repo: string,
    path?: string,
    authToken?: string,
  ) {
    super(username, repo, "go.mod", GO_DEPS, path, authToken);
  }

  protected parse(content: string): void {
    try {
      const dependencies = new Set<string>();

      const requireLineRegex = /^\s*([a-zA-Z0-9._\/-]+)\s+v[^\s\/\\]+/gm;

      const contentWithoutBlockComments = content.replace(
        /\/\*[\s\S]*?\*\//g,
        "",
      );

      let match;
      while (
        (match = requireLineRegex.exec(contentWithoutBlockComments)) !== null
      ) {
        const lineStart =
          contentWithoutBlockComments
            .substring(0, match.index)
            .lastIndexOf("\n") + 1;
        const line = contentWithoutBlockComments.substring(
          lineStart,
          match.index + match[0].length,
        );

        if (
          (line.trim().startsWith(match[1]) || line.includes("require")) &&
          !line.trim().startsWith("module ")
        ) {
          dependencies.add(match[1]);
        }
      }

      this.filter(dependencies);
    } catch (error) {
      console.error(
        `Unexpected error during Go parsing for ${this.username}/${this.repo}:`,
        error,
      );
    }
  }
}

class RustParser extends TechStackParser {
  constructor(
    username: string,
    repo: string,
    path?: string,
    authToken?: string,
  ) {
    super(username, repo, "Cargo.toml", RUST_DEPS, path, authToken);
  }

  protected parse(content: string): void {
    console.warn(
      `[RustParser] Warning: Using regex to parse ${this.manifestPath}${this.manifest}. TOML parsing with regex is fragile and may yield inaccurate results.`,
    );
    try {
      const dependencies = new Set<string>();
      let inDependenciesSection = false;
      let inDevDependenciesSection = false;
      let inBuildDependenciesSection = false;

      const depRegex = /^\s*([a-zA-Z0-9_-]+)\s*=/;
      const tableHeaderRegex = /^\s*\[dependencies\.([a-zA-Z0-9_-]+)\]/;

      for (const line of content.split("\n")) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("#")) continue;

        if (trimmedLine === "[dependencies]") {
          inDependenciesSection = true;
          inDevDependenciesSection = false;
          inBuildDependenciesSection = false;
          continue;
        }
        if (trimmedLine === "[dev-dependencies]") {
          inDependenciesSection = false;
          inDevDependenciesSection = true;
          inBuildDependenciesSection = false;
          continue;
        }
        if (trimmedLine === "[build-dependencies]") {
          inDependenciesSection = false;
          inDevDependenciesSection = false;
          inBuildDependenciesSection = true;
          continue;
        }

        if (
          trimmedLine.startsWith("[") &&
          !trimmedLine.startsWith("[dependencies") &&
          !trimmedLine.startsWith("[dev-dependencies") &&
          !trimmedLine.startsWith("[build-dependencies")
        ) {
          inDependenciesSection = false;
          inDevDependenciesSection = false;
          inBuildDependenciesSection = false;
          continue;
        }

        if (
          inDependenciesSection ||
          inDevDependenciesSection ||
          inBuildDependenciesSection
        ) {
          let match = depRegex.exec(trimmedLine);
          if (match) {
            dependencies.add(match[1]);
            continue;
          }

          match = tableHeaderRegex.exec(trimmedLine);
          if (match && inDependenciesSection) {
            dependencies.add(match[1]);
          }
        }
      }

      this.filter(dependencies);
    } catch (error) {
      console.error(
        `Unexpected error during Rust parsing for ${this.username}/${this.repo}:`,
        error,
      );
    }
  }
}

class DartParser extends TechStackParser {
  constructor(
    username: string,
    repo: string,
    path?: string,
    authToken?: string,
  ) {
    super(username, repo, "pubspec.yaml", DART_DEPS, path, authToken);
  }

  protected parse(content: string): void {
    console.warn(
      `[DartParser] Warning: Using line-based parsing for ${this.manifestPath}${this.manifest}. YAML parsing without a library is fragile and may yield inaccurate results.`,
    );
    try {
      const dependencies = new Set<string>();
      let inDependenciesSection = false;
      let inDevDependenciesSection = false;
      let currentIndentation = -1;

      for (const line of content.split("\n")) {
        const indentation = line.search(/\S|$/);
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith("#") || !trimmedLine) continue;

        if (indentation <= currentIndentation || indentation === 0) {
          if (trimmedLine.startsWith("dependencies:")) {
            inDependenciesSection = true;
            inDevDependenciesSection = false;
            currentIndentation = indentation;
          } else if (trimmedLine.startsWith("dev_dependencies:")) {
            inDependenciesSection = false;
            inDevDependenciesSection = true;
            currentIndentation = indentation;
          } else if (indentation === 0 && trimmedLine.includes(":")) {
            inDependenciesSection = false;
            inDevDependenciesSection = false;
            currentIndentation = -1;
          }
        }

        if (
          (inDependenciesSection || inDevDependenciesSection) &&
          indentation > currentIndentation
        ) {
          const match = trimmedLine.match(/^([a-zA-Z0-9_]+):/);
          if (match) {
            dependencies.add(match[1]);
          }
        }
      }

      if (/\s*sdk:\s*flutter/.test(content)) {
        if (this.dependencyMap && "flutter" in this.dependencyMap) {
          const tech = this.dependencyMap["flutter"];
          if (!this.techStack.has(tech)) {
            this.techStack.add(tech);
          }
        }
      }

      this.filter(dependencies);
    } catch (error) {
      console.error(
        `Unexpected error during Dart parsing for ${this.username}/${this.repo}:`,
        error,
      );
    }
  }
}

class ElixirParser extends TechStackParser {
  constructor(
    username: string,
    repo: string,
    path?: string,
    authToken?: string,
  ) {
    super(username, repo, "mix.exs", ELIXIR_DEPS, path, authToken);
  }

  protected parse(content: string): void {
    console.warn(
      `[ElixirParser] Warning: Using regex to parse ${this.manifestPath}${this.manifest}. Elixir code parsing with regex is highly unreliable.`,
    );
    try {
      const dependencies = new Set<string>();

      const depsFunctionMatch = content.match(
        /defp?\s+deps\s+do\s*(\[[\s\S]*?\])\s*end/,
      );

      let contentToSearch = "";
      if (depsFunctionMatch && depsFunctionMatch[1]) {
        contentToSearch = depsFunctionMatch[1];
      } else {
        console.warn(
          `[ElixirParser] Could not reliably find deps function in ${this.manifestPath}${this.manifest}, falling back to searching the entire file (less accurate).`,
        );
        contentToSearch = content;
      }

      const depRegex = /\{\s*:([a-zA-Z0-9_]+)\s*,[\s\S]*?\}/g;
      let match;
      while ((match = depRegex.exec(contentToSearch)) !== null) {
        dependencies.add(match[1]);
      }

      this.filter(dependencies);
    } catch (error) {
      console.error(
        `Unexpected error during Elixir parsing for ${this.username}/${this.repo}:`,
        error,
      );
    }
  }
}

class DockerParser extends TechStackParser {
  constructor(
    username: string,
    repo: string,
    path?: string,
    authToken?: string,
  ) {
    super(username, repo, "Dockerfile", DOCKER_DEPS, path, authToken);
  }

  protected parse(content: string): void {
    try {
      const fromRegex =
        /^\s*FROM\s+(?:--platform=\S+\s+)?([^\s:@]+)(?:[:@][^\s]+)?(?:\s+AS\s+\S+)?/gim;
      const baseImages = new Set<string>();
      let match;
      while ((match = fromRegex.exec(content)) !== null) {
        baseImages.add(match[1].toLowerCase());
      }

      this.filter(baseImages);
    } catch (error) {
      console.error(
        `Unexpected error during Docker parsing for ${this.username}/${this.repo}:`,
        error,
      );
    }
  }
}

export {
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
};
