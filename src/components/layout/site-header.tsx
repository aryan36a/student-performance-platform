"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Performance" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/students", label: "Students" },
  { href: "/analytics", label: "Analytics" },
];

type TestOption = {
  id: string;
  filename: string;
  uploaded_at: string;
  status: string;
};

function getTestLabel(filename: string) {
  return filename
    .replace(/\.(xlsx|xls|csv)$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tests, setTests] = useState<TestOption[]>([]);
  const [showAllTimeNotice, setShowAllTimeNotice] = useState(false);

  const previousTestRef = useRef<string | null>(null);

  /*
   * Current selected test.
   *
   * No "test" query parameter means All Time.
   */
  const selectedTest =
    searchParams.get("test") ?? "all";

  /*
   * Student profile pages:
   *
   * /students/[id]
   *
   * Students directory:
   *
   * /students
   */
  const isStudentProfile =
    pathname.startsWith("/students/") &&
    pathname !== "/students";

  /*
   * Show the All Time notification only when
   * switching from a specific test to All Time.
   *
   * It does NOT appear on initial page load.
   */
  useEffect(() => {
    const previousTest = previousTestRef.current;

    if (
      previousTest !== null &&
      previousTest !== "all" &&
      selectedTest === "all"
    ) {
      setShowAllTimeNotice(true);

      const timer = window.setTimeout(() => {
        setShowAllTimeNotice(false);
      }, 5000);

      previousTestRef.current = selectedTest;

      return () => {
        window.clearTimeout(timer);
      };
    }

    previousTestRef.current = selectedTest;
  }, [selectedTest]);

  /*
   * Load available tests.
   */
  useEffect(() => {
    fetch("/api/tests")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load tests");
        }

        return response.json();
      })
      .then((data) => {
        setTests(data);
      })
      .catch((error) => {
        console.error(
          "[header] Failed to load tests:",
          error,
        );

        setTests([]);
      });
  }, []);

  function handleTestChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const value = event.target.value;

    const params = new URLSearchParams(
      searchParams.toString(),
    );

    if (value === "all") {
      params.delete("test");
    } else {
      params.set("test", value);
    }

    const query = params.toString();

    router.push(
      `${pathname}${query ? `?${query}` : ""}`,
    );
  }

  function buildNavHref(href: string) {
    const params = new URLSearchParams(
      searchParams.toString(),
    );

    /*
     * Preserve selected test while navigating.
     */
    if (selectedTest === "all") {
      params.delete("test");
    } else {
      params.set("test", selectedTest);
    }

    /*
     * Search belongs only to Students.
     */
    params.delete("q");

    const query = params.toString();

    return `${href}${query ? `?${query}` : ""}`;
  }

  return (
    <>
      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">

        {/* ===================================================
            MAIN HEADER
            =================================================== */}

        <div className="mx-auto flex min-h-[64px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* =================================================
              BRAND + NAVIGATION
              ================================================= */}

          <div className="flex min-w-0 items-center gap-6">

            {/* Brand */}

            <Link
              href={buildNavHref("/")}
              className="group flex shrink-0 items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-[1.03] dark:bg-white dark:text-zinc-900">
                SP
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-none tracking-tight text-zinc-950 dark:text-white">
                  Student Performance
                </p>

                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                  Analytics
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}

            <nav className="hidden items-center rounded-lg bg-zinc-100/80 p-1 md:flex dark:bg-zinc-900">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (
                    item.href !== "/" &&
                    pathname.startsWith(
                      `${item.href}/`,
                    )
                  );

                return (
                  <Link
                    key={item.href}
                    href={buildNavHref(item.href)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",

                      isActive
                        ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/70 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* =================================================
              RIGHT CONTROLS
              ================================================= */}

          <div className="flex items-center gap-2">

            {/* Test selector */}

            {!isStudentProfile && (
              <div className="hidden items-center gap-2 sm:flex">

                <span className="text-xs font-medium text-zinc-400">
                  Test
                </span>

                <Select
                  value={selectedTest}
                  onChange={handleTestChange}
                  className="h-9 w-[175px] rounded-lg border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-800 shadow-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="all">
                    All Time
                  </option>

                  {tests.map((test) => (
                    <option
                      key={test.id}
                      value={test.id}
                    >
                      {getTestLabel(test.filename)}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Admin Login */}

            <Link
              href="/admin/login"
              className="flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <span className="hidden sm:inline">
                Admin Login
              </span>

              <span className="sm:hidden">
                Admin
              </span>
            </Link>

            {/* Theme Toggle */}

            <ThemeToggle />

          </div>
        </div>

        {/* =====================================================
            MOBILE NAVIGATION
            ===================================================== */}

        <div className="border-t border-zinc-100 md:hidden dark:border-zinc-800">

          <nav className="mx-auto flex w-full max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1.5 sm:px-6">

            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (
                  item.href !== "/" &&
                  pathname.startsWith(
                    `${item.href}/`,
                  )
                );

              return (
                <Link
                  key={item.href}
                  href={buildNavHref(item.href)}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",

                    isActive
                      ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

          </nav>
        </div>

        {/* =====================================================
            MOBILE TEST SELECTOR
            ===================================================== */}

        {!isStudentProfile && (
          <div className="border-t border-zinc-100 px-4 py-2 sm:hidden dark:border-zinc-800">

            <div className="flex items-center gap-2">

              <span className="shrink-0 text-xs font-medium text-zinc-400">
                Test
              </span>

              <Select
                value={selectedTest}
                onChange={handleTestChange}
                className="h-9 min-w-0 flex-1 rounded-lg border-zinc-200 bg-zinc-50 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="all">
                  All Time
                </option>

                {tests.map((test) => (
                  <option
                    key={test.id}
                    value={test.id}
                  >
                    {getTestLabel(test.filename)}
                  </option>
                ))}
              </Select>

            </div>
          </div>
        )}

      </header>

      {/* =====================================================
          ALL TIME NOTIFICATION
          ===================================================== */}

      {showAllTimeNotice &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="status"
            className="fixed bottom-5 left-5 z-[9999] w-[min(360px,calc(100vw-2.5rem))] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >

            <div className="px-4 py-3">

              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                All Time selected
              </p>

              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                All records are displayed as percentages.
              </p>

            </div>

          </div>,
          document.body,
        )}
    </>
  );
}