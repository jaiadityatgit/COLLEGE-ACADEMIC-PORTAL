import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      icon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-neutral-900 hover:bg-neutral-800 active:bg-black text-white shadow-xs",
      secondary:
        "bg-white dark:bg-[#232838] border border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/[0.04] shadow-xs",
      ghost:
        "bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.06]",
      danger:
        "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
      md: "px-4 py-2 text-sm gap-2 rounded-xl",
      lg: "px-5 py-2.5 text-sm gap-2.5 rounded-xl",
    };

    const finalLeftIcon = leftIcon || icon;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin flex-shrink-0" />
        )}
        {!isLoading && finalLeftIcon && <span className="flex-shrink-0">{finalLeftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
