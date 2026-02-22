import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "owner"
  | "editor"
  | "viewer";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-bg-secondary text-text-secondary",
  success: "bg-[#EBF8F0] text-[#27B563]",
  warning: "bg-[#FFF9EB] text-[#EDA315]",
  error: "bg-[#FFF0F0] text-[#FF4B4B]",
  info: "bg-[#EEF4FE] text-brand",
  owner: "bg-[#EEF4FE] text-brand",
  editor: "bg-[#EBF8F0] text-[#27B563]",
  viewer: "bg-bg-secondary text-text-secondary",
};

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
