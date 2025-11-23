import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Users, Shield, TrendingUp } from "lucide-react";

export function FeatureGrid() {
  const features = [
    {
      icon: Palette,
      title: "Create Collections",
      description: "Deploy ERC721 and ERC1155 collections with smart contracts"
    },
    {
      icon: Users,
      title: "Secure Trading",
      description: "Peer-to-peer marketplace with smart contract enforcement"
    },
    {
      icon: Shield,
      title: "Verified Contracts",
      description: "Audited smart contracts ensuring safe transactions"
    },
    {
      icon: TrendingUp,
      title: "Real-time Data",
      description: "Live blockchain data with automatic price updates"
    }
  ];

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Zuno Marketplace?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Built with the latest technology and best practices in mind
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}