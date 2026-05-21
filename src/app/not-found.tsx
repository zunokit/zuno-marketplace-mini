import Link from "next/link";
import { Compass, Gavel, LayoutGrid, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "404 - Page not found",
  description:
    "The page you're looking for doesn't exist or has been moved.",
};

const popularDestinations = [
  {
    href: "/marketplace",
    label: "Marketplace",
    description: "Browse listed NFTs across collections.",
    icon: LayoutGrid,
  },
  {
    href: "/collections",
    label: "Collections",
    description: "Explore and create NFT collections.",
    icon: Compass,
  },
  {
    href: "/auctions",
    label: "Auctions",
    description: "Bid on live English and Dutch auctions.",
    icon: Gavel,
  },
  {
    href: "/mint",
    label: "Mint",
    description: "Mint a new NFT to a collection.",
    icon: Sparkles,
  },
];

export default function NotFound() {
  return (
    <main
      className="flex items-center justify-center min-h-screen p-4 md:p-8"
      data-testid="not-found-page"
    >
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-sm font-mono uppercase tracking-wide text-primary">
            Error 404
          </p>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
            Page not found
          </h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild data-testid="not-found-home">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline" data-testid="not-found-marketplace">
            <Link href="/marketplace">Go to marketplace</Link>
          </Button>
        </div>

        <section
          aria-labelledby="popular-destinations-heading"
          className="text-left"
          data-testid="not-found-popular"
        >
          <h2
            id="popular-destinations-heading"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center sm:text-left"
          >
            Popular destinations
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {popularDestinations.map(
              ({ href, label, description, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group flex items-start gap-3 rounded-md border p-3 hover:bg-accent/40 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">
                        {description}
                      </div>
                    </div>
                  </Link>
                </li>
              ),
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
