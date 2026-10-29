import type * as React from "react";
import { cn } from "../utils";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
  className?: string;
  imgClassName?: string;
  alt?: string;
}

export function Logo({
  width,
  height,
  className,
  imgClassName,
  alt = "VICTOR CHASEX",
  ...args
}: LogoProps) {
  return (
    <div className={cn("flex items-center", className)} {...args}>
      <img
        src="/victor-chasex-logo.jpg"
        alt={alt}
        className={cn("h-8 max-h-8 w-auto object-contain rounded", imgClassName)}
        style={{
          aspectRatio: "661 / 211",
          ...(height ? { maxHeight: typeof height === "number" ? `${height}px` : height } : {}),
        }}
      />
    </div>
  );
}

