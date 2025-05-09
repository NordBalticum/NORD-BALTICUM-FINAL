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
      gradient = false,
      full = false,
      icon,
      iconRight,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none";

    const variants = {
      primary:
        "bg-gradient-to-r from-[#7f5af0] to-[#6246ea] text-white hover:brightness-110",
      secondary:
        "bg-[#1a1a1a] text-white border border-neutral-700 hover:bg-[#2a2a2a]",
      outline:
        "border border-neutral-600 text-white hover:bg-neutral-900",
      ghost: "bg-transparent text-white hover:bg-neutral-800",
    };

    const sizes = {
      xs: "text-xs px-3 py-1",
      sm: "text-sm px-3.5 py-1.5",
      md: "text-base px-4 py-2",
      lg: "text-lg px-5 py-3",
      xl: "text-xl px-6 py-3.5",
    };

    const shadowStyle = shadow ? "shadow-md hover:shadow-lg" : "";
    const glowStyle = glow ? "hover:ring-2 hover:ring-[#7f5af0]/60" : "";
    const gradientBorder = gradient ? "border border-white/10 backdrop-blur" : "";
    const fullWidth = full ? "w-full" : "";

    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          shadowStyle,
          glowStyle,
          gradientBorder,
          fullWidth,
          className
        )}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {props.children}
        {iconRight && <span className="ml-2">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
