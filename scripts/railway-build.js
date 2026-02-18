#!/usr/bin/env node
/**
 * Railway Post-Install Build Script
 *
 * Runs Angular production build + server dependency install ONLY on Railway.
 * Skips silently on local dev machines to keep `npm install` fast.
 *
 * Triggered by: package.json "postinstall" → "node scripts/railway-build.js"
 * Railway sets RAILWAY_ENVIRONMENT automatically on all deployments.
 */
const { execSync } = require('child_process');

if (!process.env.RAILWAY_ENVIRONMENT) {
  console.log('[railway-build] Not on Railway — skipping production build.');
  process.exit(0);
}

console.log('[railway-build] Railway detected — building Angular for production...');

try {
  // Step 1: Build Angular SPA
  execSync('npx ng build --configuration production', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('[railway-build] ✅ Angular build complete.');

  // Step 2: Install server production dependencies
  execSync('npm ci --omit=dev', {
    stdio: 'inherit',
    cwd: require('path').join(process.cwd(), 'server'),
  });
  console.log('[railway-build] ✅ Server dependencies installed.');

} catch (err) {
  console.error('[railway-build] ❌ Build failed:', err.message);
  process.exit(1);
}
