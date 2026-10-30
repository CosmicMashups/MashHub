import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Disc } from 'lucide-react';

export interface HarmonicResonatorLoaderProps {
  label?: string;
  fullscreen?: boolean;
  compact?: boolean;
  overlay?: boolean;
}

export function HarmonicResonatorLoader({
  label = 'Preparing music library...',
  fullscreen = true,
  compact = false,
  overlay = false,
}: HarmonicResonatorLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vinylRef = useRef<HTMLDivElement>(null);
  const progressRunnerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);

  // Smooth dynamic text transition whenever label changes
  useEffect(() => {
    if (!labelRef.current) return;
    gsap.fromTo(
      labelRef.current,
      { opacity: 0, y: 5 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    );
  }, [label]);

  useGSAP(
    () => {
      const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (isReduced) {
        gsap.to('.reduced-pulse', {
          opacity: 0.6,
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
        return;
      }

      // 1. Continuous smooth vinyl rotation
      if (vinylRef.current) {
        gsap.to(vinylRef.current, {
          rotation: 360,
          duration: 2.8,
          repeat: -1,
          ease: 'none',
        });
      }

      // 2. Harmonic acoustic waves expanding outward from the vinyl
      gsap.fromTo(
        '.sound-ripple',
        { scale: 0.85, opacity: 0.7 },
        {
          scale: 1.35,
          opacity: 0,
          duration: 2.2,
          repeat: -1,
          stagger: 0.7,
          ease: 'power2.out',
        }
      );

      // 3. Mini 5-bar rhythmic audio equalizer
      const bars = gsap.utils.toArray<HTMLElement>('.mini-eq-bar');
      bars.forEach((bar, i) => {
        const heights = [0.95, 0.45, 0.8, 0.35, 0.9, 0.6];
        const target = heights[i % heights.length];
        gsap.to(bar, {
          scaleY: target,
          transformOrigin: 'bottom center',
          duration: 0.22 + (i % 3) * 0.08,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.06,
        });
      });

      // 4. Smooth continuous progress bar runner
      if (progressRunnerRef.current) {
        gsap.fromTo(
          progressRunnerRef.current,
          { xPercent: -100 },
          {
            xPercent: 120,
            duration: 1.6,
            repeat: -1,
            ease: 'power1.inOut',
          }
        );
      }
    },
    { scope: containerRef }
  );

  const containerClasses = [
    fullscreen ? 'fixed inset-0 h-dvh w-screen' : 'h-full w-full',
    overlay ? 'z-[var(--z-modal-overlay)] bg-black/40 backdrop-blur-sm' : 'bg-theme-bg-primary',
    'flex items-center justify-center overflow-hidden transition-colors duration-200 select-none p-4',
  ].join(' ');

  const vinylSize = compact ? 'w-20 h-20' : 'w-28 h-28 sm:w-32 sm:h-32';
  const labelSize = compact ? 'w-8 h-8' : 'w-11 h-11 sm:w-12 sm:h-12';

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      role="status"
      aria-live="polite"
    >
      {/* Subtle Ambient Radial Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute left-[48%] top-[52%] -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Basic, Clean, Elevated Card Chassis */}
      <div className="relative z-10 w-full max-w-[280px] sm:max-w-[320px] rounded-2xl border border-theme-border-default bg-theme-surface-base/95 p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col items-center text-center">
        {/* Top Header Monogram */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-theme-text-muted mb-4 uppercase">
          <Disc size={13} className="text-theme-accent-primary" />
          <span>MASH<span className="text-theme-accent-primary">HUB</span></span>
        </div>

        {/* Dynamic Vinyl Turntable & Harmonic Ripples */}
        <div className="relative flex items-center justify-center my-2">
          {/* Pulsing Harmonic Sound Ripples */}
          <div className={`sound-ripple pointer-events-none absolute rounded-full border border-sky-400/30 ${vinylSize}`} />
          <div className={`sound-ripple pointer-events-none absolute rounded-full border border-indigo-400/25 ${vinylSize}`} />

          {/* The Spinning Vinyl Record */}
          <div
            ref={vinylRef}
            className={`relative rounded-full shadow-lg flex items-center justify-center border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 ${vinylSize}`}
            style={{ willChange: 'transform' }}
          >
            {/* Concentric Vinyl Grooves */}
            <div className="absolute inset-[10%] rounded-full border border-slate-700/30 pointer-events-none" />
            <div className="absolute inset-[22%] rounded-full border border-slate-600/35 pointer-events-none" />
            <div className="absolute inset-[34%] rounded-full border border-slate-700/30 pointer-events-none" />

            {/* Subtle Grooved Vinyl Sheen Reflection */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-400/10 via-transparent to-amber-400/10 pointer-events-none" />

            {/* Center Disc Monogram Label */}
            <div className={`relative rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 shadow-inner flex items-center justify-center text-white border-2 border-slate-900 ${labelSize}`}>
              <Disc size={compact ? 12 : 16} className="text-white/90" />
              {/* Spindle hole */}
              <div className="absolute w-2 h-2 rounded-full bg-slate-950" />
            </div>
          </div>
        </div>

        {/* 5-Bar Mini Rhythmic Equalizer */}
        <div className="flex items-end justify-center gap-1.5 h-4 my-3" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="mini-eq-bar block w-1 h-full rounded-full bg-gradient-to-t from-sky-500 to-indigo-500 origin-bottom"
              style={{ transform: 'scaleY(0.4)' }}
            />
          ))}
        </div>

        {/* Status Text Label with Smooth GSAP Dynamic Transition */}
        <p
          ref={labelRef}
          className="text-xs font-semibold text-theme-text-primary tracking-tight truncate max-w-full min-h-[1.25rem] flex items-center justify-center"
        >
          {label}
        </p>

        {/* Clean Indeterminate Progress Line */}
        <div className="mt-3.5 h-1 w-full overflow-hidden rounded-full bg-theme-surface-elevated border border-theme-border-subtle relative">
          <div
            ref={progressRunnerRef}
            className="absolute top-0 bottom-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
