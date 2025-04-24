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
  protected manifest?: string; // Manifest file name (e.g., package.json)
  protected manifestPath?: string; // Full path within the repo (optional, defaults to root)
  protected dependencyMap?: DependencyMap;
  public techStack: Set<string>;

  constructor(
    username: string,
    repo: string,
    manifest?: string, // File name
    dependencies?: DependencyMap,
    manifestPath?: string // Optional path like 'src/project/'
  ) {
    this.username = username;
    this.repo = repo;
    this.manifest = manifest;
    this.dependencyMap = dependencies;
    // Default to root if no path is provided, ensure trailing slash if path exists
    this.manifestPath = manifestPath
      ? `${manifestPath.replace(/\/$/, "")}/`
      : "";
    this.techStack = new Set<string>();
  }

  // Allow subclasses to specify the branch (defaults to main)
  protected getBranch(): string {
    return "main";
  }

  protected async getContent(): Promise<string> {
    if (!this.manifest) {
      throw new Error("Manifest file not specified for this parser.");
    }
    // Construct the full path including the optional directory path
    const fullManifestPath = `${this.manifestPath}${this.manifest}`;
    const branch = this.getBranch(); // Use configurable branch
    const url = `https://raw.githubusercontent.com/${this.username}/${this.repo}/${branch}/${fullManifestPath}`;
    console.log(`Fetching: ${url}`); // Log URL for debugging
    const response = await fetch(url);

    if (!response.ok) {
      // Try 'master' branch as a fallback if 'main' fails
      if (branch === "main") {
        console.warn(
          `Failed to fetch from 'main' branch (${response.status}) for ${fullManifestPath}, trying 'master'...`
        );
        const masterUrl = `https://raw.githubusercontent.com/${this.username}/${this.repo}/master/${fullManifestPath}`;
        console.log(`Fetching: ${masterUrl}`);
        const masterResponse = await fetch(masterUrl);
        if (masterResponse.ok) {
          return await masterResponse.text();
        }
        // Throw original error if master also fails
        throw new Error(
          `HTTP error! status: ${response.status} for ${url} (and master branch failed with status ${masterResponse.status})`
        );
      }
      throw new Error(`HTTP error! status: ${response.status} for ${url}`);
    }
    return await response.text();
  }

  protected abstract parse(content: string): void;

  public async getDependencies(): Promise<Set<string>> {
    // Skip execution if manifest is not defined for this parser instance
    if (!this.manifest) {
      console.log(
        `Skipping parser ${this.constructor.name} for ${this.username}/${this.repo} as manifest is not specified.`
      );
      return new Set<string>();
    }

    try {
      const content = await this.getContent();
      this.parse(content);
    } catch (error) {
      // Log specific fetch errors, but don't crash the whole process
      if (error instanceof Error && error.message.startsWith("HTTP error!")) {
        console.error(
          `Error fetching ${this.manifestPath}${this.manifest} for ${this.username}/${this.repo}: ${error.message}`
        );
      } else {
        console.error(
          `Unexpected error getting dependencies for ${this.username}/${this.repo} using ${this.constructor.name}:`,
          error
        );
      }
      // Return empty set on error to avoid breaking subsequent operations
      return new Set<string>();
    }
    return this.techStack;
  }

  protected filter(deps: Iterable<string>): void {
    if (!this.dependencyMap) {
      console.warn(
        `Warning: No dependency map provided for ${this.constructor.name}.`
      );
      return;
    }
    const addedTech = new Set<string>(); // Track added tech to avoid duplicate logging
    for (const dep of deps) {
      // Normalize the dependency key if needed (e.g., lowercase) before lookup
      const normalizedDep = dep; //.toLowerCase(); // Optional: normalize if keys in map are lowercase
      if (normalizedDep in this.dependencyMap) {
        const tech = this.dependencyMap[normalizedDep];
        if (!this.techStack.has(tech)) {
          this.techStack.add(tech);
          addedTech.add(tech);
        }
      }
    }
    if (addedTech.size > 0) {
      console.log(
        `[${this.constructor.name}] Detected in ${this.manifestPath}${this.manifest}: ${Array.from(addedTech).join(", ")}`
      );
    }
  }
}

