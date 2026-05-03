import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getCamelotPosition } from '../constants/camelot';
import { normalizeKeyForCamelot } from '../utils/keyColors';
import type { ProjectWithSections } from '../types';

export interface KeyGraphProps {
  project: ProjectWithSections;
}

/** One point per song in project order; key from song (primaryKey/keys from song sections). Y-axis: Camelot position 1-12. */
export function KeyGraph({ project }: KeyGraphProps) {
  const data = [...project.sections]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .flatMap((sec) =>
      sec.songs.map((song) => {
        const rawKey = song.primaryKey ?? song.keys?.[0] ?? '';
        const normalizedKey = normalizeKeyForCamelot(rawKey) ?? rawKey;
        const position = getCamelotPosition(normalizedKey);
        return {
          label: `${sec.name}: ${song.title}`,
          section: sec.name,
          key: rawKey,
          position: position ?? 0,
        };
      })
    );

  const validData = data.filter((d) => d.position > 0);
  const hasData = validData.length > 0;

  if (!hasData) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 p-4">No key data in project sections.</p>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={validData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12 }} domain={[1, 12]} />
          <Tooltip
            formatter={(value: unknown, _name: unknown, props: unknown) => {
              const payload = (props as { payload?: { key?: string } })?.payload;
              const label = payload?.key ?? value ?? '';
              return [String(label), 'Key'] as [React.ReactNode, string];
            }}
            labelFormatter={(label) => String(label)}
          />
          <Line type="monotone" dataKey="position" stroke="var(--color-primary-600)" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
