import { cn } from "@/lib/utils";
import { forwardRef, SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full rounded-lg border px-3.5 py-2.5 text-base transition-colors focus:outline-none focus:ring-2 bg-white",
          error
            ? "border-red-300 focus:border-red-600 focus:ring-red-600/20"
            : "border-indigo-200 focus:border-primary-600 focus:ring-primary-600/20",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

export default Select;
