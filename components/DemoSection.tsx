"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AnalysisResult {
  techStack: string[];
}

export const DemoSection = () => {
  const [username, setUsername] = useState("");
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!username || !repo || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["X-GitHub-Token"] = token;
      }

      const response = await fetch(
        `/api/analyze?username=${username}&repo=${repo}`,
        { headers },
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          console.error("Error parsing error response:", e);
          throw new Error(
            `HTTP error! status: ${response.status} ${response.statusText}`,
          );
        }

        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">StackHound Demo</CardTitle>
        <CardDescription className="text-md">
          Enter a GitHub username and repository to analyze the tech stack.
          Provide a token for private repositories.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="GitHub Username"
            disabled={isLoading}
            aria-label="GitHub Username"
            onKeyDown={handleKeyDown}
          />

          <Input
            id="repo"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="Repository Name"
            disabled={isLoading}
            aria-label="GitHub Repository"
            onKeyDown={handleKeyDown}
          />

          <div className="space-y-1 pt-2">
            <Label htmlFor="token" className="text-sm font-medium">
              GitHub Token (Optional, for private repos)
            </Label>
            <Input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              disabled={isLoading}
              aria-label="GitHub Personal Access Token"
              className="font-mono"
              onKeyDown={handleKeyDown}
            />
            <p className="text-xs text-muted-foreground">
              Requires a{" "}
              <a
                href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Personal Access Token
              </a>{" "}
              with the <code className="text-xs font-semibold">repo</code> scope
              (or <code className="text-xs font-semibold">public_repo</code> for
              public repos only). Manage your tokens securely.
            </p>
          </div>
        </div>

        <Button
          className="w-full cursor-pointer"
          onClick={handleSubmit}
          disabled={isLoading || !username || !repo}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Analyzing..." : "Analyze"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && !isLoading && (
          <div className="text-center">
            <h3 className="mb-2 text-lg font-semibold">Detected Tech Stack:</h3>
            {result.techStack.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                {result.techStack.map((tech: string, index: number) => (
                  <Badge key={index}>{tech}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No specific tech stack detected, or the repository might be
                empty/inaccessible. Check the repo name and token if it&apos;s
                private.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
