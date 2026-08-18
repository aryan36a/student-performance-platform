import { AlertTriangle, CircleCheck, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertTone = "info" | "success" | "warning" | "error";

const toneStyles: Record<AlertTone, string> = {
  info: "border-zinc-200 bg-zinc-50 text-zinc-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

function ToneIcon({ tone }: { tone: AlertTone }) {
  if (tone === "success") return <CircleCheck className="h-4 w-4" />;
  if (tone === "error") return <CircleX className="h-4 w-4" />;
  if (tone === "warning") return <AlertTriangle className="h-4 w-4" />;
  return <AlertTriangle className="h-4 w-4" />;
}

export function Alert({ tone = "info", className, children }: React.PropsWithChildren<{ tone?: AlertTone; className?: string }>) {
  return (
    <div className={cn("flex items-start gap-2 rounded-md border px-3 py-2 text-sm", toneStyles[tone], className)}>
      <ToneIcon tone={tone} />
      <div>{children}</div>
    </div>
  );
}
