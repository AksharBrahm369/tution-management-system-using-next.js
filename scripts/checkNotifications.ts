async function main() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'darshanzala369@gmail.com', password: 'Darshan@369', rememberMe: true }),
  });

  console.log('Login status:', loginRes.status);
  const setCookie = loginRes.headers.get('set-cookie') || '';
  const cookiePair = setCookie.split(';')[0];
  if (!cookiePair) {
    console.error('No cookie received');
    return;
  }

  // Mirror cookie to auth-token if needed
  const cookieHeader = `${cookiePair}; auth-token=${cookiePair.split('=')[1]}`;

  // 1. List notifications
  const listRes = await fetch('http://localhost:3000/api/admin/notifications', {
    headers: { Cookie: cookieHeader },
  });
  console.log('List notifications status:', listRes.status);
  const listBodyText = await listRes.text();
  console.log('List body:', listBodyText);

  // Diagnostic: call /api/auth/me and dashboard stats to verify token
  const meRes = await fetch('http://localhost:3000/api/auth/me', { headers: { Cookie: cookieHeader } });
  console.log('/api/auth/me status:', meRes.status);
  console.log('/api/auth/me body:', await meRes.text());

  const statsRes = await fetch('http://localhost:3000/api/admin/dashboard/stats', { headers: { Cookie: cookieHeader } });
  console.log('/api/admin/dashboard/stats status:', statsRes.status);
  console.log('/api/admin/dashboard/stats body:', await statsRes.text());

  // If there is at least one notification, try mark-read
  if (listRes.ok) {
    let list: any = [];
    try { list = JSON.parse(listBodyText); } catch (e) { list = []; }
    if (Array.isArray(list) && list.length > 0) {
      const id = list[0].id;
      const markRes = await fetch('http://localhost:3000/api/admin/notifications/mark-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ notificationId: id }),
      });
      console.log('Mark-read status:', markRes.status);
      console.log('Mark-read body:', await markRes.text());

      const markAllRes = await fetch('http://localhost:3000/api/admin/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { Cookie: cookieHeader },
      });
      console.log('Mark-all-read status:', markAllRes.status);
      console.log('Mark-all-read body:', await markAllRes.text());
    } else {
      console.log('No notifications to mark.');
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

