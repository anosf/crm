import { execFileSync } from 'node:child_process';
import { cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Builds the publishable artifact.
 *
 * Development runs the TypeScript directly through Node's type stripping, but
 * that is refused for files under node_modules — so a package whose bin points
 * at a .ts file installs fine and then cannot run. Publishing therefore ships
 * compiled JavaScript, plus the two things tsc does not copy: the SQL
 * migrations and the browser bundle.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args) =>
  execFileSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });

rmSync(resolve(root, 'dist'), { recursive: true, force: true });

run('npx', ['tsc', '-p', 'tsconfig.build.json']);

// Migrations are read from disk relative to the compiled db/index.js.
cpSync(resolve(root, 'src/db/migrations'), resolve(root, 'dist/db/migrations'), {
  recursive: true,
});

// The web UI is served from <package root>/public, so it must exist in the tarball.
run('node', ['scripts/build-web.mjs']);

for (const required of [
  'dist/main.js',
  'dist/cli/main.js',
  'dist/mcp/stdio.js',
  'dist/db/migrations/0001_init.sql',
  'public/index.html',
  'public/assets/app.js',
]) {
  if (!existsSync(resolve(root, required))) {
    console.error(`build incomplete: ${required} is missing`);
    process.exit(1);
  }
}
console.log('build ok — dist/ and public/ are ready to publish');
