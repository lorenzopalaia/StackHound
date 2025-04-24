"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AnalysisResult {
  techStack: string[];
}

export const DemoSection = () => {
  const [username, setUsername] = useState("");
  const [repo, setRepo] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!username || !repo || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/analyze?username=${username}&repo=${repo}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
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

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">StackHound Demo 🐶</CardTitle>
        <CardDescription className="text-md">
          Enter a GitHub username and repository to analyze the tech stack used.
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
          />
          <Input
            id="repo"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="Repository Name"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
            aria-label="GitHub Repository"
          />
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
          <div className="text-center text-sm text-red-500">
            <p>Error: {error}</p>
          </div>
        )}

        {result && !isLoading && (
          <div className="text-center">
            <h3 className="mb-2 text-lg font-semibold">Tech Stack Used:</h3>
            {result.techStack.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                {result.techStack.map((tech: string, index: number) => (
                  <Badge key={index}>{tech}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No specific tech stack detected or repository might be
                empty/inaccessible.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
