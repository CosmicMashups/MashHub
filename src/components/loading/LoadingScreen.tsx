import { PrimaryLoader } from './PrimaryLoader';

interface LoadingScreenProps {
  label?: string;
}

export function LoadingScreen({ label = 'Loading' }: LoadingScreenProps) {
  return <PrimaryLoader label={label} />;
}
