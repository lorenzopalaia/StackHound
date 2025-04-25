[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<div id="top"></div>

<br />
<div align="center">
  <a href="https://github.com/lorenzopalaia/stackhound">
    <img src="repo_assets/logo.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">StackHound</h3>
  <p align="center">
    A web application built with Next.js that analyzes dependency files from public GitHub repositories to identify the technology stack used.
    <br />
    <a href="https://stackhound.vercel.app/">View Demo</a>
    ·
    <a href="https://github.com/lorenzopalaia/stackhound/issues">Report Bug</a>
    ·
    <a href="https://github.com/lorenzopalaia/stackhound/issues">Request Feature</a>
  </p>
</div>

<!-- ABOUT THE PROJECT -->

## About The Project

StackHound provides a simple interface and an API to determine the technologies used in a public **or private** GitHub repository by analyzing its dependency files.

Key Features:

- **Simple Web Interface:** Enter a GitHub username and repository name to view the detected technology stack. **Supports private repositories via Personal Access Tokens.**
- **API Endpoint:** An `/api/analyze` API endpoint to programmatically query the technology stack. **Supports authentication for private repositories.**
- **Multi-Language Support:** Detects dependencies for various languages and package managers, including:
  - JavaScript/TypeScript (package.json)
  - Python (requirements.txt)
  - Java (pom.xml)
  - .NET (packages.config - _.csproj support TODO_)
  - Ruby (Gemfile)
  - PHP (composer.json)
  - Go (go.mod)
  - Rust (Cargo.toml)
  - Dart (pubspec.yaml)
  - Elixir (mix.exs)
  - Docker (Dockerfile - _detects base image_)

// ...existing code...

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/lorenzopalaia/stackhound.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  **(Optional) For local development requiring access to the GitHub API (e.g., testing against private repos or avoiding rate limits):** Create a GitHub Personal Access Token with `repo` scope (or `public_repo` if only analyzing public repos). Create a `.env.local` file in the root directory and add your token. This token is used by the _local server_ when making requests to GitHub.
    ```env
    # .env.local
    GITHUB_TOKEN=YOUR_GITHUB_TOKEN
    ```
    **Note:** When calling the deployed API or your local API endpoint from your own applications, you'll need to provide the token in the request header as shown in the API Usage section.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

### API Usage

You can also query the StackHound API directly.

**Endpoint:** `/api/analyze` (or `http://localhost:3000/api/analyze` when running locally)

**Method:** `GET`

**Query Parameters:**

- `username` (required): The GitHub username.
- `repo` (required): The GitHub repository name.

**Headers (Optional, for private repositories):**

- `Authorization`: `Bearer YOUR_GITHUB_TOKEN`
  _or_
- `X-GitHub-Token`: `YOUR_GITHUB_TOKEN`

Provide a GitHub Personal Access Token with the necessary scope (`repo` for private repositories, `public_repo` might suffice for public ones) in one of these headers to analyze private repositories. **Handle your tokens securely and avoid exposing them.**

**Example (cURL):**

```bash
# Analyze a public repository
curl "https://stackhound.vercel.app/api/analyze?username=lorenzopalaia&repo=stackhound"

# Analyze a private repository using Authorization header
curl -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
     "https://stackhound.vercel.app/api/analyze?username=YOUR_USERNAME&repo=YOUR_PRIVATE_REPO"

# Analyze a private repository using X-GitHub-Token header (alternative)
curl -H "X-GitHub-Token: YOUR_GITHUB_TOKEN" \
     "https://stackhound.vercel.app/api/analyze?username=YOUR_USERNAME&repo=YOUR_PRIVATE_REPO"

# Using the local version (public repo)
curl "http://localhost:3000/api/analyze?username=lorenzopalaia&repo=stackhound"
```

The API will return a JSON response containing the detected technologies.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->

[contributors-shield]: https://img.shields.io/github/contributors/lorenzopalaia/stackhound.svg?style=for-the-badge
[contributors-url]: https://github.com/lorenzopalaia/stackhound/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/lorenzopalaia/stackhound.svg?style=for-the-badge
[forks-url]: https://github.com/lorenzopalaia/stackhound/network/members
[stars-shield]: https://img.shields.io/github/stars/lorenzopalaia/stackhound.svg?style=for-the-badge
[stars-url]: https://github.com/lorenzopalaia/stackhound/stargazers
[issues-shield]: https://img.shields.io/github/issues/lorenzopalaia/stackhound.svg?style=for-the-badge
[issues-url]: https://github.com/lorenzopalaia/stackhound/issues
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/lorenzo-palaia-7177a5202

<!-- [product-screenshot]: repo_assets/preview.png -->
