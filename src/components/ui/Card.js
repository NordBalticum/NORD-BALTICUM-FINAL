"use client";

import { cn } from "@/lib/utils";

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-800 bg-neutral-900 text-white shadow-md",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("p-4 border-b border-neutral-800", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return (
    <div
      className={cn("p-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn("p-4 border-t border-neutral-800", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardContent, CardFooter };
