import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border px-3.5 py-2.5 text-base transition-colors focus:outline-none focus:ring-2",
          error
            ? "border-red-300 focus:border-red-600 focus:ring-red-600/20"
            : "border-indigo-200 focus:border-primary-600 focus:ring-primary-600/20",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
