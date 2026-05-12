import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    // Mock today's classes - will be updated with actual Batch/Class model
    const todaysClasses = [
      {
        id: '1',
        name: 'Mathematics - Grade 10',
        teacher: 'Mr. Sharma',
        time: '09:00 AM - 10:00 AM',
        room: 'Room 101',
        status: 'upcoming',
      },
      {
        id: '2',
        name: 'English - Grade 9',
        teacher: 'Ms. Patel',
        time: '10:30 AM - 11:30 AM',
        room: 'Room 102',
        status: 'ongoing',
      },
      {
        id: '3',
        name: 'Science - Grade 10',
        teacher: 'Dr. Kumar',
        time: '02:00 PM - 03:00 PM',
        room: 'Lab 1',
        status: 'upcoming',
      },
    ];

    return NextResponse.json(todaysClasses, { status: 200 });
  } catch (error) {
    console.error('Today classes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
