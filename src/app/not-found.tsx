import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center">
      <p className="text-sm text-zinc-500">404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Page not found</h1>
      <p className="text-sm text-zinc-500">The page you requested does not exist.</p>
      <Link href="/">
        <Button>Back to dashboard</Button>
      </Link>
    </main>
  );
}