// --- Concrete Parser Implementations ---

class NodeParser extends TechStackParser {
  constructor(username: string, repo: string, path?: string) {
    super(username, repo, "package.json", NODE_DEPS, path);
  }

  protected parse(content: string): void {
    try {
      const data = JSON.parse(content);
      const dependencies = data.dependencies || {};
      const devDependencies = data.devDependencies || {};
      // Combine dependencies and devDependencies
      const allDeps = { ...dependencies, ...devDependencies };
      this.filter(Object.keys(allDeps));
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(
          `Error decoding JSON from ${this.manifestPath}${this.manifest} for ${this.username}/${this.repo}: ${error.message}`
        );
      } else {
        console.error(
          `Unexpected error during Node parsing for ${this.username}/${this.repo}:`,
          error
        );
      }
    }
  }
}

class PythonParser extends TechStackParser {
  constructor(username: string, repo: string, path?: string) {
    super(username, repo, "requirements.txt", PYTHON_DEPS, path);
    // TODO: Consider adding support for pyproject.toml and setup.py/cfg
  }

  protected parse(content: string): void {
    try {
      const lines = content.split("\n");
      const packageNames = lines
        .map((line) => this.parsePackageName(line))
        .filter((name): name is string => name !== null); // Type guard filters nulls
      this.filter(packageNames);
    } catch (error) {
      console.error(
        `Unexpected error during Python parsing for ${this.username}/${this.repo}:`,
        error
      );
    }
  }

  private parsePackageName(line: string): string | null {
    line = line.trim();
    // Ignore empty lines, comments, and editable installs for now
    if (!line || line.startsWith("#") || line.startsWith("-e")) {
      return null;
    }
    // Handle version specifiers (==, >=, <=, ~, <, >), extras ([...]), hashes (--hash=...) and URLs (@ ...)
    const mainPart = line.split(/[=<>~\[@\s]/)[0].trim();
    // Basic regex for valid package names (PEP 508 compatible-ish)
    const match = mainPart.match(/^([a-zA-Z0-9._-]+)/);
    if (match && match[1]) {
      // Normalize: lowercase and replace underscores/dots with hyphens (canonical name)
      return match[1].toLowerCase().replace(/[._]/g, "-");
    }
    return null;
  }
}

class JavaParser extends TechStackParser {
  constructor(username: string, repo: string, path?: string) {
    super(username, repo, "pom.xml", JAVA_DEPS, path);
    // TODO: Add support for Gradle (build.gradle / build.gradle.kts)
    // TODO: Consider parsing groupId as well for better accuracy
  }

  protected parse(content: string): void {
    // WARNING: Regex-based XML parsing is fragile. A proper XML parser is recommended for robustness.
    console.warn(
      `[JavaParser] Warning: Using regex to parse ${this.manifestPath}${this.manifest}. Results may be inaccurate for complex files.`
    );
    try {
      // Regex to find <artifactId> within <dependency> blocks (simplistic)
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
        error
      );
    }
  }
}

class DotNetParser extends TechStackParser {
  constructor(username: string, repo: string, path?: string) {
    // WARNING: This parser ONLY supports the legacy packages.config format.
    // Most modern .NET projects use <PackageReference> in .csproj files.
    // TODO: Implement robust .csproj parsing (requires XML parser and file searching).
    super(username, repo, "packages.config", DOTNET_DEPS, path);
  }

  protected parse(content: string): void {
    // WARNING: Regex-based XML parsing is fragile. A proper XML parser is recommended.
    // This parser is limited to packages.config and will NOT detect dependencies in modern .csproj files.
    console.warn(
      `[DotNetParser] Warning: Using regex to parse ${this.manifestPath}${this.manifest}. Only supports legacy packages.config, not .csproj. Results may be incomplete.`
    );
    try {
      // Regex for packages.config: extracts 'id' attribute from <package> tag
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
        error
      );
    }
  }
}

