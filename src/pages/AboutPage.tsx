import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Music, Award, Waves, Headphones, Disc3, Star } from 'lucide-react';
import { DeveloperCard } from '../components/DeveloperCard';
import { ArtistSection } from '../components/ArtistSection';
import { Footer } from '../components/Footer';
import { LegalModal } from '../components/LegalModal';
import { AppHeader } from '../components/layout/AppHeader';
import { useTheme } from '../hooks/useTheme';
import { DEVELOPER, ARTISTS } from '../data/aboutData';
import type { Artist } from '../types/about';
import { PRIVACY_POLICY_CONTENT, TERMS_OF_SERVICE_CONTENT } from '../content/legalContent';

export const AboutPage = memo(function AboutPage() {
  useTheme(); // Apply theme
  const { scrollY } = useScroll();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Parallax effects for floating icons
  const headphonesY = useTransform(scrollY, [0, 1000], [0, -150]);
  const discY = useTransform(scrollY, [0, 1000], [0, -100]);
  const starY = useTransform(scrollY, [0, 1000], [0, -200]);

  // Group artists by category
  const artistsByCategory = useMemo(() => {
    return {
      Anime: ARTISTS.filter(a => a.category === 'Anime'),
      Western: ARTISTS.filter(a => a.category === 'Western'),
      'K-Pop': ARTISTS.filter(a => a.category === 'K-Pop')
    };
  }, []);

  return (
    <div className="min-h-screen bg-theme-background-primary">
      <AppHeader
        actions={
          <Link
            to="/"
            className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm text-theme-text-secondary transition-colors hover:bg-theme-state-hover hover:text-theme-text-primary"
          >
            Back to Library
          </Link>
        }
      />

      {/* Decorative floating icons in background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <motion.div style={{ y: headphonesY }} className="absolute top-20 right-10 opacity-10 dark:opacity-5">
          <Headphones className="w-16 h-16 text-theme-text-muted" />
        </motion.div>
        <motion.div 
          style={{ y: discY }} 
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute top-40 left-10 opacity-20 dark:opacity-10"
        >
          <Disc3 className="w-12 h-12 text-theme-text-muted" />
        </motion.div>
        <motion.div 
          style={{ y: starY }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-60 right-1/4 opacity-25 dark:opacity-15"
        >
          <Star className="w-8 h-8 text-theme-text-muted" />
        </motion.div>
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Gradient background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-theme-accent-soft/60 via-theme-surface-base to-theme-background-secondary pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Page Header with Music Icon */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                <Music className="w-10 h-10 sm:w-12 sm:h-12 text-theme-accent-primary" aria-hidden="true" />
              </motion.div>
              <h1 className="text-4xl sm:text-5xl font-bold text-theme-text-primary">
                About MashHub
              </h1>
            </div>
            <p className="text-lg text-theme-text-secondary max-w-3xl mx-auto">
              Meet the creator and discover the talented artists who inspire this community
            </p>
          </motion.div>

          {/* Developer Section */}
          <section className="mb-16" aria-labelledby="developer-heading">
            <DeveloperCard developer={DEVELOPER} />
          </section>

          {/* Divider with Waves Icon */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center gap-4 my-16"
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-theme-border-default to-transparent" />
            <motion.div
              animate={{ 
                y: [0, -3, 0],
                scaleX: [1, 1.05, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Waves className="w-12 h-12 text-theme-accent-primary/50" aria-hidden="true" />
            </motion.div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-theme-border-default to-transparent" />
          </motion.div>

          {/* Artist Credits Section */}
          <section aria-labelledby="credits-heading">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <Award className="w-8 h-8 text-theme-state-warning" aria-hidden="true" />
                <h2 id="credits-heading" className="text-3xl sm:text-4xl font-bold text-theme-text-primary">
                  Credits to Other Artists
                </h2>
              </div>
              <p className="text-base text-theme-text-secondary max-w-2xl mx-auto">
                Talented mashup creators who inspire and contribute to the community
              </p>
            </motion.div>

            {/* Artist Categories */}
            <div className="space-y-12">
              <ArtistSection category="Anime" artists={artistsByCategory.Anime} />
              <ArtistSection category="Western" artists={artistsByCategory.Western} />
              <ArtistSection category="K-Pop" artists={artistsByCategory['K-Pop']} />
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-2xl font-semibold text-theme-text-primary mb-3">API Credits</h2>
            <p className="text-theme-text-secondary text-sm leading-6">
              MashHub uses data from{' '}
              <a className="text-theme-accent-primary hover:underline" href="https://developer.spotify.com/" target="_blank" rel="noreferrer">
                Spotify API
              </a>{' '}
              and{' '}
              <a className="text-theme-accent-primary hover:underline" href="https://jikan.moe/" target="_blank" rel="noreferrer">
                Jikan API
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer onPrivacyClick={() => setShowPrivacyModal(true)} onTermsClick={() => setShowTermsModal(true)} />
      <LegalModal
        isOpen={showPrivacyModal}
        title="Privacy Policy"
        content={PRIVACY_POLICY_CONTENT}
        onClose={() => setShowPrivacyModal(false)}
      />
      <LegalModal
        isOpen={showTermsModal}
        title="Terms of Service"
        content={TERMS_OF_SERVICE_CONTENT}
        onClose={() => setShowTermsModal(false)}
      />
    </div>
  );
});
