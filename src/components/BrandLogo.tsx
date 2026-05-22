const LOGO_SRC = `${import.meta.env.BASE_URL}logo.png`;

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-14 w-14',
} as const;

type BrandLogoSize = keyof typeof sizeClasses;

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
}

/** MashHub brand mark (public/logo.png). */
export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="MashHub"
      width={size === 'xl' ? 56 : size === 'lg' ? 48 : size === 'md' ? 40 : 32}
      height={size === 'xl' ? 56 : size === 'lg' ? 48 : size === 'md' ? 40 : 32}
      className={`shrink-0 rounded-lg object-contain ${sizeClasses[size]} ${className}`.trim()}
    />
  );
}