class RubyParser extends TechStackParser {
  constructor(username: string, repo: string, path?: string) {
    super(username, repo, "Gemfile", RUBY_DEPS, path);
    // TODO: Consider parsing Gemfile.lock for more precise dependencies (though Gemfile indicates intent)
  }

  protected parse(content: string): void {
    // WARNING: Regex-based Ruby code parsing can be unreliable due to Ruby's flexible syntax.
    console.warn(
      `[RubyParser] Warning: Using regex to parse ${this.manifestPath}${this.manifest}. May not capture all dependencies in complex Gemfiles.`
    );
    try {
      // Matches gem 'name' or gem "name", ignoring comments
      const gemRegex = /^\s*gem\s+['"]([^'"]+)['"]/gm; // Multiline search
      const dependencies: string[] = [];
      let match;
      while ((match = gemRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
      }
      this.filter(dependencies);
    } catch (error) {
      console.error(
        `Unexpected error during Ruby parsing for ${this.username}/${this.repo}:`,
        error
      );
    }
  }
}

class PHPParser extends TechStackParser {
  constructor(username: string, repo: string, path?: string) {
    super(username, repo, "composer.json", PHP_DEPS, path);
  }

  protected parse(content: string): void {
    try {
      const data = JSON.parse(content);
      // Includes both 'require' and 'require-dev' sections
      const dependencies = data.require || {};
      const devDependencies = data["require-dev"] || {};
      const allDeps = { ...dependencies, ...devDependencies };
      // Filter using the package names (keys), which are like 'vendor/package'
      this.filter(Object.keys(allDeps));
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(
          `Error decoding JSON from ${this.manifestPath}${this.manifest} for ${this.username}/${this.repo}: ${error.message}`
        );
      } else {
        console.error(
          `Unexpected error during PHP parsing for ${this.username}/${this.repo}:`,
          error
        );
      }
    }
  }
}

class GoParser extends TechStackParser {
  constructor(username: string, repo: string, path?: string) {
    super(username, repo, "go.mod", GO_DEPS, path);
    // TODO: Consider parsing go.sum for transitive dependencies if needed
  }

  protected parse(content: string): void {
    // Note: go.mod has a relatively simple line-based structure for requires, regex might be acceptable here.
    try {
      const dependencies = new Set<string>(); // Use Set to avoid duplicates

      // Matches single line requires: require module/path v1.2.3
      // Also matches lines inside require blocks
      // Ignores comments // and /* ... */ (basic handling)
      const requireLineRegex = /^\s*([a-zA-Z0-9._\/-]+)\s+v[^\s\/\\]+/gm;

      // Remove block comments first to simplify line matching
      const contentWithoutBlockComments = content.replace(
        /\/\*[\s\S]*?\*\//g,
        ""
      );

      let match;
      while (
        (match = requireLineRegex.exec(contentWithoutBlockComments)) !== null
      ) {
        // Check if the line starts with 'require' or is likely within a require block
        const lineStart =
          contentWithoutBlockComments
            .substring(0, match.index)
            .lastIndexOf("\n") + 1;
        const line = contentWithoutBlockComments.substring(
          lineStart,
          match.index + match[0].length
        );
        // Basic check to avoid matching module names outside require directives/blocks
        // and exclude the module declaration itself ('module my/module/name')
        if (
          (line.trim().startsWith(match[1]) || line.includes("require")) &&
          !line.trim().startsWith("module ")
        ) {
          dependencies.add(match[1]);
        }
      }

      // Filter using the full module paths (e.g., "github.com/gin-gonic/gin")
      this.filter(dependencies);
    } catch (error) {
      console.error(
        `Unexpected error during Go parsing for ${this.username}/${this.repo}:`,
        error
      );
    }
  }
}

