import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const nextBuildDirectory = fileURLToPath(
  new URL('../packages/main/.next', import.meta.url),
);

await rm(nextBuildDirectory, { force: true, recursive: true });

console.log('Cleaned packages/main/.next');
