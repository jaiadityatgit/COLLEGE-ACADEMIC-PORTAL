import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "flat" | "hero";
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      padding = "md",
      className = "",
      ...props
    },
    ref
  ) => {
    const baseStyles = "rounded-2xl transition-all duration-180";

    const variantStyles = {
      default:
        "bg-white dark:bg-[#1c202c] shadow-card dark:shadow-none border border-slate-100/90 dark:border-white/[0.06]",
      interactive:
        "bg-white dark:bg-[#1c202c] shadow-card dark:shadow-none border border-slate-100/90 dark:border-white/[0.06] hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer active:translate-y-0 hover:border-slate-200/80",
      flat:
        "bg-slate-50/70 dark:bg-[#161922] border border-slate-100/80 dark:border-white/[0.04]",
      hero:
        "bg-neutral-900 text-white shadow-float border border-neutral-800",
    };

    const paddingStyles = {
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-7 sm:p-8",
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
