import { memo, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { MainNavLinks } from '../components/layout/MainNavLinks';
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
    <div className="min-h-screen bg-theme-background-primary">
      <AppHeader
        actions={
          <>
            <Link
              to="/"
              className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm text-theme-text-secondary transition-colors hover:bg-theme-state-hover hover:text-theme-text-primary"
            >
              <ArrowLeft size={16} className="mr-1 shrink-0" />
              Back to Library
            </Link>
            <MainNavLinks showLibrary={false} showHarmonicWheel={false} />
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-theme-text-primary">Harmonic wheel</h1>
          <p className="mt-2 max-w-2xl text-sm text-theme-text-secondary">
            Twelve wedges follow Camelot clock order. Each wedge lists every mode that shares the same normalized
            equivalent-major pitch class as MashHub matching.
          </p>
        </div>

        <div className="mb-6">
          <HarmonicWheelSearchBar onFocusPitchClass={handleFocusFromSearch} />
        </div>

        <div
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          {liveMessage}
        </div>

        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <div className="flex-1 lg:max-w-md">
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
          <div className="min-w-0 flex-1 lg:max-w-lg">
            <HarmonicWheelDetailPanel segment={selectedSegment} />
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
