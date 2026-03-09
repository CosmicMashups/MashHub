/**
 * Divider: "or" separator between form sections.
 */
export function Divider() {
  return (
    <div className="relative flex items-center py-2">
      <div className="flex-1 border-t border-gray-200 dark:border-gray-600" />
      <span className="px-3 text-sm text-gray-500 dark:text-gray-400">or</span>
      <div className="flex-1 border-t border-gray-200 dark:border-gray-600" />
    </div>
  );
}