class RustParser extends TechStackParser {
  constructor(username: string, repo: string, path?: string) {
    super(username, repo, "Cargo.toml", RUST_DEPS, path);
  }

  protected parse(content: string): void {
    // WARNING: Regex-based TOML parsing is highly unreliable due to TOML's complex syntax (tables, inline tables, arrays).
    // A proper TOML parser library is strongly recommended for accurate results.
    console.warn(
      `[RustParser] Warning: Using regex to parse ${this.manifestPath}${this.manifest}. TOML parsing with regex is fragile and may yield inaccurate results.`
    );
    try {
      const dependencies = new Set<string>(); // Use Set for uniqueness
      let inDependenciesSection = false;
      let inDevDependenciesSection = false;
      let inBuildDependenciesSection = false;
      // Basic regex to capture crate names at the start of a line before '=' or as a table header
      // e.g., crate_name = "..." or [dependencies.crate_name]
      const depRegex = /^\s*([a-zA-Z0-9_-]+)\s*=/;
      const tableHeaderRegex = /^\s*\[dependencies\.([a-zA-Z0-9_-]+)\]/; // Only for [dependencies.NAME] style

      for (const line of content.split("\n")) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("#")) continue; // Skip comments

        // Detect section headers
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
        // Detect end of relevant sections (start of another top-level table)
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
          // Match 'crate = ...'
          let match = depRegex.exec(trimmedLine);
          if (match) {
            dependencies.add(match[1]);
            continue; // Found dependency, move to next line
          }
          // Match '[dependencies.crate]' (less common for simple deps, but possible)
          // This regex specifically targets [dependencies.crate], adjust if needed for dev/build
          match = tableHeaderRegex.exec(trimmedLine);
          if (match && inDependenciesSection) {
            // Only applies to [dependencies.NAME] for now
            dependencies.add(match[1]);
          }
        }
      }

      this.filter(dependencies);
    } catch (error) {
      console.error(
        `Unexpected error during Rust parsing for ${this.username}/${this.repo}:`,
        error
      );
    }
  }
}

class DartParser extends TechStackParser {
  constructor(username: string, repo: string, path?: string) {
    super(username, repo, "pubspec.yaml", DART_DEPS, path);
  }

  protected parse(content: string): void {
    // WARNING: Regex/line-based YAML parsing is highly unreliable due to significant whitespace and complex structures.
    // A proper YAML parser library is strongly recommended for accurate results.
    console.warn(
      `[DartParser] Warning: Using line-based parsing for ${this.manifestPath}${this.manifest}. YAML parsing without a library is fragile and may yield inaccurate results.`
    );
    try {
      const dependencies = new Set<string>(); // Use Set for uniqueness
      let inDependenciesSection = false;
      let inDevDependenciesSection = false;
      let currentIndentation = -1; // Track indentation level of section headers

      for (const line of content.split("\n")) {
        // Calculate indentation (count leading spaces)
        const indentation = line.search(/\S|$/);
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith("#") || !trimmedLine) continue; // Skip comments and empty lines

        // Detect top-level keys and reset state if indentation decreases or is 0
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
            // Another top-level key, stop parsing deps sections
            inDependenciesSection = false;
            inDevDependenciesSection = false;
            currentIndentation = -1; // Reset section indentation
          }
        }

        // If we are inside a relevant section and the line is indented further
        if (
          (inDependenciesSection || inDevDependenciesSection) &&
          indentation > currentIndentation
        ) {
          // Match package name (key) at the start of the line
          const match = trimmedLine.match(/^([a-zA-Z0-9_]+):/);
          if (match) {
            dependencies.add(match[1]);
          }
        }
      }

      // Special case: Check for 'sdk: flutter' which indicates a Flutter project
      if (/\s*sdk:\s*flutter/.test(content)) {
        if (this.dependencyMap && "flutter" in this.dependencyMap) {
          const tech = this.dependencyMap["flutter"];
          if (!this.techStack.has(tech)) {
            this.techStack.add(tech);
            console.log(
              `[DartParser] Detected in ${this.manifestPath}${this.manifest}: Flutter (via sdk: flutter)`
            );
          }
        }
      }

      this.filter(dependencies);
    } catch (error) {
      console.error(
        `Unexpected error during Dart parsing for ${this.username}/${this.repo}:`,
        error
      );
    }
  }
}

