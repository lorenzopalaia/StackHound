import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="mt-auto w-full text-right text-xs text-muted-foreground pr-4 md:pr-8 pb-4">
      Theme by{" "}
      <Link
        href="https://tweakcn.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-primary transition-colors font-semibold"
      >
        tweakcn
      </Link>
    </footer>
  );
};
