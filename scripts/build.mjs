import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { applyExtensions, buildCss, buildJs } from './lib.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root)));
const source = applyExtensions(read('figma/variables.json'), read('tokens/extensions.json'));
mkdirSync(new URL('dist/', root), { recursive: true });

const { js, dts, json } = buildJs(source);
const files = {
  'dist/tokens.css': buildCss(source),
  'dist/tokens.js': js,
  'dist/tokens.d.ts': dts,
  'dist/tokens.json': json,
  'dist/components.css': readFileSync(new URL('components/components.css', root), 'utf8'),
};
for (const [path, contents] of Object.entries(files)) {
  writeFileSync(new URL(path, root), contents);
  console.log(`wrote ${path} (${contents.length} bytes)`);
}
