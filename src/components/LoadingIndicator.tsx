export function LoadingIndicator({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span className={`camelion-inline-loader ${className}`} role="status" aria-live="polite">
      <span className="site-navigation-loader-spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
