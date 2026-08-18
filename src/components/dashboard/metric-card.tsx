import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-2xl tracking-tight">{value}</CardTitle>
        {helper ? <p className="mt-1 text-xs text-zinc-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
