"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Palette,
  Twitter,
  Github,
  Disc,
  Mail,
  ExternalLink,
  Heart,
} from "lucide-react";

const footerLinks = {
  marketplace: [
    { label: "Browse", href: "/marketplace" },
    { label: "Collections", href: "/collections" },
    { label: "Auctions", href: "/auctions" },
    { label: "Analytics", href: "/analytics" },
  ],
  create: [
    { label: "Create Collection", href: "/collections/create" },
    { label: "Mint NFT", href: "/nft/mint" },
    { label: "Start Auction", href: "/auctions/create" },
    { label: "Create Bundle", href: "/bundles/create" },
  ],
  resources: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/api-docs" },
    { label: "Help Center", href: "/help" },
    { label: "Blog", href: "/blog" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press Kit", href: "/press" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "DMCA", href: "/dmca" },
  ],
};

const socialLinks = [
  {
    name: "Twitter",
    href: "https://twitter.com/zuno",
    icon: Twitter,
  },
  {
    name: "Discord",
    href: "https://discord.gg/zuno",
    icon: Disc,
  },
  {
    name: "GitHub",
    href: "https://github.com/zuno",
    icon: Github,
  },
  {
    name: "Email",
    href: "mailto:hello@zuno.io",
    icon: Mail,
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 mb-6 lg:mb-0">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Palette className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Zuno</span>
            </div>

            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-sm">
              The premier destination for discovering, creating, and trading
              extraordinary NFTs. Built on Ethereum with love for the community.
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-2">
              {socialLinks.map((social) => (
                <Button
                  key={social.name}
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-9 w-9 p-0"
                >
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Marketplace Links */}
          <div>
            <h3 className="font-semibold mb-4">Marketplace</h3>
            <ul className="space-y-3">
              {footerLinks.marketplace.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Create Links */}
          <div>
            <h3 className="font-semibold mb-4">Create</h3>
            <ul className="space-y-3">
              {footerLinks.create.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
            <span>© 2024 Zuno. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-current" />{" "}
              for the NFT community
            </span>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            {footerLinks.legal.map((link, index) => (
              <div key={link.href} className="flex items-center">
                <Link
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
                {index < footerLinks.legal.length - 1 && (
                  <span className="text-muted-foreground ml-2 sm:ml-4 hidden sm:inline">•</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div className="text-center sm:text-left">
              <p className="font-medium mb-1">Network Status</p>
              <p>Ethereum Mainnet • All systems operational</p>
            </div>

            <div className="text-center sm:text-left">
              <p className="font-medium mb-1">Gas Tracker</p>
              <p>Standard: ~15 gwei • Fast: ~20 gwei</p>
            </div>

            <div className="text-center sm:text-left">
              <p className="font-medium mb-1">Floor Prices</p>
              <p>Updated every 5 minutes</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
