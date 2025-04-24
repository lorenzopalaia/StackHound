# StackHound 🐶

StackHound is a web application built with Next.js that analyzes dependency files from public GitHub repositories to identify the technology stack used.

## ✨ Features

- **Simple Web Interface:** Enter a GitHub username and repository name to view the detected technology stack.
- **API Endpoint:** An `/api/analyze` API endpoint to programmatically query the technology stack.
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
- **Built with Modern Technologies:** Next.js, React, TypeScript, Tailwind CSS, Shadcn/ui.

## 🚀 Demo

The application features a user interface for easy testing of the analysis:

1.  Enter the GitHub username in the first field.
2.  Enter the repository name in the second field.
3.  Click "Analyze".
4.  The detected technology stack will be displayed as badges.

_(You can add a screenshot or GIF here if you wish)_

## ⚙️ API Usage

You can also query the StackHound API directly.

**Endpoint:** `/api/analyze`

**Method:** `GET`

**Query Parameters:**

- `username` (required): The GitHub username.
- `repo` (required): The GitHub repository name.

**Example (cURL):**

```bash
curl "YOUR_APP_URL/api/analyze?username=vercel&repo=next.js"
```
