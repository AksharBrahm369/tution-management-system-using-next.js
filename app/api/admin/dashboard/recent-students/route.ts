import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    // Fetch recent students
    const recentStudents = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const formatted = recentStudents.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      batch: 'Grade 10 - A', // Placeholder - will be updated with actual Batch model
      joinDate: student.createdAt,
      feeStatus: 'Paid', // Placeholder - will be updated with actual Fee model
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Recent students error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
