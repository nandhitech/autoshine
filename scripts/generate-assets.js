import { mkdir, readFile, readdir, rename, writeFile, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const generator = path.join(root, 'node_modules/@capacitor/assets/bin/capacitor-assets');
const result = spawnSync(process.execPath, [
  generator,
  'generate',
  '--iconBackgroundColor=#06101e',
  '--splashBackgroundColor=#06101e',
  '--pwaNoAppleFetch',
], { cwd: root, stdio: 'inherit' });

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const sourceIcons = path.join(root, 'icons');
const publicIcons = path.join(root, 'public/icons');
await mkdir(publicIcons, { recursive: true });

for (const filename of await readdir(sourceIcons)) {
  const match = filename.match(/^icon-(\d+)\.webp$/);
  if (!match) {
    continue;
  }

  const destination = path.join(publicIcons, `icon-${match[1]}.png`);
  await rename(path.join(sourceIcons, filename), destination);
  const icon = await sharp(destination)
    .flatten({ background: '#06101e' })
    .png()
    .toBuffer();
  await writeFile(destination, icon);
}

const manifestPath = path.join(root, 'public/manifest.webmanifest');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.icons = manifest.icons.map((icon) => ({
  ...icon,
  src: icon.src.replace('../icons/', '/icons/').replace(/\.webp$/, '.png'),
  type: 'image/png',
}));
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await copyFile(path.join(publicIcons, 'icon-192.png'), path.join(root, 'public/apple-touch-icon.png'));
