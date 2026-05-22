import { Folder, ImagePlus } from 'lucide-react';
import { FloatingFieldShell } from '../inputs/FloatingFieldShell';

export interface ProjectDialogCoverArtFieldProps {
  coverImage: string | null;
  onCoverImageChange: (dataUrl: string | null) => void;
  inputId?: string;
}

export function ProjectDialogCoverArtField({
  coverImage,
  onCoverImageChange,
  inputId = 'project-cover',
}: ProjectDialogCoverArtFieldProps) {
  return (
    <FloatingFieldShell
      label="Cover art"
      icon={<ImagePlus size={16} className="text-violet-500" />}
    >
      <div className="flex items-center gap-4 pt-1">
        <div className="w-20 h-20 rounded-lg border-2 border-dashed border-theme-border-default flex items-center justify-center overflow-hidden bg-theme-bg-secondary shrink-0">
          {coverImage ? (
            <img src={coverImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <Folder size={28} className="text-theme-text-muted" />
          )}
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result;
                if (typeof result === 'string') onCoverImageChange(result);
              };
              reader.readAsDataURL(file);
            }}
            className="text-sm text-theme-text-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-100 file:text-primary-700 dark:file:bg-primary-900/30 dark:file:text-primary-300 hover:file:bg-primary-200 dark:hover:file:bg-primary-800/50 w-full"
          />
          {coverImage && (
            <button
              type="button"
              onClick={() => onCoverImageChange(null)}
              className="text-xs text-theme-text-muted hover:text-theme-accent-danger text-left"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </FloatingFieldShell>
  );
}
