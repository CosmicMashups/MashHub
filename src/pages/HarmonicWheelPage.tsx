import { memo, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Disc, Sparkles, SlidersHorizontal } from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { HarmonicWheelSvg } from '../components/harmonic-wheel/HarmonicWheelSvg';
import { HarmonicWheelDetailPanel } from '../components/harmonic-wheel/HarmonicWheelDetailPanel';
import { HarmonicWheelSearchBar } from '../components/harmonic-wheel/HarmonicWheelSearchBar';
import { Footer } from '../components/Footer';
import { LegalModal } from '../components/LegalModal';
import { PRIVACY_POLICY_CONTENT, TERMS_OF_SERVICE_CONTENT } from '../content/legalContent';
import { useTheme } from '../hooks/useTheme';
import { getHarmonicWheelSegments } from '../utils/harmonicWheelDataset';
import type { PitchClass } from '../utils/harmonicWheelDataset';

export const HarmonicWheelPage = memo(function HarmonicWheelPage() {
  useTheme();
  const segments = useMemo(() => getHarmonicWheelSegments(), []);
  const [selectedPc, setSelectedPc] = useState<PitchClass | null>(null);
  const [hoveredPc, setHoveredPc] = useState<PitchClass | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const selectedSegment = useMemo(
    () => (selectedPc === null ? null : segments.find((s) => s.pitchClass === selectedPc) ?? null),
    [selectedPc, segments]
  );

  const handleFocusFromSearch = useCallback((pc: PitchClass | null) => {
    if (pc === null) {
      setLiveMessage('No matching key found.');
      return;
    }
    setSelectedPc(pc);
    const seg = segments.find((s) => s.pitchClass === pc);
    setLiveMessage(
      seg
        ? `Focused ${seg.representativeMajor.replace(' Major', '')} family, Camelot ${seg.camelotPosition}.`
        : 'Segment focused.'
    );
  }, [segments]);

  return (
    <div className="min-h-screen flex flex-col bg-theme-background-primary text-theme-text-primary selection:bg-primary-500/30 selection:text-primary-700 dark:selection:text-primary-200">
      <AppHeader />

      <main className="relative flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Ambient lighting glows */}
        <div className="pointer-events-none absolute -top-32 left-1/4 w-[600px] h-[350px] bg-primary-500/5 dark:bg-primary-600/10 blur-[140px] rounded-full" />
        <div className="pointer-events-none absolute top-48 right-10 w-[450px] h-[300px] bg-purple-500/5 dark:bg-purple-600/[0.07] blur-[130px] rounded-full" />

        {/* Hero Section */}
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-theme-border-default">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-theme-text-primary font-sans">
              Harmonic Wheel
            </h1>
            <p className="text-sm sm:text-base text-theme-text-muted font-normal leading-relaxed">
              Interactive Circle of Fifths chromatic map. Select any harmonic wedge to inspect relative major/minor pairs, calculate adjacent energy steps (±1 Camelot), and view compatible tracks.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-theme-surface-base border border-theme-border-default shadow-xs flex items-center gap-3 shrink-0 self-start md:self-auto">
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">
                System Tuning
              </span>
              <span className="text-xs font-semibold text-theme-text-primary font-mono">
                12-TET Chromatic Camelot
              </span>
            </div>
          </div>
        </div>

        {/* Primary Interactive Console (Machined Double-Bezel Card) */}
        <div className="relative group/console rounded-[1.75rem] p-1 bg-gradient-to-b from-theme-border-default/60 via-theme-border-subtle/30 to-transparent border border-theme-border-default shadow-xs dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]">
          <div className="rounded-[calc(1.75rem-4px)] p-6 sm:p-8 bg-theme-surface-base border border-theme-border-subtle space-y-8">
            {/* Search Header Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-6 border-b border-theme-border-default">
              <HarmonicWheelSearchBar onFocusPitchClass={handleFocusFromSearch} />
              <span className="text-xs text-theme-text-muted font-medium self-end sm:self-center">
                Click any wedge to inspect harmonic relations
              </span>
            </div>

            <div
              className="sr-only"
              aria-live="polite"
              aria-atomic="true"
            >
              {liveMessage}
            </div>

            {/* Wheel & Detail Panel Workspace */}
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 flex justify-center items-center py-2">
                <HarmonicWheelSvg
                  segments={segments}
                  selectedPc={selectedPc}
                  hoveredPc={hoveredPc}
                  onHoverPc={setHoveredPc}
                  onSelectPc={(pc) => {
                    setSelectedPc(pc);
                    setLiveMessage('Segment selected.');
                  }}
                />
              </div>
              <div className="w-full lg:max-w-md">
                <HarmonicWheelDetailPanel segment={selectedSegment} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer
        onPrivacyClick={() => setShowPrivacyModal(true)}
        onTermsClick={() => setShowTermsModal(true)}
      />
      <LegalModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
        content={PRIVACY_POLICY_CONTENT}
      />
      <LegalModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Service"
        content={TERMS_OF_SERVICE_CONTENT}
      />
    </div>
  );
});

export default HarmonicWheelPage;
