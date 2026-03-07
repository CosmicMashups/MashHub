import { useState } from 'react';
import { BarChart3, Music, Download } from 'lucide-react';
import { BpmFlowGraph } from './BpmFlowGraph';
import { KeyGraph } from './KeyGraph';
import type { ProjectWithSections } from '../types';

export interface ProjectOptionsMenuProps {
  project: ProjectWithSections;
  onExportSet?: () => void;
  children?: React.ReactNode;
}

export function ProjectOptionsMenu({ project, onExportSet, children }: ProjectOptionsMenuProps) {
  const [openMenu, setOpenMenu] = useState(false);
  const [showBpmModal, setShowBpmModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu((v) => !v)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
          aria-label="Project options"
          aria-expanded={openMenu}
        >
          {children ?? <BarChart3 size={18} />}
        </button>
        {openMenu && (
          <>
            <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpenMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[160px]">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => { setShowBpmModal(true); setOpenMenu(false); }}
              >
                <BarChart3 size={16} /> View BPM Flow
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => { setShowKeyModal(true); setOpenMenu(false); }}
              >
                <Music size={16} /> View Key Graph
              </button>
              {onExportSet && (
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  onClick={() => { onExportSet(); setOpenMenu(false); }}
                >
                  <Download size={16} /> Export Set
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {showBpmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">BPM Flow</h3>
            <BpmFlowGraph project={project} />
            <button
              type="button"
              className="mt-4 btn-secondary"
              onClick={() => setShowBpmModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Graph</h3>
            <KeyGraph project={project} />
            <button
              type="button"
              className="mt-4 btn-secondary"
              onClick={() => setShowKeyModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
