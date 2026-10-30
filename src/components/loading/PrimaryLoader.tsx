import { HarmonicResonatorLoader, type HarmonicResonatorLoaderProps } from './HarmonicResonatorLoader';

export type PrimaryLoaderProps = HarmonicResonatorLoaderProps;

export function PrimaryLoader({
  label,
  fullscreen = true,
  compact = false,
  overlay = false,
}: PrimaryLoaderProps) {
  return (
    <HarmonicResonatorLoader
      label={label}
      fullscreen={fullscreen}
      compact={compact}
      overlay={overlay}
    />
  );
}
