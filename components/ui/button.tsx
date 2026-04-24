import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-900/25 ring-1 ring-white/20 hover:from-teal-500 hover:to-emerald-500 hover:shadow-teal-900/30",
        secondary:
          "border border-white/40 bg-white/20 text-white shadow-sm backdrop-blur-md hover:bg-white/30",
        ghost: "text-slate-700 hover:bg-slate-100/90",
        muted: "border border-slate-200/90 bg-slate-100/90 text-slate-800 shadow-sm hover:bg-slate-200/90",
        outline: "border border-teal-200/80 bg-white/70 text-teal-800 shadow-sm hover:bg-white hover:border-teal-300",
        success:
          "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/20 ring-1 ring-white/20 hover:from-emerald-500 hover:to-teal-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
));
Button.displayName = "Button";

export { Button, buttonVariants };
