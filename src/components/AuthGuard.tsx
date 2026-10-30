import React from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  // Let child routes render directly so the unified dynamic loader coordinates the startup sequence
  return <>{children}</>;
}
