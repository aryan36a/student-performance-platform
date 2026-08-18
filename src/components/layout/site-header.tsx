"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Input } from "@/components/ui/input";
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

  /*
   * Student profile pages:
   *
   * /students/[id]
   *
   * Hide the test selector and search there.
   */
  const isStudentProfile =
    pathname.startsWith("/students/") &&
    pathname !== "/students";

  const selectedTest =
    searchParams.get("test") ?? "all";

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
     * Search belongs only to the Students page.
     */
    params.delete("q");

    const query = params.toString();

    return `${href}${query ? `?${query}` : ""}`;
  }

  function handleSearch(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key !== "Enter") return;

    const value =
      event.currentTarget.value.trim();

    const params = new URLSearchParams(
      searchParams.toString(),
    );

    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    const query = params.toString();

    router.push(
      `/students${query ? `?${query}` : ""}`,
    );
  }

  return (
    <header
      className="
        sticky top-0 z-40
        border-b border-zinc-200
        bg-white/95
        backdrop-blur
        dark:border-zinc-800
        dark:bg-zinc-950/95
      "
    >
      {/* =====================================================
          MAIN HEADER
          ===================================================== */}

      <div className="mx-auto flex min-h-[64px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* ===================================================
            BRAND + DESKTOP NAV
            =================================================== */}

        <div className="flex min-w-0 items-center gap-6">

          {/* Brand */}

          <Link
            href={buildNavHref("/")}
            className="group flex shrink-0 items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-[1.03] dark:bg-white dark:text-zinc-950">
              SP
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none tracking-tight text-zinc-950 dark:text-zinc-100">
                Student Performance
              </p>

              <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Analytics
              </p>
            </div>
          </Link>

          {/* Desktop navigation */}

          <nav className="hidden items-center rounded-lg bg-zinc-100/80 p-1 dark:bg-zinc-900/80 md:flex">
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
                      ? `
                        bg-white
                        text-zinc-950
                        shadow-sm
                        ring-1
                        ring-zinc-200/70
                        dark:bg-zinc-800
                        dark:text-zinc-100
                        dark:ring-zinc-700
                      `
                      : `
                        text-zinc-500
                        hover:text-zinc-900
                        dark:text-zinc-400
                        dark:hover:text-zinc-100
                      `,
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ===================================================
            RIGHT CONTROLS
            =================================================== */}

        <div className="flex min-w-0 items-center gap-2">

          {/* Test selector + Search */}

          {!isStudentProfile && (
            <>
              {/* Test selector */}

              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-xs font-medium text-zinc-400">
                  Test
                </span>

                <Select
                  value={selectedTest}
                  onChange={handleTestChange}
                  className="
                    h-9
                    w-[175px]
                    rounded-lg
                    border-zinc-200
                    bg-zinc-50
                    text-sm
                    font-medium
                    text-zinc-800
                    shadow-none
                    transition-colors
                    hover:bg-white
                    focus:bg-white
                    dark:border-zinc-700
                    dark:bg-zinc-900
                    dark:text-zinc-200
                    dark:hover:bg-zinc-800
                    dark:focus:bg-zinc-800
                  "
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

              {/* Search */}

              <div className="relative hidden w-64 lg:block xl:w-72">

                <Search
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-1/2
                    h-4
                    w-4
                    -translate-y-1/2
                    text-zinc-400
                  "
                />

                <Input
                  defaultValue={
                    searchParams.get("q") ?? ""
                  }
                  placeholder="Search students..."
                  className="
                    h-9
                    rounded-lg
                    border-zinc-200
                    bg-zinc-50
                    pl-9
                    text-sm
                    text-zinc-900
                    shadow-none
                    placeholder:text-zinc-400
                    transition-colors
                    hover:bg-white
                    focus:bg-white
                    dark:border-zinc-700
                    dark:bg-zinc-900
                    dark:text-zinc-100
                    dark:hover:bg-zinc-800
                    dark:focus:bg-zinc-800
                  "
                  onKeyDown={handleSearch}
                />

              </div>
            </>
          )}

          {/* Theme toggle */}

          <ThemeToggle />

        </div>
      </div>

      {/* =====================================================
          MOBILE NAVIGATION
          ===================================================== */}

      <div className="border-t border-zinc-100 dark:border-zinc-800 md:hidden">

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
                    ? `
                      bg-zinc-100
                      text-zinc-950
                      dark:bg-zinc-800
                      dark:text-zinc-100
                    `
                    : `
                      text-zinc-500
                      hover:bg-zinc-50
                      hover:text-zinc-900
                      dark:text-zinc-400
                      dark:hover:bg-zinc-900
                      dark:hover:text-zinc-100
                    `,
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
        <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800 sm:hidden">

          <div className="flex items-center gap-2">

            <span className="shrink-0 text-xs font-medium text-zinc-400">
              Test
            </span>

            <Select
              value={selectedTest}
              onChange={handleTestChange}
              className="
                h-9
                min-w-0
                flex-1
                rounded-lg
                border-zinc-200
                bg-zinc-50
                text-sm
                text-zinc-800
                dark:border-zinc-700
                dark:bg-zinc-900
                dark:text-zinc-200
              "
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
  );
}