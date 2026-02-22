"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  onDismiss?: () => void;
  selected?: boolean;
}

export function Chip({
  onDismiss,
  selected,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border transition-colors",
        selected
          ? "bg-brand text-white border-brand"
          : "bg-bg-secondary text-text-secondary border-border-default hover:border-border-strong",
        className
      )}
      {...props}
    >
      {children}
      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="ml-0.5 rounded-full hover:bg-black/10 p-0.5 flex-shrink-0"
          aria-label="제거"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