class ElixirParser extends TechStackParser {
  constructor(username: string, repo: string, path?: string) {
    super(username, repo, "mix.exs", ELIXIR_DEPS, path);
  }

  protected parse(content: string): void {
    // WARNING: Regex-based parsing of Elixir source code is extremely fragile and likely to fail.
    // A proper AST parser or using `mix deps` would be far more reliable.
    console.warn(
      `[ElixirParser] Warning: Using regex to parse ${this.manifestPath}${this.manifest}. Elixir code parsing with regex is highly unreliable.`
    );
    try {
      const dependencies = new Set<string>(); // Use Set for uniqueness

      // Try to find the `deps` function definition more reliably
      // Looks for `defp deps do` or `def deps do` followed by `[` ... `]`
      const depsFunctionMatch = content.match(
        /defp?\s+deps\s+do\s*(\[[\s\S]*?\])\s*end/
      );

      let contentToSearch = "";
      if (depsFunctionMatch && depsFunctionMatch[1]) {
        contentToSearch = depsFunctionMatch[1]; // Search within the deps list
      } else {
        console.warn(
          `[ElixirParser] Could not reliably find deps function in ${this.manifestPath}${this.manifest}, falling back to searching the entire file (less accurate).`
        );
        contentToSearch = content; // Fallback to whole file
      }

      // Matches tuples like {:plug_cowboy, "~> 2.0"} or {:ecto_sql, github: "..."}
      // Captures the atom key (dependency name)
      const depRegex = /\{\s*:([a-zA-Z0-9_]+)\s*,[\s\S]*?\}/g;
      let match;
      while ((match = depRegex.exec(contentToSearch)) !== null) {
        dependencies.add(match[1]);
      }

      this.filter(dependencies);
    } catch (error) {
      console.error(
        `Unexpected error during Elixir parsing for ${this.username}/${this.repo}:`,
        error
      );
    }
  }
}

class DockerParser extends TechStackParser {
  constructor(username: string, repo: string, path?: string) {
    // Path can be specified if Dockerfile is not in root
    super(username, repo, "Dockerfile", DOCKER_DEPS, path);
    // TODO: Consider parsing docker-compose.yml as well
  }

  protected parse(content: string): void {
    // Note: Dockerfile syntax can have nuances (multi-stage builds, ARGs). Regex is decent but not perfect.
    try {
      // Matches FROM instructions, capturing the base image name (part before ':' or '@')
      // Handles optional stage names (AS builder) and platforms (--platform=...)
      // Case-insensitive (FROM/from), multiline
      const fromRegex =
        /^\s*FROM\s+(?:--platform=\S+\s+)?([^\s:@]+)(?:[:@][^\s]+)?(?:\s+AS\s+\S+)?/gim;
      const baseImages = new Set<string>(); // Use Set for uniqueness
      let match;
      while ((match = fromRegex.exec(content)) !== null) {
        // Extract only the base image name (e.g., 'node' from 'node:18-alpine', 'python' from 'python:3.9')
        // Already captured correctly by the regex group 1
        baseImages.add(match[1].toLowerCase()); // Normalize to lowercase for matching keys in DOCKER_DEPS
      }
      // Filter using the extracted base image names (normalized to lowercase)
      this.filter(baseImages);
    } catch (error) {
      console.error(
        `Unexpected error during Docker parsing for ${this.username}/${this.repo}:`,
        error
      );
    }
  }
}

// Export all parser classes
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
