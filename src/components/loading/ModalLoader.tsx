import { VinylLoader } from './VinylLoader';

interface ModalLoaderProps {
  label?: string;
}

export function ModalLoader({ label = 'Loading panel' }: ModalLoaderProps) {
  return (
    <div className="fixed inset-0 z-[var(--z-modal-overlay)] flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
      <div className="rounded-2xl border border-theme-border-default bg-theme-surface-base/95 px-6 py-5 shadow-[var(--theme-shadow-modal)]">
        <div className="flex items-center gap-3">
          <VinylLoader size={30} compact />
          <p className="text-sm font-medium text-theme-text-secondary">{label}</p>
        </div>
      </div>
    </div>
  );
}
