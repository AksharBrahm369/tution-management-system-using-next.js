import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const nets = os.networkInterfaces();
    const candidates: string[] = [];

    const isPreferredLanIp = (ip: string) =>
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);

    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        const family = net.family;
        const isIpv4 = family === 'IPv4' || (family as any) === 4;
        if (isIpv4 && !net.internal) {
          candidates.push(net.address);
        }
      }
    }

    const localIp = candidates.find(isPreferredLanIp) ?? candidates[0] ?? 'localhost';

    return NextResponse.json({ ip: localIp });
  } catch {
    return NextResponse.json({ ip: 'localhost' });
  }
}
