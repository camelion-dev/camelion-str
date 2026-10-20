import { ViewTransition } from "react";

export const PageTransition = ViewTransition;

export const pageTransitionProps = {
  enter: "site-page-enter",
  exit: "site-page-exit",
  default: "none",
} as const;

export const ContentTransition = ViewTransition;

export const contentTransitionProps = {
  enter: "site-content-enter",
  exit: "site-content-exit",
  default: "none",
} as const;
