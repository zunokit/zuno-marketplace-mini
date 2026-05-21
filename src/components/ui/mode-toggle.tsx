"use client";

import * as React from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ThemeChoice = "light" | "dark" | "system";

const CHOICES: { value: ThemeChoice; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="h-4 w-4" aria-hidden /> },
  { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" aria-hidden /> },
  { value: "system", label: "System", icon: <Monitor className="h-4 w-4" aria-hidden /> },
];

/**
 * 3-way theme toggle: Light / Dark / System.
 *
 * Renders a tooltip-wrapped icon button that opens a small menu. The
 * trigger icon reflects the active theme (the resolved one, not the
 * stored choice — so picking "System" while the OS is dark shows the
 * moon icon).
 *
 * Replaces the previous bare 2-state toggle so users can defer to their
 * OS preference, which is the expected default for accessibility.
 */
export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // SSR / hydration guard — render a stable placeholder so the server and
  // client agree on the first paint and `useTheme()` is hydrated by the
  // time we read it.
  const activeChoice: ThemeChoice = (theme as ThemeChoice | undefined) ?? "system";
  const effective = mounted ? resolvedTheme ?? "dark" : "dark";
  const triggerIcon =
    effective === "light" ? (
      <Sun className="h-[1.2rem] w-[1.2rem]" aria-hidden />
    ) : (
      <Moon className="h-[1.2rem] w-[1.2rem]" aria-hidden />
    );

  const triggerLabel = mounted
    ? `Theme: ${activeChoice === "system" ? `system (${effective})` : activeChoice}`
    : "Theme";

  return (
    <TooltipProvider delayDuration={200}>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={triggerLabel}
              >
                {triggerIcon}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{triggerLabel}</TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {CHOICES.map((choice) => (
            <DropdownMenuItem
              key={choice.value}
              onSelect={() => setTheme(choice.value)}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                {choice.icon}
                {choice.label}
              </span>
              {activeChoice === choice.value ? (
                <Check className="h-4 w-4 opacity-80" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
