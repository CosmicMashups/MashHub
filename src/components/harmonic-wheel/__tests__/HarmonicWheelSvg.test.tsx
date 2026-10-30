import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { HarmonicWheelSvg } from '../HarmonicWheelSvg';
import { getHarmonicWheelSegments } from '../../../utils/harmonicWheelDataset';

describe('HarmonicWheelSvg', () => {
  const segments = getHarmonicWheelSegments();

  it('renders all 12 wheel wedges with outline:none and no selection border when selected', () => {
    const onSelectPc = vi.fn();
    const onHoverPc = vi.fn();

    const { container } = render(
      <HarmonicWheelSvg
        segments={segments}
        selectedPc={6}
        hoveredPc={null}
        onHoverPc={onHoverPc}
        onSelectPc={onSelectPc}
      />
    );

    const paths = container.querySelectorAll('path[role="button"]');
    expect(paths.length).toBe(12);

    // Selected path (F# has pitchClass 6)
    const selectedPath = Array.from(paths).find(
      (p) => p.getAttribute('aria-pressed') === 'true'
    ) as SVGPathElement;

    expect(selectedPath).toBeDefined();
    // Verify outline is none
    expect(selectedPath.style.outline).toBe('none');
    // Verify stroke width does not exceed 1.5 (no heavy selection border)
    expect(selectedPath.getAttribute('stroke-width')).toBe('1.5');
  });
});
