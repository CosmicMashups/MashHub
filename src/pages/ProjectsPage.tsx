import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useTheme } from '../hooks/useTheme';
import { projectService } from '../services/projectService';
import type { ProjectWithSections, ProjectType } from '../types';
import { Folder, Plus, Trash2, Music, X, RotateCcw, Type, Sun, Calendar, CalendarRange, ImagePlus, Info } from 'lucide-react';
import { Footer } from '../components/Footer';
import { LegalModal } from '../components/LegalModal';
import { UserMenu } from '../components/UserMenu';
import { SeasonSelect, type SeasonValue } from '../components/SeasonSelect';
import { FloatingInput, FloatingSelect } from '../components/inputs';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PrimaryLoader } from '../components/loading/PrimaryLoader';
import { PRIVACY_POLICY_CONTENT, TERMS_OF_SERVICE_CONTENT } from '../content/legalContent';

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
  const [projectsWithSections, setProjectsWithSections] = useState<ProjectWithSections[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ProjectType>('other');
  const [formSeason, setFormSeason] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formYearStart, setFormYearStart] = useState('');
  const [formYearEnd, setFormYearEnd] = useState('');
  const [formCoverImage, setFormCoverImage] = useState<string | null>(null);
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
      <header className="sticky top-0 z-40 bg-theme-surface-base/95 backdrop-blur-sm border-b border-theme-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-theme-accent-primary to-theme-accent-hover rounded-lg flex items-center justify-center">
                <Music className="h-6 w-6 text-theme-text-inverse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-theme-text-primary">MashHub</h1>
                <p className="text-sm text-theme-text-muted">
                  Music Library & Database
                </p>
              </div>
            </Link>
            <div className="flex items-center space-x-2">
              <Link
                to="/"
                className="px-3 py-2.5 min-h-[44px] text-sm text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-state-hover rounded-lg transition-colors flex items-center"
              >
                Back to Library
              </Link>
              <Link
                to="/about"
                className="px-3 py-2.5 min-h-[44px] text-sm text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-state-hover rounded-lg transition-colors flex items-center"
                title="About MashHub"
              >
                <Info size={16} className="inline mr-1" />
                About
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-theme-text-primary mb-6">Projects</h1>

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
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <button
                type="button"
                onClick={openDialog}
                className="mb-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:text-primary-600 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-colors"
              >
                <Plus size={22} />
                Create Project
              </button>
              <Folder size={48} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
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
                      className="group flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer overflow-hidden"
                    >
                      <div className="p-3">
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                          {project.coverImage ? (
                            <img
                              src={project.coverImage}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <Folder size={48} className="text-gray-300 dark:text-gray-500" />
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
                        <p className="font-medium text-gray-900 dark:text-white truncate">{project.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-600"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
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

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <ImagePlus size={16} className="text-violet-500" />
                  Cover art
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700/50 shrink-0">
                    {formCoverImage ? (
                      <img src={formCoverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Folder size={28} className="text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      id="project-cover"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = reader.result;
                          if (typeof result === 'string') setFormCoverImage(result);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="text-sm text-gray-600 dark:text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-100 file:text-primary-700 dark:file:bg-primary-900/30 dark:file:text-primary-300 hover:file:bg-primary-200 dark:hover:file:bg-primary-800/50"
                    />
                    {formCoverImage && (
                      <button
                        type="button"
                        onClick={() => setFormCoverImage(null)}
                        className="text-xs text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <FloatingInput
                  id="project-name"
                  label="Project Name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateProject())}
                  placeholder="e.g. Summer 2024"
                  icon={<Folder size={16} className="text-blue-500" />}
                />
              </div>

              <div>
                <FloatingSelect
                  label="Project Type"
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
              </div>

              {showSeason && (
                <div>
                  <label
                    htmlFor="project-season"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2"
                  >
                    <Sun size={16} className="text-sky-500" />
                    Season
                  </label>
                  <SeasonSelect
                    id="project-season"
                    value={formSeason as SeasonValue}
                    onChange={(v) => setFormSeason(v)}
                    placeholder="Select season"
                  />
                </div>
              )}

              {showYear && (
                <div>
                  <FloatingInput
                    id="project-year"
                    label="Year (e.g. 2000)"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={formYear}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setFormYear(v);
                    }}
                    placeholder="e.g. 2024"
                    icon={<Calendar size={14} className="text-emerald-500" />}
                  />
                </div>
              )}

              {showYearRange && (
                <>
                  <div>
                    <FloatingInput
                      id="project-year-start"
                      label="Year (Start)"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={formYearStart}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setFormYearStart(v);
                      }}
                      placeholder="e.g. 2010"
                      icon={<CalendarRange size={14} className="text-purple-500" />}
                    />
                  </div>
                  <div>
                    <FloatingInput
                      id="project-year-end"
                      label="Year (End)"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={formYearEnd}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setFormYearEnd(v);
                      }}
                      placeholder="e.g. 2022"
                      icon={<CalendarRange size={14} className="text-pink-500" />}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
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
