"use client";

import React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, glow = true, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl bg-[#111111]/90 border border-white/10 px-4 py-3 text-white placeholder-white/40 shadow-sm backdrop-blur-md transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#00bfff]/60 focus:border-[#00bfff]",
        glow && "hover:ring-1 hover:ring-[#00bfff]/40",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
