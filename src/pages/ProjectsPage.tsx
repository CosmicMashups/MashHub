import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useSongs } from '../hooks/useSongs';
import { useTheme } from '../hooks/useTheme';
import { projectService } from '../services/projectService';
import type { ProjectWithSections, ProjectType, Project } from '../types';
import { MainInstrumentalConfig } from '../components/MainInstrumentalConfig';
import { Folder, Plus, Trash2, X, RotateCcw, Type, Calendar, CalendarRange, ArrowLeft } from 'lucide-react';
import { Footer } from '../components/Footer';
import { LegalModal } from '../components/LegalModal';
import { type SeasonValue } from '../components/SeasonSelect';
import { FloatingInput, FloatingSelect, FloatingSeasonSelect, FloatingSongTypeMultiSelect } from '../components/inputs';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PrimaryLoader } from '../components/loading/PrimaryLoader';
import { AppHeader } from '../components/layout/AppHeader';
import { MainNavLinks } from '../components/layout/MainNavLinks';
import { PRIVACY_POLICY_CONTENT, TERMS_OF_SERVICE_CONTENT } from '../content/legalContent';
import { ProjectDialogCoverArtField } from '../components/projectDialog/ProjectDialogCoverArtField';
import {
  PROJECT_DIALOG_BODY_CLASS,
  PROJECT_DIALOG_FOOTER_CLASS,
  PROJECT_DIALOG_HEADER_CLASS,
  PROJECT_DIALOG_PANEL_CLASS,
} from '../components/projectDialog/layout';

const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: 'song-megamix', label: 'Song' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'year-end', label: 'Year-End' },
  { value: 'decade', label: 'Decade' },
  { value: 'other', label: 'Other' },
];

