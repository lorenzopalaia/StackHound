import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ProductHuntBadge = () => {
  return (
    <Link
      href="https://www.producthunt.com/posts/stackhound?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-stackhound"
      target="_blank"
    >
      <Image
        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=957782&theme=dark&t=1745591413819"
        alt="StackHound - Github&#0032;tech&#0032;stack&#0032;analyzer | Product Hunt"
        style={{ width: "250px", height: "54px" }}
        width="250"
        height="54"
      />
    </Link>
  );
};

export const Hero = () => {
  return (
    <Card className="w-full max-w-3xl border-none">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <ProductHuntBadge />
        </div>
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
