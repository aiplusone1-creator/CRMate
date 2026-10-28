const { spawnSync } = require('child_process');
const net = require('net');

const PORT = process.env.PORT || 3001;
const DIST_DIR = process.env.NEXT_DIST_DIR || '.next-test';

process.env.PORT = String(PORT);
process.env.NEXT_DIST_DIR = DIST_DIR;
process.env.CRMATE_TEST_MODE = 'true';
process.env.AUTH_SECRET = 'crmate-e2e-test-secret-key-2026';

function checkPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function main() {
  console.log(`\n=== CRMate E2E Production Test Workflow ===`);
  console.log(`Target Port: ${PORT}`);
  console.log(`Isolated Build Directory: ${DIST_DIR}\n`);

  const isFree = await checkPortFree(PORT);
  if (!isFree) {
    console.error(`\x1b[31m[ERROR] Port ${PORT} is already in use.\x1b[0m`);
    console.error(`Make sure no other test server is running on port ${PORT}.\n`);
    process.exit(1);
  }

  // 1. Build Next.js application into isolated test directory
  console.log(`[1/2] Building Next.js production bundle into '${DIST_DIR}'...`);
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const buildResult = spawnSync(npxCmd, ['next', 'build'], {
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });

  if (buildResult.status !== 0) {
    console.error(`\x1b[31m[ERROR] Production build failed with exit code ${buildResult.status}\x1b[0m`);
    process.exit(buildResult.status || 1);
  }

  // 2. Run Playwright test suite (Playwright orchestrates 'next start' on PORT)
  console.log(`\n[2/2] Starting Playwright test execution with webServer on port ${PORT}...`);
  const testArgs = ['playwright', 'test', ...process.argv.slice(2)];
  const testResult = spawnSync(npxCmd, testArgs, {
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });

  process.exit(testResult.status || 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
