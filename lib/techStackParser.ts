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
  protected dependencyMap?: DependencyMap;
  public techStack: Set<string>;

  constructor(
    username: string,
    repo: string,
    manifest?: string,
    dependencies?: DependencyMap
  ) {
    this.username = username;
    this.repo = repo;
    this.manifest = manifest;
    this.dependencyMap = dependencies;
    this.techStack = new Set<string>();
  }

  protected async getContent(): Promise<string> {
    if (!this.manifest) {
      throw new Error("Manifest file not specified for this parser.");
    }
    const url = `https://raw.githubusercontent.com/${this.username}/${this.repo}/main/${this.manifest}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} for ${url}`);
    }
    return await response.text();
  }

  protected abstract parse(content: string): void;

  public async getDependencies(): Promise<Set<string>> {
    try {
      const content = await this.getContent();
      this.parse(content);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("HTTP error!")) {
        console.error(
          `Error fetching ${this.manifest} for ${this.username}/${this.repo}: ${error.message}`
        );
      } else {
        console.error(
          `Unexpected error getting dependencies for ${this.username}/${this.repo}:`,
          error
        );
      }
      // Return empty set on error, mirroring Python behavior
      return new Set<string>();
    }
    return this.techStack;
  }

  protected filter(deps: Iterable<string>): void {
    if (!this.dependencyMap) {
      console.warn("Warning: No dependency map provided for filtering.");
      return;
    }
    for (const dep of deps) {
      if (dep in this.dependencyMap) {
        this.techStack.add(this.dependencyMap[dep]);
      }
    }
  }
}

class NodeParser extends TechStackParser {
  constructor(username: string, repo: string) {
    super(username, repo, "package.json", NODE_DEPS);
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
          `Error decoding JSON from ${this.manifest}: ${error.message}`
        );
      } else {
        console.error(`Unexpected error during Node parsing:`, error);
      }
    }
  }
}

class PythonParser extends TechStackParser {
  constructor(username: string, repo: string) {
    super(username, repo, "requirements.txt", PYTHON_DEPS);
  }

  protected parse(content: string): void {
    try {
      const lines = content.split("\n");
      const packageNames = lines
        .map((line) => this.parsePackageName(line))
        .filter((name): name is string => name !== null); // Type guard to filter out nulls
      this.filter(packageNames);
    } catch (error) {
      console.error(`Unexpected error during Python parsing:`, error);
    }
  }

  private parsePackageName(line: string): string | null {
    line = line.trim();
    if (!line || line.startsWith("#")) {
      return null;
    }
    // Handle version specifiers (==, >=, <=, ~, <, >) and extras ([...])
    const mainPart = line.split(/[=<>~\[]/)[0].trim();
    // Basic regex for valid package names (adjust if needed for stricter validation)
    const match = mainPart.match(/^([a-zA-Z0-9._-]+)/);
    if (match) {
      // Normalize: lowercase and replace underscores with hyphens
      return match[1].toLowerCase().replace(/_/g, "-");
    }
    return null;
  }
}

class JavaParser extends TechStackParser {
  constructor(username: string, repo: string) {
    super(username, repo, "pom.xml", JAVA_DEPS);
  }

  protected parse(content: string): void {
    try {
      const artifactIdRegex = /<artifactId>(.*?)<\/artifactId>/g;
      const dependencies: string[] = [];
      let match;
      while ((match = artifactIdRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
      }
      this.filter(dependencies);
    } catch (error) {
      console.error(`Unexpected error during Java parsing:`, error);
    }
  }
}

class DotNetParser extends TechStackParser {
  constructor(username: string, repo: string) {
    // .NET Core uses .csproj, older .NET Framework used packages.config
    // We might need separate parsers or logic to detect which one exists.
    // Sticking to packages.config for direct translation.
    super(username, repo, "packages.config", DOTNET_DEPS);
    // TODO: Add support for .csproj <PackageReference Include="..."/>
  }

