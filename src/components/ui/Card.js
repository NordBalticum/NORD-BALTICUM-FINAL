"use client";

import { cn } from "@/lib/utils";

function Card({ className, glow = false, hoverable = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-gradient-to-br from-[#111] to-[#1c1c1c] text-white shadow-[0_4px_32px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 ease-in-out",
        glow && "hover:ring-2 hover:ring-[#7f5af0]/40",
        hoverable && "hover:scale-[1.015]",
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
        "px-6 py-4 border-b border-white/10 text-lg font-semibold tracking-tight flex items-center gap-2",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return (
    <div
      className={cn("px-6 py-5 text-sm leading-relaxed space-y-4", className)}
      {...props}
    />
  );
}

function CardFooter({ className, align = "end", ...props }) {
  const alignment = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
  };

  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-white/10 flex items-center gap-3",
        alignment[align] || "justify-end",
        className
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardContent, CardFooter };
