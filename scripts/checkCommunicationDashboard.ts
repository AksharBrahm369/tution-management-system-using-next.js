import fetch from 'node-fetch';

async function login() {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'darshanzala369@gmail.com', password: 'Darshan@369', rememberMe: true }),
  });
  if (!res.ok) throw new Error('Login failed: ' + await res.text());
  const cookie = res.headers.get('set-cookie')?.split(';')[0];
  return cookie || '';
}

async function check(cookie: string, path: string) {
  const url = `http://localhost:3000${path}`;
  const res = await fetch(url, { headers: { Cookie: cookie } });
  const text = await res.text();
  console.log(path, '->', res.status);
  try { console.log(JSON.stringify(JSON.parse(text), null, 2).slice(0, 1000)); } catch { console.log(text.slice(0, 1000)); }
}

async function main() {
  const cookie = await login();
  // Some endpoints expect a different cookie name (`auth-token`), so mirror it
  let composite = cookie;
  try {
    const tokenValue = cookie.split('=')[1];
    if (tokenValue) composite = `${cookie}; auth-token=${tokenValue}`;
  } catch {}
  // use composite as Cookie header
  const usedCookie = composite;
  const paths = [
    '/api/admin/dashboard/stats',
    '/api/admin/dashboard/charts',
    '/api/admin/dashboard/todays-classes',
    '/api/admin/dashboard/recent-payments',
    '/api/admin/dashboard/alerts',
    '/api/admin/dashboard/recent-students'
  ];
  for (const p of paths) {
    await check(usedCookie, p);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
