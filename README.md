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

StackHound provides a simple interface and an API to determine the technologies used in a public GitHub repository by analyzing its dependency files.

Key Features:

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

<p align="right">(<a href="#top">back to top</a>)</p>

### Built With

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

- npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/lorenzopalaia/stackhound.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  You might need a GitHub Personal Access Token with `public_repo` scope for the GitHub API. Create a `.env.local` file in the root directory and add your token:
    ```env
    GITHUB_TOKEN=YOUR_GITHUB_TOKEN
    ```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

### API Usage

You can also query the StackHound API directly.

**Endpoint:** `/api/analyze` (or `http://localhost:3000/api/analyze` when running locally)

**Method:** `GET`

**Query Parameters:**

- `username` (required): The GitHub username.
- `repo` (required): The GitHub repository name.

**Example (cURL):**

```bash
# Using the deployed version
curl "https://stackhound.vercel.app/api/analyze?username=lorenzopalaia&repo=stackhound"

# Using the local version
curl "http://localhost:3000/api/analyze?username=lorenzopalaia&repo=stackhound"
```

The API will return a JSON response containing the detected technologies.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` file for more information.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Lorenzo Palaia - [@lorenzopalaia](https://twitter.com/lorenzopalaia) - lorenzopalaia53@gmail.com

Project Link: [https://github.com/lorenzopalaia/stackhound](https://github.com/lorenzopalaia/stackhound)

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
