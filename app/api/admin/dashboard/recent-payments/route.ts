import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    // Mock recent payments - will be updated with actual Payment model
    const recentPayments = [
      {
        id: '1',
        studentName: 'Aarav Singh',
        amount: 5000,
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
        method: 'Online',
        avatar: 'AS',
      },
      {
        id: '2',
        studentName: 'Priya Sharma',
        amount: 15000,
        date: new Date(Date.now() - 5 * 60 * 60 * 1000),
        method: 'Cash',
        avatar: 'PS',
      },
      {
        id: '3',
        studentName: 'Rohan Patel',
        amount: 10000,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        method: 'Cheque',
        avatar: 'RP',
      },
      {
        id: '4',
        studentName: 'Neha Gupta',
        amount: 7500,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        method: 'Online',
        avatar: 'NG',
      },
    ];

    return NextResponse.json(recentPayments, { status: 200 });
  } catch (error) {
    console.error('Recent payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
