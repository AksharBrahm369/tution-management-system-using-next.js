async function main() {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'darshanzala369@gmail.com', password: 'Darshan@369', rememberMe: true }),
  });

  console.log('Status:', res.status);
  console.log('Headers:');
  for (const [k, v] of res.headers.entries()) console.log(k, v);
  const body = await res.text();
  console.log('Body:', body);
  // Extract cookie and use it to fetch a protected admin exam page
  const setCookie = res.headers.get('set-cookie') || '';
  const cookiePair = setCookie.split(';')[0];
  if (!cookiePair) return;
  const examId = 'cmpkx6aro005kl0ubb8y1kco4';
  const examRes = await fetch(`http://localhost:3000/api/admin/exams/${examId}`, { headers: { Cookie: cookiePair } });
  console.log('Exam API status:', examRes.status);
  console.log('Exam body:', await examRes.text());
}

main().catch((e) => { console.error(e); process.exit(1); });

export {};
