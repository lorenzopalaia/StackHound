import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Hero = () => {
  return (
    <Card className="w-full max-w-3xl border-none">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl md:text-4xl font-bold">
          GitHub API Limitations? StackHound Has the Solution.
        </CardTitle>
        <CardDescription className="text-lg md:text-xl max-w-3xl mx-auto">
          The standard <strong>GitHub API</strong> provides information about{" "}
          programming languages used in repositories, but it often lacks the
          granularity to identify specific <strong>frameworks</strong> and{" "}
          <strong>technologies</strong>. <strong>StackHound</strong> overcomes
          this limitation, offering deeper insights into the{" "}
          <strong>tech stacks</strong> used in projects.
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
