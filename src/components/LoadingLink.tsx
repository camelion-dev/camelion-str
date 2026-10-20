"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { startNavigationLoading } from "@/lib/navigation-loading";

type LoadingLinkProps = ComponentProps<typeof Link> & { showLoader?: boolean };
type NavigateHandler = NonNullable<LoadingLinkProps["onNavigate"]>;

function getHrefString(href: LoadingLinkProps["href"]) {
  if (typeof href === "string") return href;

  const params = new URLSearchParams();
  const queryValues = href.query as Record<string, string | string[] | undefined> | undefined;
  for (const [key, value] of Object.entries(queryValues ?? {})) {
    if (Array.isArray(value)) value.forEach((entry) => params.append(key, entry));
    else if (value !== undefined) params.set(key, value);
  }
  const query = params.toString();

  return `${href.pathname ?? ""}${query ? `?${query}` : ""}${href.hash ?? ""}`;
}

export default function LoadingLink({ onNavigate, href, showLoader = true, ...props }: LoadingLinkProps) {
  const handleNavigate: NavigateHandler = (event) => {
    let shouldNavigate = true;
    onNavigate?.({
      preventDefault: () => {
        shouldNavigate = false;
        event.preventDefault();
      },
    });
    if (shouldNavigate && showLoader) startNavigationLoading(getHrefString(href));
  };

  return <Link {...props} href={href} onNavigate={handleNavigate} />;
}