export function ProjectsPage() {
  const navigate = useNavigate();
  useTheme(); // Keep document theme in sync when this route is mounted (e.g. direct load or after refresh)
  const { projects, loading, error, addProject, deleteProject } = useProjects();
  const { songs: librarySongs } = useSongs();
  const [projectsWithSections, setProjectsWithSections] = useState<ProjectWithSections[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ProjectType>('other');
  const [formSeason, setFormSeason] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formYearStart, setFormYearStart] = useState('');
  const [formYearEnd, setFormYearEnd] = useState('');
  const [formCoverImage, setFormCoverImage] = useState<string | null>(null);
  const [formAllowedSongTypes, setFormAllowedSongTypes] = useState<string[]>([]);
  const [megamixFormDraft, setMegamixFormDraft] = useState<
    Partial<
      Pick<Project, 'mainInstrumentalSongId' | 'mainInstrumentalSongName' | 'acceptedKeys' | 'bpmRangeMin' | 'bpmRangeMax'>
    >
  >({});
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const loadProjectsWithSections = useCallback(async () => {
    if (projects.length === 0) {
      setProjectsWithSections([]);
      return;
    }
    const data = await Promise.all(
      projects.map(async (p) => {
        try {
          return await projectService.getProjectWithSections(p.id);
        } catch {
          return { ...p, sections: [] } as ProjectWithSections;
        }
      })
    );
    setProjectsWithSections(data);
  }, [projects]);

  useEffect(() => {
    void loadProjectsWithSections();
  }, [loadProjectsWithSections]);

  const resetForm = useCallback(() => {
    setFormName('');
    setFormType('other');
    setFormSeason('');
    setFormYear('');
    setFormYearStart('');
    setFormYearEnd('');
    setFormCoverImage(null);
    setMegamixFormDraft({});
    setFormAllowedSongTypes([]);
  }, []);

  const openDialog = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    resetForm();
  }, [resetForm]);

  const handleCreateProject = async () => {
    if (!formName.trim()) return;
    const yearNum = formYear.trim() ? parseInt(formYear.trim(), 10) : undefined;
    const yearValid = yearNum != null && !Number.isNaN(yearNum) && yearNum >= 0 && yearNum <= 9999;
    const startNum = formYearStart.trim() ? parseInt(formYearStart.trim(), 10) : undefined;
    const endNum = formYearEnd.trim() ? parseInt(formYearEnd.trim(), 10) : undefined;
    const rangeValid =
      formType !== 'decade' ||
      (startNum != null &&
        !Number.isNaN(startNum) &&
        endNum != null &&
        !Number.isNaN(endNum) &&
        startNum <= endNum);

    if (formType === 'seasonal' && formSeason.trim() === '') {
      alert('Please select a season for Seasonal projects.');
      return;
    }
    if ((formType === 'seasonal' || formType === 'year-end') && (yearNum == null || Number.isNaN(yearNum) || yearNum < 0 || yearNum > 9999)) {
      alert('Please enter a valid 4-digit year (0000–9999) for this project type.');
      return;
    }
    if (formType === 'decade' && (!rangeValid || startNum == null || endNum == null)) {
      alert('Please enter a valid year range (start and end) for Decade projects.');
      return;
    }

    try {
      const project = await addProject({
        name: formName.trim(),
        type: formType,
        ...(formType === 'seasonal' && formSeason.trim() ? { season: formSeason.trim() } : {}),
        ...((formType === 'seasonal' || formType === 'year-end') && yearValid && yearNum != null ? { year: yearNum } : {}),
        ...(formType === 'decade' && startNum != null && endNum != null ? { yearRangeMin: startNum, yearRangeMax: endNum } : {}),
        ...(formCoverImage ? { coverImage: formCoverImage } : {}),
        ...(formType === 'song-megamix'
          ? {
              mainInstrumentalSongId: megamixFormDraft.mainInstrumentalSongId,
              mainInstrumentalSongName: megamixFormDraft.mainInstrumentalSongName,
              acceptedKeys: megamixFormDraft.acceptedKeys,
              bpmRangeMin: megamixFormDraft.bpmRangeMin,
              bpmRangeMax: megamixFormDraft.bpmRangeMax,
            }
          : {}),
        ...(formAllowedSongTypes.length > 0 ? { allowedSongTypes: formAllowedSongTypes } : {}),
      });
      closeDialog();
      await loadProjectsWithSections();
      navigate(`/projects/${project.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setDeleteProjectId(projectId);
  };

  const confirmDeleteProject = async () => {
    if (!deleteProjectId) return;
    try {
      await deleteProject(deleteProjectId);
      await loadProjectsWithSections();
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeleteProjectId(null);
    }
  };

  const showSeason = formType === 'seasonal';
  const showYear = formType === 'seasonal' || formType === 'year-end';
  const showYearRange = formType === 'decade';
  const dialogWide = useMemo(() => formType === 'song-megamix', [formType]);

  if (loading) {
    return <PrimaryLoader label="Loading projects" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-theme-background-primary flex items-center justify-center p-4">
        <p className="text-theme-state-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-background-primary">
      <AppHeader
        actions={
          <>
            <Link
              to="/"
              className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm text-theme-text-secondary transition-colors hover:bg-theme-state-hover hover:text-theme-text-primary"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Library
            </Link>
            <MainNavLinks showProjects={false} showLibrary={false} />
          </>
        }
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-theme-text-primary">Project Manager</h1>
            <p className="mt-1 text-sm text-theme-text-secondary">Manage project workspaces, sections, and arrangement flow.</p>
          </div>
        </div>

        {projectsWithSections.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={openDialog}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Create Project
            </button>
          </div>
        )}

        <div className="min-h-[200px]">
          {projectsWithSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-theme-text-secondary">
              <button
                type="button"
                onClick={openDialog}
                className="mb-4 inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-theme-border-default px-5 py-3 transition-colors hover:border-theme-accent-primary hover:text-theme-accent-primary"
              >
                <Plus size={22} />
                Create Project
              </button>
              <Folder size={48} className="mx-auto mb-2 text-theme-text-disabled" />
              <p>No projects yet. Create one above.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {projectsWithSections.map((project) => {
                const songCount = project.sections.reduce((sum, s) => sum + s.songs.length, 0);
                return (
                  <li key={project.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${project.id}`)}
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-theme-border-default bg-theme-surface-base transition-all hover:border-theme-border-strong hover:shadow-[var(--theme-shadow-card)]"
                    >
                      <div className="p-3">
                        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-theme-bg-secondary">
                          {project.coverImage ? (
                            <img
                              src={project.coverImage}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <Folder size={48} className="text-theme-text-disabled" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProject(e, project.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600/90 transition-opacity"
                            aria-label="Delete project"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="px-3 pb-3 flex-1 flex flex-col justify-center min-h-0">
                        <p className="truncate font-medium text-theme-text-primary">{project.name}</p>
                        <p className="text-sm text-theme-text-secondary">
                          {project.sections.length} section(s), {songCount} song(s)
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60">
          <div
            className={`${PROJECT_DIALOG_PANEL_CLASS} ${dialogWide ? 'max-w-2xl' : 'max-w-md'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
          >
            <div className={PROJECT_DIALOG_HEADER_CLASS}>
              <h2 id="new-project-title" className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Folder size={20} className="text-blue-500" />
                New Project
              </h2>
              <button
                type="button"
                onClick={closeDialog}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className={PROJECT_DIALOG_BODY_CLASS}>
              <ProjectDialogCoverArtField
                coverImage={formCoverImage}
                onCoverImageChange={setFormCoverImage}
                inputId="project-cover"
              />

              <FloatingInput
                id="project-name"
                label="Project name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateProject())}
                placeholder="e.g. Summer 2024"
                icon={<Folder size={16} className="text-blue-500" />}
              />

              <FloatingSelect
                label="Project type"
                id="project-type"
                value={formType}
                onChange={(e) => setFormType(e.target.value as ProjectType)}
                icon={<Type size={16} className="text-amber-500" />}
              >
                {PROJECT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </FloatingSelect>

              <FloatingSongTypeMultiSelect
                id="project-song-types"
                value={formAllowedSongTypes}
                onChange={setFormAllowedSongTypes}
              />

              {formType === 'song-megamix' && (
                <MainInstrumentalConfig
                  variant="dialog"
                  songs={librarySongs}
                  {...megamixFormDraft}
                  onChange={(patch) => setMegamixFormDraft((prev) => ({ ...prev, ...patch }))}
                />
              )}

              {showSeason && (
                <FloatingSeasonSelect
                  id="project-season"
                  value={formSeason as SeasonValue}
                  onChange={(v) => setFormSeason(v)}
                />
              )}

              {showYear && (
                <FloatingInput
                  id="project-year"
                  label="Year"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={formYear}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFormYear(v);
                  }}
                  placeholder="e.g. 2024"
                  icon={<Calendar size={16} className="text-emerald-500" />}
                />
              )}

              {showYearRange && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FloatingInput
                    id="project-year-start"
                    label="Year (start)"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={formYearStart}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setFormYearStart(v);
                    }}
                    placeholder="e.g. 2010"
                    icon={<CalendarRange size={16} className="text-purple-500" />}
                  />
                  <FloatingInput
                    id="project-year-end"
                    label="Year (end)"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={formYearEnd}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setFormYearEnd(v);
                    }}
                    placeholder="e.g. 2022"
                    icon={<CalendarRange size={16} className="text-pink-500" />}
                  />
                </div>
              )}
            </div>

            <div className={PROJECT_DIALOG_FOOTER_CLASS}>
              <button
                type="button"
                onClick={closeDialog}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <RotateCcw size={16} className="text-gray-500" />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreateProject()}
                disabled={!formName.trim()}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Folder size={16} className="text-white" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteProjectId != null}
        title="Delete project?"
        message="Are you sure you want to delete this project? All songs will be removed."
        confirmText="Delete"
        destructive
        onCancel={() => setDeleteProjectId(null)}
        onConfirm={() => void confirmDeleteProject()}
      />

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
}
