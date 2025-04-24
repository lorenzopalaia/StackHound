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
import { Clipboard, Check } from "lucide-react";

export const ApiUsageSection = () => {
  const [apiClient, setApiClient] = useState("curl");
  const [apiUrlBase, setApiUrlBase] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setApiUrlBase(
      `${window.location.origin}/api/analyze?username=YOUR_USERNAME&repo=YOUR_REPO`
    );
  }, []);

  const getApiCodeSnippet = () => {
    if (!apiUrlBase) {
      return "Loading API URL...";
    }
    switch (apiClient) {
      case "curl":
        return `curl "${apiUrlBase}"`;
      case "fetch":
        return `fetch("${apiUrlBase}")
  .then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  return response.json();
  })
  .then(data => {
  console.log(data);
  
  })
  .catch(error => {
  console.error('There has been a problem with your fetch operation:', error);
  });`;
      case "axios":
        return `import axios from 'axios';
import { AxiosError } from 'axios';

const apiUrl = "${apiUrlBase}";

axios.get(apiUrl)
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

try:
  response = requests.get(url)
  response.raise_for_status() # Raises an HTTPError for bad responses (4XX or 5XX)
  data = response.json()
  print(json.dumps(data, indent=2))
  # data will be like: {'techStack': ['React', 'TypeScript', ...]}
except requests.exceptions.RequestException as e:
  print(f"Error fetching data: {e}")
except json.JSONDecodeError:
  print("Error decoding JSON response")
`;
      case "powershell":
        return `try {
  $response = Invoke-RestMethod -Uri "${apiUrlBase}" -Method Get
  # $response will contain the parsed JSON object
  Write-Host ($response | ConvertTo-Json -Depth 5)
} catch {
  Write-Error "Error fetching data: $_"
  if ($_.Exception.Response) {
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $errorBody = $streamReader.ReadToEnd()
    $streamReader.Close()
    Write-Error "Error body: $errorBody"
  }
}`;
      case "ruby":
        return `require 'net/http'
require 'json'
require 'uri'

url = URI("${apiUrlBase}")

begin
  response = Net::HTTP.get_response(url)
  response.value # Raises an error for non-2xx responses

  data = JSON.parse(response.body)
  puts JSON.pretty_generate(data)
  # data will be like: {"techStack"=>["React", "TypeScript", ...]}
rescue StandardError => e
  puts "Error fetching data: #{e.message}"
  if e.respond_to?(:response) && e.response
  puts "Response body: #{e.response.body}"
  end
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
      }
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
          You can also query the StackHound API directly. The endpoint{" "}
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
          , etc.) from the public GitHub repository and returns the detected
          technologies.
        </p>

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
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 cursor-pointer"
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
          </code>{" "}
          and{" "}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
            YOUR_REPO
          </code>
          .
        </p>
      </CardContent>
    </Card>
  );
};
