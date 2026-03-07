import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ProjectWithSections } from '../types';

export interface BpmFlowGraphProps {
  project: ProjectWithSections;
}

/** Build one point per song in project order (sections by orderIndex, then songs within section). Uses section-level BPM (primaryBpm / bpms from song). */
export function BpmFlowGraph({ project }: BpmFlowGraphProps) {
  const data = project.sections
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .flatMap((sec) =>
      sec.songs.map((song) => {
        const bpm = song.primaryBpm ?? song.bpms?.[0];
        return { label: `${sec.name}: ${song.title}`, section: sec.name, bpm: bpm ?? 0 };
      })
    )
    .filter((d) => d.bpm != null && typeof d.bpm === 'number' && d.bpm > 0);

  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 p-4">No BPM data in project sections.</p>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
          <Tooltip
            formatter={(value: unknown) => [`${value ?? ''}`, 'BPM']}
            labelFormatter={(label) => String(label)}
          />
          <Line type="monotone" dataKey="bpm" stroke="var(--color-primary-600)" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
