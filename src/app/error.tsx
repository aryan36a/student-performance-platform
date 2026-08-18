"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">Something went wrong</h1>
      <p className="text-sm text-zinc-500">Please try again. If the issue persists, contact the administrator.</p>
      <Button onClick={() => reset()}>Retry</Button>
    </main>
  );
}
