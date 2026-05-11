/** Polar to Cartesian; angle in degrees, 0° = +x axis, increasing clockwise in SVG math (y down). */
export function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

/** SVG arc path from startAngle to endAngle on a circle (degrees). */
export function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const start = polarToCartesian(cx, cy, radius, startAngleDeg);
  const end = polarToCartesian(cx, cy, radius, endAngleDeg);
  const delta = endAngleDeg - startAngleDeg;
  const largeArc = Math.abs(delta) > 180 ? 1 : 0;
  const sweep = delta >= 0 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

export function wedgePath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngleDeg);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngleDeg);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngleDeg);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngleDeg);
  const delta = endAngleDeg - startAngleDeg;
  const largeArc = Math.abs(delta) > 180 ? 1 : 0;
  const sweep = delta >= 0 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} ${sweep} ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} ${1 - sweep} ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}
