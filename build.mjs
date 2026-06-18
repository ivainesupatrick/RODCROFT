/* Production build: minify HTML/CSS/JS into dist/ for static hosting (Hostinger). */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import CleanCSS from 'clean-css';
import { minify as minifyHtml } from 'html-minifier-terser';
import { minify as minifyJs } from 'terser';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');

const htmlPages = [
  'index.html', 'services.html', 'projects.html',
  'about.html', 'clients.html', 'contact.html',
];

async function rmrf(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

async function ensure(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyDir(src, destDir) {
  await ensure(destDir);
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(destDir, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

function fmt(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

async function run() {
  console.log('Building production bundle → dist/\n');
  await rmrf(dist);
  await ensure(dist);

  let inTotal = 0, outTotal = 0;

  // CSS
  const cssSrc = await fs.readFile(path.join(root, 'css/style.css'), 'utf8');
  const cssOut = new CleanCSS({ level: 2 }).minify(cssSrc).styles;
  await ensure(path.join(dist, 'css'));
  await fs.writeFile(path.join(dist, 'css/style.css'), cssOut);
  inTotal += cssSrc.length; outTotal += cssOut.length;
  console.log(`  css/style.css      ${fmt(cssSrc.length)} → ${fmt(cssOut.length)}`);

  // JS
  const jsSrc = await fs.readFile(path.join(root, 'js/main.js'), 'utf8');
  const jsOut = (await minifyJs(jsSrc, { compress: true, mangle: true })).code;
  await ensure(path.join(dist, 'js'));
  await fs.writeFile(path.join(dist, 'js/main.js'), jsOut);
  inTotal += jsSrc.length; outTotal += jsOut.length;
  console.log(`  js/main.js         ${fmt(jsSrc.length)} → ${fmt(jsOut.length)}`);

  // Assets (copy as-is)
  await copyDir(path.join(root, 'assets'), path.join(dist, 'assets'));
  console.log('  assets/            copied');

  // HTML
  for (const page of htmlPages) {
    const src = await fs.readFile(path.join(root, page), 'utf8');
    const out = await minifyHtml(src, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      minifyCSS: true,
      minifyJS: true,
      sortAttributes: true,
      sortClassName: true,
    });
    await fs.writeFile(path.join(dist, page), out);
    inTotal += src.length; outTotal += out.length;
    console.log(`  ${page.padEnd(18)} ${fmt(src.length)} → ${fmt(out.length)}`);
  }

  // .htaccess for Apache (gzip + cache headers)
  const htaccess = `# Rodcroft — Apache config for Hostinger
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml application/xml
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType image/svg+xml "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/webp "access plus 1 month"
  ExpiresByType text/html "access plus 1 hour"
</IfModule>
ErrorDocument 404 /index.html
`;
  await fs.writeFile(path.join(dist, '.htaccess'), htaccess);
  console.log('  .htaccess          written');

  const saved = inTotal ? (100 * (1 - outTotal / inTotal)).toFixed(1) : 0;
  console.log(`\nDone. ${fmt(inTotal)} → ${fmt(outTotal)} (${saved}% smaller). Output in dist/`);
}

run().catch((e) => { console.error(e); process.exit(1); });
