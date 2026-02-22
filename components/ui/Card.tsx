import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "default" | "elevated" | "flat";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    "bg-white border border-border-default shadow-[0_1px_4px_0_rgba(0,0,0,0.06)]",
  elevated:
    "bg-white border border-border-default shadow-[0_4px_16px_0_rgba(0,0,0,0.08)]",
  flat: "bg-bg-secondary",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-[16px] p-5", variantClasses[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3", className)} {...props} />;
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-4 pt-4 border-t border-border-default",
        className
      )}
      {...props}
    />
  );
}
