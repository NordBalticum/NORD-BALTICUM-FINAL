"use client";

import React from "react";
import { cn } from "@/lib/utils";

const Button = React.forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      shadow = true,
      glow = false,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-gradient-to-r from-[#8247e5] via-[#4b0082] to-[#1a237e] text-white hover:brightness-110",
      secondary:
        "bg-[#1a237e] text-white hover:bg-[#0f154d]",
      outline:
        "border border-neutral-600 bg-transparent text-white hover:bg-neutral-900",
      ghost: "bg-transparent text-white hover:bg-neutral-800",
    };

    const sizes = {
      sm: "text-sm px-3 py-1.5",
      md: "text-base px-4 py-2",
      lg: "text-lg px-5 py-3",
    };

    const shadows = shadow
      ? "shadow-lg hover:shadow-xl"
      : "shadow-none";

    const glowStyle = glow
      ? "hover:ring-2 hover:ring-[#8247e5]/50"
      : "";

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], shadows, glowStyle, className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
