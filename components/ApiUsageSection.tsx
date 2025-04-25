"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CodeBlock } from "@/components/ui/code-block";
import { Button } from "@/components/ui/button";
import { Clipboard, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const ApiUsageSection = () => {
  const [apiClient, setApiClient] = useState("curl");
  const [apiUrlBase, setApiUrlBase] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setApiUrlBase(
        `${window.location.origin}/api/analyze?username=YOUR_USERNAME&repo=YOUR_REPO`,
      );
    }
  }, []);

  const getApiCodeSnippet = () => {
    if (!apiUrlBase) {
      return "Loading API URL...";
    }
    const tokenPlaceholder = "YOUR_GITHUB_TOKEN";

    switch (apiClient) {
      case "curl":
        return `# For public repos:
curl "${apiUrlBase}"

# For private repos (replace ${tokenPlaceholder}):
curl -H "Authorization: Bearer ${tokenPlaceholder}" "${apiUrlBase}"
# or alternatively:
curl -H "X-GitHub-Token: ${tokenPlaceholder}" "${apiUrlBase}"`;

      case "fetch":
        return `const url = "${apiUrlBase}";
const token = "${tokenPlaceholder}"; 

const headers = {
  'Content-Type': 'application/json',
};

fetch(url, { headers })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => { 
        throw new Error(\`HTTP error! status: \${response.status}, message: \${text}\`);
      });
    }
    return response.json();
  })
  .then(data => {
    console.log(data);    
  })
  .catch(error => {
    console.error('Fetch error:', error);
  });`;

      case "axios":
        return `import axios, { AxiosError } from 'axios';

const apiUrl = "${apiUrlBase}";
const token = "${tokenPlaceholder}"; 

const config = {
  headers: {}
};

axios.get(apiUrl, config)
  .then(response => {
    console.log(response.data);
  })
  .catch((error: AxiosError) => {
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  });`;

      case "python":
        return `import requests
import json

url = "${apiUrlBase}"
token = "${tokenPlaceholder}" # Replace with your actual token for private repos

headers = {
    # Uncomment the next line and add your token for private repos
    # 'Authorization': f'Bearer {token}',
    # 'X-GitHub-Token': token, # Alternative header
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status() # Raises HTTPError for bad responses (4XX or 5XX)
    data = response.json()
    print(json.dumps(data, indent=2))
    # data will be like: {'techStack': ['React', 'TypeScript', ...]}
except requests.exceptions.HTTPError as http_err:
    print(f"HTTP error occurred: {http_err} - {response.text}")
except requests.exceptions.RequestException as req_err:
    print(f"Request error occurred: {req_err}")
except json.JSONDecodeError:
    print(f"Error decoding JSON response: {response.text}")
`;

      case "powershell":
        return `$url = "${apiUrlBase}"
$token = "${tokenPlaceholder}" # Replace with your actual token for private repos

$headers = @{
    # Uncomment the next line and add your token for private repos
    # "Authorization" = "Bearer $token"
    # "X-GitHub-Token" = $token # Alternative header
}

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    # $response will contain the parsed JSON object
    Write-Host ($response | ConvertTo-Json -Depth 5)
} catch {
    Write-Error "Error fetching data: $_"
    if ($_.Exception.Response) {
        try {
            $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $errorBody = $streamReader.ReadToEnd()
            $streamReader.Close()
            Write-Error "Error status: $($_.Exception.Response.StatusCode)"
            Write-Error "Error body: $errorBody"
        } catch {
            Write-Error "Could not read error response body."
        }
    }
}`;

      case "ruby":
        return `require 'net/http'
require 'json'
require 'uri'

url = URI("${apiUrlBase}")
token = "${tokenPlaceholder}" # Replace with your actual token for private repos

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = (url.scheme == 'https')

request = Net::HTTP::Get.new(url)
# Uncomment the next line and add your token for private repos
# request["Authorization"] = "Bearer \#{token}"
# request["X-GitHub-Token"] = token # Alternative header

begin
  response = http.request(request)

  if response.is_a?(Net::HTTPSuccess)
    data = JSON.parse(response.body)
    puts JSON.pretty_generate(data)
    # data will be like: {"techStack"=>["React", "TypeScript", ...]}
  else
    puts "HTTP Error: \#{response.code} \#{response.message}"
    puts "Response body: \#{response.body}"
  end
rescue StandardError => e
  puts "Error fetching data: \#{e.message}"
end
`;
      default:
        return "Select a client to see the code snippet.";
    }
  };

  const handleCopy = () => {
    const codeToCopy = getApiCodeSnippet();
    navigator.clipboard.writeText(codeToCopy).then(
      () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        console.error("Failed to copy text: ", err);
      },
    );
  };

  const currentCode = getApiCodeSnippet();
  const currentLanguage =
    apiClient === "curl"
      ? "bash"
      : apiClient === "fetch" || apiClient === "axios"
        ? "javascript"
        : apiClient === "python"
          ? "python"
          : apiClient === "powershell"
            ? "powershell"
            : apiClient === "ruby"
              ? "ruby"
              : "";

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">API Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You can query the StackHound API directly. The endpoint{" "}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            /api/analyze
          </code>{" "}
          accepts{" "}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            username
          </code>{" "}
          and{" "}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            repo
          </code>{" "}
          query parameters.
        </p>
        <p className="text-sm text-muted-foreground">
          It analyzes dependency files (like{" "}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            package.json
          </code>
          ,{" "}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            requirements.txt
          </code>
          , etc.) from the GitHub repository and returns the detected
          technologies.
        </p>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Private Repositories</AlertTitle>
          <AlertDescription className="inline">
            To analyze private repositories, you need to provide a GitHub
            Personal Access Token (PAT) with the appropriate scope (e.g.,{" "}
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
              repo
            </code>
            ) in the request header. Use either{" "}
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
              Authorization: Bearer YOUR_TOKEN
            </code>{" "}
            or{" "}
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
              X-GitHub-Token: YOUR_TOKEN
            </code>
            . See the code examples below.{" "}
            <strong>Handle your tokens securely.</strong>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="api-client-select" className="text-sm font-medium">
            Show example for:
          </Label>
          <Select value={apiClient} onValueChange={setApiClient}>
            <SelectTrigger id="api-client-select" className="w-[180px]">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="curl">cURL</SelectItem>
              <SelectItem value="fetch">JavaScript (fetch)</SelectItem>
              <SelectItem value="axios">JavaScript (axios)</SelectItem>
              <SelectItem value="python">Python (requests)</SelectItem>
              <SelectItem value="powershell">PowerShell</SelectItem>
              <SelectItem value="ruby">Ruby (Net::HTTP)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 h-7 w-7 cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={handleCopy}
            aria-label="Copy code snippet"
          >
            {isCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
          </Button>
          <CodeBlock language={currentLanguage} code={currentCode} />
        </div>
        <p className="text-xs text-muted-foreground">
          Remember to replace{" "}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
            YOUR_USERNAME
          </code>
          ,{" "}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
            YOUR_REPO
          </code>
          , and{" "}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
            YOUR_GITHUB_TOKEN
          </code>{" "}
          where applicable.
        </p>
      </CardContent>
    </Card>
  );
};
