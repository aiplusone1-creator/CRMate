const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function verify() {
  const page = await get('http://localhost:3000/login');
  console.log('Login Page HTTP Status:', page.status);

  // Extract script and link tags
  const scripts = [...page.data.matchAll(/src="(\/_next\/[^"]+)"/g)].map(m => m[1]);
  const css = [...page.data.matchAll(/href="(\/_next\/[^"]+\.css[^"]*)"/g)].map(m => m[1]);

  console.log(`Found scripts: ${scripts.length}`);
  console.log(`Found CSS bundles: ${css.length}`);

  let failures = 0;
  for (const s of scripts) {
    const res = await get('http://localhost:3000' + s);
    if (res.status !== 200) {
      console.error(`Failed script: ${s} (Status: ${res.status})`);
      failures++;
    }
  }
  for (const c of css) {
    const res = await get('http://localhost:3000' + c);
    if (res.status !== 200) {
      console.error(`Failed CSS: ${c} (Status: ${res.status})`);
      failures++;
    }
  }

  console.log(`Asset Verification Result: ${failures === 0 ? 'ALL ASSETS LOADED CLEANLY (HTTP 200)' : `${failures} failures`}`);
}

verify().catch(console.error);
