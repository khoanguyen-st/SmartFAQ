import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

const Card = ({ className, padding = "md", ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white shadow-lg shadow-slate-900/10",
        {
          sm: "p-4",
          md: "p-6",
          lg: "p-8",
        }[padding],
        className
      )}
      {...props}
    />
  );
};

const CardHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("mb-4", className)} {...props} />;
};

const CardTitle = ({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h2
      className={cn("text-xl font-semibold text-slate-900", className)}
      {...props}
    />
  );
};

const CardContent = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("text-base text-slate-600", className)} {...props} />
  );
};

export { Card, CardHeader, CardTitle, CardContent };
