import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import * as url from 'url';
import * as path from 'path';
import * as fs from 'fs';

function fromDir(startPath: string, filter: string, results: string[] = []) {
  if (!fs.existsSync(startPath)) {
    console.log('there is no directory', startPath);
    return;
  }

  const files = fs.readdirSync(startPath);
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i]);
    const stat = fs.lstatSync(filename);

    if (stat.isDirectory()) {
      fromDir(filename, filter, results);
    } else if (filename.endsWith(filter)) {
      results.push(filename);
    }
  }

  return results;
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const filenames = fromDir(__dirname + '/src', '.html');

// https://vitejs.dev/config/
export default defineConfig({
  // root: '.',
  // publicDir: './public',
  plugins: [svelte()],
  assetsInclude: ['**/*.frag', '**/*.vert'],
  build: {
    rollupOptions: {
      input: filenames,
    },
  },
});
