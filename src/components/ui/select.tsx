import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none transition-colors focus:border-zinc-500",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
