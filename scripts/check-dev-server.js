const http = require('http');

/**
 * Checks if a Next.js development server is currently running on the target port.
 * Running `next build` while `next dev` is active corrupts the `.next` directory.
 */
function checkDevServer() {
  const port = process.env.PORT || 3000;
  const req = http.get(`http://localhost:${port}`, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      if (data.includes('"buildId":"development"')) {
        console.error(`\x1b[31m[ERROR] A Next.js development server is currently running on port ${port}.\x1b[0m`);
        console.error('\x1b[31mRunning `next build` while `next dev` is active corrupts the `.next` directory.\x1b[0m');
        console.error('Please stop your `next dev` server before building and running production E2E tests.\n');
        process.exit(1);
      }
      process.exit(0);
    });
  });

  req.on('error', () => {
    // Port is inactive or connection refused -> completely safe to proceed
    process.exit(0);
  });

  req.setTimeout(1500, () => {
    req.destroy();
    process.exit(0);
  });
}

checkDevServer();