  protected parse(content: string): void {
    try {
      // Regex for packages.config
      const packageIdRegex = /<package\s+id="([^"]+)"/g;
      const dependencies: string[] = [];
      let match;
      while ((match = packageIdRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
      }
      this.filter(dependencies);
    } catch (error) {
      console.error(`Unexpected error during .NET parsing:`, error);
    }
  }
}

class RubyParser extends TechStackParser {
  constructor(username: string, repo: string) {
    super(username, repo, "Gemfile", RUBY_DEPS);
  }

  protected parse(content: string): void {
    try {
      // Matches gem 'name' or gem "name"
      const gemRegex = /gem\s+['"]([^'"]+)['"]/g;
      const dependencies: string[] = [];
      let match;
      while ((match = gemRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
      }
      this.filter(dependencies);
    } catch (error) {
      console.error(`Unexpected error during Ruby parsing:`, error);
    }
  }
}

class PHPParser extends TechStackParser {
  constructor(username: string, repo: string) {
    super(username, repo, "composer.json", PHP_DEPS);
  }

  protected parse(content: string): void {
    try {
      const data = JSON.parse(content);
      // Includes both 'require' and 'require-dev'
      const dependencies = data.require || {};
      const devDependencies = data["require-dev"] || {};
      const allDeps = { ...dependencies, ...devDependencies };
      this.filter(Object.keys(allDeps));
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(
          `Error decoding JSON from ${this.manifest}: ${error.message}`
        );
      } else {
        console.error(`Unexpected error during PHP parsing:`, error);
      }
    }
  }
}

class GoParser extends TechStackParser {
  constructor(username: string, repo: string) {
    super(username, repo, "go.mod", GO_DEPS);
  }

  protected parse(content: string): void {
    try {
      // Matches lines like 'require github.com/gin-gonic/gin v1.7.4'
      // or blocks like require ( ... )
      const requireRegex = /^\s*(?:require(?:\s+|\s*\(\s*))([^\s\)]+)/gm;
      const dependencies: string[] = [];
      let match;
      while ((match = requireRegex.exec(content)) !== null) {
        // Avoid matching the 'require (' line itself if module path is on next line
        if (match[1] && match[1] !== "(") {
          dependencies.push(match[1]);
        }
      }

      // Handle require blocks: require ( ... )
      const requireBlockRegex = /require\s+\(([\s\S]*?)\)/g;
      let blockMatch;
      while ((blockMatch = requireBlockRegex.exec(content)) !== null) {
        const blockContent = blockMatch[1];
        const lineRegex = /^\s*([^\s]+)/gm; // Match module path at start of line
        let lineMatch;
        while ((lineMatch = lineRegex.exec(blockContent)) !== null) {
          dependencies.push(lineMatch[1]);
        }
      }

      // Filter unique dependencies
      this.filter(new Set(dependencies));
    } catch (error) {
      console.error(`Unexpected error during Go parsing:`, error);
    }
  }
}

class RustParser extends TechStackParser {
  constructor(username: string, repo: string) {
    super(username, repo, "Cargo.toml", RUST_DEPS);
  }

  protected parse(content: string): void {
    // Note: Robust TOML parsing requires a library. This regex is a simplification.
    try {
      // Matches lines like `tokio = "1"` or `serde = { version = "1.0", features = ["derive"] }`
      // It captures the dependency name before the '='.
      const depRegex = /^\s*([a-zA-Z0-9_-]+)\s*=/gm;
      const dependencies: string[] = [];
      let match;
      // Find potential dependency sections like [dependencies] or [dev-dependencies]
      const sections = content.split(/\[.*\]/);
      // Typically dependencies are in the section after "[dependencies]"
      // This is a heuristic and might fail for complex Cargo.toml files
      const depSection = sections.find(
        (section) =>
          section.includes("version") ||
          section.includes("git") ||
          section.includes("path")
      );

      if (depSection) {
        while ((match = depRegex.exec(depSection)) !== null) {
          // Avoid matching keys within table definitions like [dependencies.serde]
          if (!depSection.substring(0, match.index).includes(`[${match[1]}]`)) {
            dependencies.push(match[1]);
          }
        }
      }

      // Also check top-level dependencies before any explicit section header
      const topLevelContent = content.split("[")[0];
      while ((match = depRegex.exec(topLevelContent)) !== null) {
        dependencies.push(match[1]);
      }

      this.filter(new Set(dependencies)); // Use Set to remove duplicates
    } catch (error) {
      console.error(`Unexpected error during Rust parsing:`, error);
    }
  }
}

class DartParser extends TechStackParser {
  constructor(username: string, repo: string) {
    super(username, repo, "pubspec.yaml", DART_DEPS);
  }

