import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    // Search for students, teachers, and batches
    const [students, teachers] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: 'STUDENT',
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, email: true },
        take: 5,
      }),
      prisma.user.findMany({
        where: {
          role: 'TEACHER',
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, email: true },
        take: 5,
      }),
    ]);

    const results = [
      ...students.map((s) => ({
        id: s.id,
        name: s.name,
        type: 'student',
        link: `/admin/students/${s.id}`,
      })),
      ...teachers.map((t) => ({
        id: t.id,
        name: t.name,
        type: 'teacher',
        link: `/admin/teachers/${t.id}`,
      })),
    ];

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
