"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix"> {
  label?: string;
  helperText?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, helperText, error, prefix, suffix, className, type, id, ...props },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex items-center gap-2 h-11 px-3 rounded-[10px] border bg-white transition-colors",
            error
              ? "border-[#FF4B4B] focus-within:border-[#FF4B4B]"
              : "border-border-default focus-within:border-brand",
            props.disabled && "bg-bg-secondary cursor-not-allowed"
          )}
        >
          {prefix && (
            <span className="text-text-tertiary flex-shrink-0">{prefix}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              "flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-tertiary disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-text-tertiary hover:text-text-secondary flex-shrink-0"
              tabIndex={-1}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          ) : (
            suffix && (
              <span className="text-text-tertiary flex-shrink-0">{suffix}</span>
            )
          )}
        </div>
        {(error || helperText) && (
          <p
            className={cn(
              "text-xs",
              error ? "text-[#FF4B4B]" : "text-text-tertiary"
            )}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