  protected parse(content: string): void {
    // Note: Robust YAML parsing requires a library. This regex is a simplification.
    try {
      // Matches lines under 'dependencies:' or 'dev_dependencies:' like '  http: ^0.13.3'
      // const depRegex = /^\s+([a-zA-Z0-9_]+):\s*.*$/gm; // This regex is unused
      const dependencies: string[] = [];
      let inDependenciesSection = false;
      let inDevDependenciesSection = false;

      for (const line of content.split("\n")) {
        if (line.trim().startsWith("dependencies:")) {
          inDependenciesSection = true;
          inDevDependenciesSection = false;
          continue;
        }
        // Corrected the key name from 'dev_DEPS' to 'dev_dependencies'
        if (line.trim().startsWith("dev_dependencies:")) {
          inDependenciesSection = false;
          inDevDependenciesSection = true;
          continue;
        }
        // Stop parsing if we hit another top-level key
        if (!line.startsWith(" ") && line.includes(":")) {
          inDependenciesSection = false;
          inDevDependenciesSection = false;
        }

        if (inDependenciesSection || inDevDependenciesSection) {
          const match = line.match(/^\s+([a-zA-Z0-9_]+):/);
          if (match) {
            dependencies.push(match[1]);
          }
        }
      }

      this.filter(dependencies);
    } catch (error) {
      console.error(`Unexpected error during Dart parsing:`, error);
    }
  }
}

class ElixirParser extends TechStackParser {
  constructor(username: string, repo: string) {
    super(username, repo, "mix.exs", ELIXIR_DEPS);
  }

  protected parse(content: string): void {
    // Note: Parsing Elixir code with regex is fragile.
    try {
      // Matches tuples like {:plug_cowboy, "~> 2.0"} or {:ecto_sql, "~> 3.4"} within the deps function
      const depRegex = /\{\s*:([a-zA-Z0-9_]+)\s*,.*?\}/g;
      const dependencies: string[] = [];

      // Try to find the `deps` function definition
      const depsFunctionMatch = content.match(
        /defp? deps do\s*\[([\s\S]*?)\]\s*end/
      );

      if (depsFunctionMatch) {
        const depsContent = depsFunctionMatch[1];
        let match;
        while ((match = depRegex.exec(depsContent)) !== null) {
          dependencies.push(match[1]);
        }
      } else {
        console.warn(
          "Could not find deps function in mix.exs, parsing might be incomplete."
        );
        // Fallback: search the whole file (less accurate)
        let match;
        while ((match = depRegex.exec(content)) !== null) {
          dependencies.push(match[1]);
        }
      }

      this.filter(dependencies);
    } catch (error) {
      console.error(`Unexpected error during Elixir parsing:`, error);
    }
  }
}

class DockerParser extends TechStackParser {
  constructor(username: string, repo: string) {
    super(username, repo, "Dockerfile", DOCKER_DEPS);
  }

  protected parse(content: string): void {
    try {
      // Matches FROM instructions, capturing the base image name
      // Handles optional stage names (FROM base AS builder) and platforms (--platform=...)
      const fromRegex =
        /^\s*FROM\s+(?:--platform=\S+\s+)?([^\s]+)(?:\s+AS\s+\S+)?/gim; // case-insensitive, multiline
      const baseImages: string[] = [];
      let match;
      while ((match = fromRegex.exec(content)) !== null) {
        // Extract only the image name (e.g., 'node' from 'node:18-alpine')
        const imageName = match[1].split(":")[0].split("@")[0];
        baseImages.push(imageName);
      }
      this.filter(baseImages);
    } catch (error) {
      console.error(`Unexpected error during Docker parsing:`, error);
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
