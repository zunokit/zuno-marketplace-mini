import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-16 bg-muted/50">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of users trading NFTs on our secure marketplace.
          Create, buy, sell, and collect digital assets with confidence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/marketplace">Start Trading</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/collections/create">Create Collection</Link>
          </Button>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>Built with Zuno Marketplace SDK v1.1.4</p>
          <p className="mt-2">Smart Contract Powered • Gas Optimized • Type Safe</p>
        </div>
      </div>
    </section>
  );
}