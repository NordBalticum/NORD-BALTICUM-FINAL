"use client";

import React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
