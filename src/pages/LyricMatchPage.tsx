import React, { useState, useEffect, useMemo } from 'react';
import { useSongs } from '../hooks/useSongs';
import { useBackendContext } from '../contexts/BackendContext';
import { useLyricIngest } from '../hooks/useLyricIngest';
import { useTheme } from '../hooks/useTheme';
import { useSnackbar } from '../contexts/SnackbarContext';
import { lyricsService } from '../services/lyricsService';
import { matchLyrics, type RawLyricLine, type SongMetadataLookup } from '../services/lyricMatchEngine';
import type { LyricMatchGroup, LyricCandidate } from '../types/lyrics';
import { LyricCoverageBanner } from '../components/lyrics/LyricCoverageBanner';
import { LyricSongPicker } from '../components/lyrics/LyricSongPicker';
import { LyricSongStatusChip } from '../components/lyrics/LyricSongStatusChip';
import { LyricMatchResults } from '../components/lyrics/LyricMatchResults';
import { WrongLyricsDialog } from '../components/lyrics/WrongLyricsDialog';
import { PasteLyricsDialog } from '../components/lyrics/PasteLyricsDialog';
import { AppHeader } from '../components/layout/AppHeader';
import { Footer } from '../components/Footer';
import { LegalModal } from '../components/LegalModal';
import { PRIVACY_POLICY_CONTENT, TERMS_OF_SERVICE_CONTENT } from '../content/legalContent';
import {
  Sparkles,
  Layers,
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Music,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

export const LyricMatchPage: React.FC = () => {
  useTheme(); // Keep document theme in sync when route is mounted
  const { songs } = useSongs();
  const { isLocal } = useBackendContext();
  const { showSuccess, showError, showWarning } = useSnackbar();
  const { statuses, isProcessing: isIngesting, queueSongs, updateStatus } = useLyricIngest();

  const [mode, setMode] = useState<'compare' | 'oneVsLibrary'>('compare');
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [targetSongId, setTargetSongId] = useState<string>('');

  const [isMatching, setIsMatching] = useState(false);
  const [matchedGroups, setMatchedGroups] = useState<LyricMatchGroup[]>([]);
  const [coverage, setCoverage] = useState<{ songsWithLyrics: number; totalSongs: number }>({
    songsWithLyrics: 0,
    totalSongs: 0,
  });

  // Modal dialog states
  const [wrongLyricsSongId, setWrongLyricsSongId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<LyricCandidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  const [pasteSongId, setPasteSongId] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    if (!isLocal) {
      lyricsService.getCoverage().then(setCoverage).catch(console.error);
    }
  }, [isLocal]);

  const songMetaMap = useMemo<SongMetadataLookup>(() => {
    const map: SongMetadataLookup = {};
    for (const s of songs) {
      map[s.id] = { title: s.title, artist: s.artist };
    }
    return map;
  }, [songs]);

  const handleToggleSong = (songId: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const handleRunMatch = async () => {
    const idsToIngest = mode === 'compare' ? selectedSongIds : targetSongId ? [targetSongId] : [];
    if (idsToIngest.length === 0) return;

    setIsMatching(true);
    try {
      await queueSongs(idsToIngest);

      let rawLines: any[] = [];
      if (mode === 'compare') {
        rawLines = await lyricsService.getLinesForSongs(selectedSongIds);
      } else {
        const targetLines = await lyricsService.getLinesForSongs([targetSongId]);
        const candLines = await lyricsService.getCandidatesForSong(targetSongId, 500);
        rawLines = [...targetLines, ...candLines];
      }

      const groups = matchLyrics(rawLines as RawLyricLine[], songMetaMap);
      setMatchedGroups(groups);
      if (groups.length === 0) {
        showWarning('No identical or fuzzy lyrical matches found for the selected songs.');
      }
    } catch (err) {
      console.error('Error during matching:', err);
      const msg = err instanceof Error ? err.message : 'Error during lyric matching';
      showError(msg);
    } finally {
      setIsMatching(false);
    }
  };

  const handleOpenWrongLyrics = async (songId: string) => {
    setWrongLyricsSongId(songId);
    setIsLoadingCandidates(true);
    try {
      const res = await lyricsService.getCandidates(songId);
      setCandidates(res.candidates as any);
    } catch (err) {
      console.error('Failed to load alternative lyrics:', err);
      showError('Failed to load alternative lyrics candidates.');
      setCandidates([]);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const handleSelectCandidate = async (candidateId: string | number) => {
    if (!wrongLyricsSongId) return;
    const songId = wrongLyricsSongId;
    setWrongLyricsSongId(null);
    updateStatus(songId, { status: 'fetching' });
    try {
      const res = await lyricsService.ingestSong(songId, { candidateId, force: true });
      updateStatus(songId, {
        status: res.status as any,
        lineCount: res.lineCount,
        languages: res.languages,
      });
      if (res.status === 'found') {
        showSuccess('Alternative lyrics applied.');
      } else if (res.status === 'error') {
        showError(res.error || 'Failed to apply lyrics candidate.');
      }
      handleRunMatch();
    } catch (err) {
      console.error('Failed to ingest candidate lyrics:', err);
      updateStatus(songId, { status: 'error' });
      showError('Failed to apply lyrics candidate.');
    }
  };

  const handleSavePastedLyrics = async (manualLyrics: string) => {
    if (!pasteSongId) return;
    const songId = pasteSongId;
    setPasteSongId(null);
    updateStatus(songId, { status: 'fetching' });
    try {
      const res = await lyricsService.ingestSong(songId, { manualLyrics, force: true });
      updateStatus(songId, {
        status: res.status as any,
        lineCount: res.lineCount,
        languages: res.languages,
      });
      if (res.status === 'found' || res.status === 'manual') {
        showSuccess('Custom lyrics indexed successfully.');
      } else if (res.status === 'error') {
        showError(res.error || 'Failed to index custom lyrics.');
      }
      handleRunMatch();
    } catch (err) {
      console.error('Failed to save pasted lyrics:', err);
      updateStatus(songId, { status: 'error' });
      showError('Failed to index custom lyrics.');
    }
  };

  const wrongSong = songs.find((s) => s.id === wrongLyricsSongId);
  const pasteSong = songs.find((s) => s.id === pasteSongId);

  return (
    <div className="min-h-screen flex flex-col bg-theme-background-primary text-theme-text-primary selection:bg-primary-500/30 selection:text-primary-700 dark:selection:text-primary-200">
      <AppHeader />

      <main className="relative flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Ambient lighting glows */}
        <div className="pointer-events-none absolute -top-32 left-1/4 w-[600px] h-[350px] bg-primary-500/5 dark:bg-primary-600/10 blur-[140px] rounded-full" />
        <div className="pointer-events-none absolute top-48 right-10 w-[450px] h-[300px] bg-purple-500/5 dark:bg-purple-600/[0.07] blur-[130px] rounded-full" />

        {/* Offline Alert if Local Mode */}
        {isLocal && (
          <div className="relative overflow-hidden rounded-2xl p-0.5 bg-gradient-to-r from-amber-500/30 to-amber-500/10 shadow-[0_4px_24px_-4px_rgba(245,158,11,0.15)]">
            <div className="flex items-center gap-3.5 p-4 rounded-[calc(1rem-2px)] bg-theme-surface-base border border-amber-500/20 text-amber-600 dark:text-amber-300 text-xs sm:text-sm">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              </div>
              <div>
                <p className="font-semibold tracking-wide">Local mode active</p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-relaxed">
                  Lyric matching and auto-fetch require a cloud Supabase connection. Saved project lyric links remain accessible offline.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-theme-border-default">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-theme-text-primary font-sans">
              Lyric Matching
            </h1>
            <p className="text-sm sm:text-base text-theme-text-muted font-normal leading-relaxed">
              Uncover word-for-word coincidences, morphological variations, and semantic threads across your tracklist to craft seamless, context-aware vocal transitions.
            </p>
          </div>

          {/* Mode Switcher Pill with Machined Double-Bezel */}
          <div className="p-1 rounded-2xl bg-theme-surface-base border border-theme-border-default shadow-xs dark:shadow-xl flex items-center self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setMode('compare')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                mode === 'compare'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30 scale-[1.02]'
                  : 'text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Compare Selected
            </button>
            <button
              type="button"
              onClick={() => setMode('oneVsLibrary')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                mode === 'oneVsLibrary'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30 scale-[1.02]'
                  : 'text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              One vs Library
            </button>
          </div>
        </div>

        {/* Coverage Status Bar */}
        <LyricCoverageBanner
          songsWithLyrics={coverage.songsWithLyrics}
          totalSongs={coverage.totalSongs || songs.length}
        />

        {/* Primary Interactive Console (Machined Double-Bezel Card) */}
        <div className="relative group/console rounded-[1.75rem] p-1 bg-gradient-to-b from-theme-border-default/60 via-theme-border-subtle/30 to-transparent border border-theme-border-default shadow-xs dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]">
          <div className="rounded-[calc(1.75rem-4px)] p-6 sm:p-8 bg-theme-surface-base border border-theme-border-subtle space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-theme-text-secondary">
                  {mode === 'compare' ? 'Tracks Configuration' : 'Target Track Search'}
                </h2>
              </div>
              <span className="text-[11px] font-mono text-theme-text-muted">
                {mode === 'compare' ? `${selectedSongIds.length} / 20 selected` : 'Single song mode'}
              </span>
            </div>

            {/* Song Picker */}
            {mode === 'compare' ? (
              <LyricSongPicker
                songs={songs}
                selectedSongIds={selectedSongIds}
                onToggleSong={handleToggleSong}
                onClear={() => setSelectedSongIds([])}
              />
            ) : (
              <LyricSongPicker
                songs={songs}
                selectedSongIds={targetSongId ? [targetSongId] : []}
                onToggleSong={(id) => setTargetSongId(id === targetSongId ? '' : id)}
                onClear={() => setTargetSongId('')}
                maxSongs={1}
              />
            )}

            {/* Song Readiness / Lyric Status Grid */}
            {selectedSongIds.length > 0 && mode === 'compare' && (
              <div className="pt-5 border-t border-theme-border-default space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-theme-text-muted font-medium">Selected songs status & source override:</span>
                  <span className="text-[11px] text-theme-text-muted font-mono">
                    {selectedSongIds.filter((id) => statuses[id]?.status === 'found').length} / {selectedSongIds.length} ready
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {selectedSongIds.map((id) => {
                    const s = songs.find((song) => song.id === id);
                    if (!s) return null;
                    const statusInfo = statuses[id] || { status: 'idle' };
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between p-3 rounded-xl bg-theme-background-secondary/50 border border-theme-border-default text-xs hover:border-theme-border-strong hover:bg-theme-surface-hover transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Music className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400 shrink-0" />
                          <span className="truncate text-theme-text-primary font-medium">{s.title}</span>
                        </div>
                        <LyricSongStatusChip
                          status={statusInfo.status as any}
                          lineCount={statusInfo.lineCount}
                          onWrongLyricsClick={() => handleOpenWrongLyrics(id)}
                          onPasteClick={() => setPasteSongId(id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Primary Action Button (Island Button Architecture) */}
            <div className="flex items-center justify-between pt-5 border-t border-theme-border-default">
              <p className="text-xs text-theme-text-muted hidden sm:block">
                {mode === 'compare'
                  ? 'Select at least 2 tracks to start cross-analysis.'
                  : 'Analyzes target against all cached songs in your library.'}
              </p>

              <button
                type="button"
                onClick={handleRunMatch}
                disabled={
                  isMatching ||
                  isIngesting ||
                  (mode === 'compare' && selectedSongIds.length < 2) ||
                  (mode === 'oneVsLibrary' && !targetSongId)
                }
                className="group relative inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full text-xs font-bold tracking-wide bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all duration-200 shadow-[0_4px_24px_-4px_rgba(59,130,246,0.5)] active:scale-[0.98]"
              >
                <span>
                  {isMatching || isIngesting ? 'Analyzing Lyrics...' : 'Find Lyric Matches'}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                  {isMatching || isIngesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Results Container */}
        <div className="space-y-4 pt-4">
          <LyricMatchResults groups={matchedGroups} isLoading={isMatching} />
        </div>

        {/* Modals */}
        {wrongSong && (
          <WrongLyricsDialog
            isOpen={!!wrongLyricsSongId}
            songTitle={wrongSong.title}
            songArtist={wrongSong.artist}
            candidates={candidates}
            isLoading={isLoadingCandidates}
            onSelectCandidate={handleSelectCandidate}
            onClose={() => setWrongLyricsSongId(null)}
          />
        )}

        {pasteSong && (
          <PasteLyricsDialog
            isOpen={!!pasteSongId}
            songTitle={pasteSong.title}
            songArtist={pasteSong.artist}
            onSaveLyrics={handleSavePastedLyrics}
            onClose={() => setPasteSongId(null)}
          />
        )}
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
};

export default LyricMatchPage;
