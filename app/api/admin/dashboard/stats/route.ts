import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(request: NextRequest) {
  try {
    // Verify JWT
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.sub as string;

    // Verify SUPER_ADMIN role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch statistics
    const [totalUsers, totalTeachers, totalStudents] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
    ]);

    const stats = {
      totalStudents,
      totalTeachers,
      activeBatches: 0, // Placeholder - will be updated with Batch model
      todayAttendance: 0, // Placeholder - will be updated with Attendance model
      feeCollected: 0, // Placeholder - will be updated with Fee model
      pendingFees: 0, // Placeholder - will be updated with Fee model
      monthlyJoinedStudents: 12, // Mock data
      monthlyCollection: 45000, // Mock data in ₹
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
