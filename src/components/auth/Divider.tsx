/**
 * Divider: "or" separator between form sections.
 */
export function Divider() {
  return (
    <div className="relative flex items-center py-2">
      <div className="flex-1 border-t border-theme-border-default" />
      <span className="px-3 text-xs font-medium uppercase tracking-wider text-theme-text-muted">or</span>
      <div className="flex-1 border-t border-theme-border-default" />
    </div>
  );
}

/** Simple horizontal rule for auth footer blocks */
export function AuthDivider({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`${compact ? 'my-2.5' : 'my-8'} h-px w-full bg-gradient-to-r from-transparent via-theme-border-default to-transparent`}
      aria-hidden
    />
  );
}
