import React from "react";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";

export interface RetrodLogoProps {
  className?: string;
  variant?: "dark" | "light" | "auto";
  collapsed?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RetrodLogo({
  className,
  variant = "dark",
  collapsed = false,
  size = "md",
}: RetrodLogoProps) {
  if (collapsed) {
    return (
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl font-sans font-black tracking-tighter text-[19px] transition-transform hover:scale-105 select-none bg-gradient-to-br from-[#b40f61] to-[#8d0749] text-white shadow-md shadow-[#b40f61]/20",
          className,
        )}
      >
        <span>R</span>
        <span className="text-white/80 font-black">.</span>
      </div>
    );
  }

  const heightClasses = {
    sm: "h-6 max-h-6",
    md: "h-7 max-h-7",
    lg: "h-11 max-h-11",
  }[size];

  return (
    <div
      className={cn(
        "inline-flex items-center select-none bg-transparent transition-transform hover:scale-[1.02]",
        heightClasses,
        className,
      )}
    >
      <img
        src={logoImg}
        alt="Retrod Travel Tech"
        className={cn("h-full w-auto object-contain block bg-transparent", heightClasses)}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

export default RetrodLogo;

