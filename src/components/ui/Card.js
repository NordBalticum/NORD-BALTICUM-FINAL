"use client";

import { cn } from "@/lib/utils";

function Card({ className, glow = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-800 bg-neutral-900/90 text-white shadow-xl backdrop-blur-md transition-all",
        glow && "hover:ring-1 hover:ring-[#8247e5]/40",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn(
        "p-5 border-b border-neutral-800 text-lg font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return (
    <div className={cn("p-6 space-y-4", className)} {...props} />
  );
}

function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "p-4 border-t border-neutral-800 flex items-center justify-end gap-2",
        className
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardContent, CardFooter };
