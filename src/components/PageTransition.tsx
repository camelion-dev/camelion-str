import { ViewTransition } from "react";

export const PageTransition = ViewTransition;

export const pageTransitionProps = {
  enter: "site-page-enter",
  exit: "site-page-exit",
  default: "none",
} as const;
