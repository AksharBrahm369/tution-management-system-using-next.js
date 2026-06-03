async function main() {
  // Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'darshanzala369@gmail.com', password: 'Darshan@369', rememberMe: true }),
  });
  const setCookie = loginRes.headers.get('set-cookie') || '';
  const cookiePair = setCookie.split(';')[0];
  const cookieHeader = `${cookiePair}; auth-token=${cookiePair.split('=')[1]}`;
  console.log('Login status', loginRes.status);

  // Create announcement
  const createRes = await fetch('http://localhost:3000/api/admin/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ title: 'Automated Announcement', message: 'Created by test script', link: '/admin/communication', audience: 'ALL' }),
  });
  console.log('Create status', createRes.status);
  console.log('Create body', await createRes.text());

  // List notifications
  // Publish the last announcement (if created)
  const created = await createRes.json().catch(() => null);
  if (created && created.id) {
    const pub = await fetch(`http://localhost:3000/api/admin/announcements/${created.id}/publish`, { method: 'POST', headers: { Cookie: cookieHeader } });
    console.log('Publish status', pub.status);
    console.log('Publish body', await pub.text());
  }

  const listRes = await fetch('http://localhost:3000/api/admin/notifications', { headers: { Cookie: cookieHeader } });
  console.log('List status', listRes.status);
  console.log('List body', await listRes.text());
}

main().catch((e) => { console.error(e); process.exit(1); });

export {};
