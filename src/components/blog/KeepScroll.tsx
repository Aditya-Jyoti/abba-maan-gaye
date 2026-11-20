"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, type ComponentProps } from "react";

// Switching a post in or out of edit mode swaps the page, which briefly empties it
// and loses the scroll position. The toggle remembers where you were, and the
// next page puts you back there once its content is in place.
const KEY = "gk:keep-scroll";

/** Call before navigating to `path` to land at the current scroll position there. */
export function rememberScroll(path: string) {
  sessionStorage.setItem(KEY, JSON.stringify({ path, y: window.scrollY }));
}

export function KeepScrollLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      onClick={(e) => {
        rememberScroll(href);
        onClick?.(e);
      }}
      {...rest}
    />
  );
}

export function RestoreScroll() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (!saved) return;
    sessionStorage.removeItem(KEY);
    try {
      const { path, y } = JSON.parse(saved) as { path: string; y: number };
      if (path === pathname) window.scrollTo(0, y);
    } catch {
      // Ignore anything unreadable.
    }
  }, [pathname]);
  return null;
}
