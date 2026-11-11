import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { buildCss, buildJs } from './lib.mjs';

const root = new URL('../', import.meta.url);
const source = JSON.parse(readFileSync(new URL('figma/variables.json', root)));
mkdirSync(new URL('dist/', root), { recursive: true });

const { js, dts, json } = buildJs(source);
const files = {
  'dist/tokens.css': buildCss(source),
  'dist/tokens.js': js,
  'dist/tokens.d.ts': dts,
  'dist/tokens.json': json,
};
for (const [path, contents] of Object.entries(files)) {
  writeFileSync(new URL(path, root), contents);
  console.log(`wrote ${path} (${contents.length} bytes)`);
}
