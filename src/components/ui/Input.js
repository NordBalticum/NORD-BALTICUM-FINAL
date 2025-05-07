"use client";

import React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl bg-neutral-900/90 border border-neutral-700 px-4 py-2 text-white placeholder-neutral-500 backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8247e5]/60 focus:border-[#8247e5]",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
