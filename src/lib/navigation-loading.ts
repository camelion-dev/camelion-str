const NAVIGATION_LOADING_EVENT = "camelion:navigation-loading";

type NavigationLoadingDetail = {
  href?: string;
  minimumVisibleMs?: number;
};

function dispatchNavigationLoading(detail: NavigationLoadingDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<NavigationLoadingDetail>(NAVIGATION_LOADING_EVENT, { detail }));
}

export function startNavigationLoading(href: string) {
  dispatchNavigationLoading({ href, minimumVisibleMs: 650 });
}

export { NAVIGATION_LOADING_EVENT };
