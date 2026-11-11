// Re-export figma/variables.json from the Papper Figma file.
//
// Figma's Variables REST API is Enterprise-only, so this runs as Plugin API code:
// paste it into the Figma MCP `use_figma` tool (fileKey gVnF1G3vYFO74d7UeyaIp7) or a
// scratch plugin, then save the returned JSON over figma/variables.json and run
// `npm run build && npm test`.
const toHex = c => {
  const h = v => Math.round(v * 255).toString(16).padStart(2, '0');
  return '#' + h(c.r) + h(c.g) + h(c.b) + (c.a === undefined || c.a === 1 ? '' : h(c.a));
};
const weightOf = style => ({ thin: 100, ultralight: 200, light: 300, regular: 400, medium: 500,
  semibold: 590, 'semi bold': 600, bold: 700, 'extra bold': 800, heavy: 800, black: 900 })[style.toLowerCase()] ?? 400;
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const byId = Object.fromEntries(vars.map(v => [v.id, v]));
const collections = cols.map(c => ({
  name: c.name,
  modes: c.modes.map(m => m.name),
  defaultMode: c.modes.find(m => m.modeId === c.defaultModeId)?.name,
  variables: c.variableIds.map(id => byId[id]).filter(Boolean).map(v => ({
    n: v.name, t: v.resolvedType,
    v: Object.fromEntries(c.modes.map(m => {
      const raw = v.valuesByMode[m.modeId];
      if (raw && raw.type === 'VARIABLE_ALIAS') return [m.name, { alias: byId[raw.id]?.name ?? raw.id }];
      if (raw && typeof raw === 'object' && 'r' in raw) return [m.name, toHex(raw)];
      return [m.name, raw];
    })),
  })),
}));
const text = (await figma.getLocalTextStylesAsync()).map(s => ({
  n: s.name, family: s.fontName.family, style: s.fontName.style, size: s.fontSize, weight: weightOf(s.fontName.style),
}));
const effect = (await figma.getLocalEffectStylesAsync()).map(s => ({
  n: s.name, effects: s.effects.filter(e => e.type.endsWith('SHADOW')).map(e => ({
    type: e.type, color: toHex(e.color), offset: e.offset, radius: e.radius, spread: e.spread ?? 0 })),
}));
const paint = (await figma.getLocalPaintStylesAsync()).map(s => ({
  n: s.name, paints: s.paints.filter(p => p.type.startsWith('GRADIENT')).map(p => ({
    type: p.type,
    // Figma's angular start is the transform's rotation; 90deg matches this file.
    startAngleDeg: Math.round(Math.atan2(p.gradientTransform[1][0], p.gradientTransform[0][0]) * -180 / Math.PI + 360) % 360,
    stops: p.gradientStops.map(g => [toHex(g.color), +g.position.toFixed(3)]),
  })),
}));
return {
  source: { fileKey: figma.fileKey, page: 'Colors: tokens system', exportedAt: new Date().toISOString().slice(0, 10),
    exporter: 'scripts/figma-export.plugin.js via Figma MCP use_figma' },
  collections, styles: { text, effect, paint },
};
