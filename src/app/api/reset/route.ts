// src/app/api/reset/route.ts
import { NextResponse } from 'next/server';
import { resetData } from '@/lib/data-service';

export async function POST() {
  try {
    const data = await resetData();
    return NextResponse.json({ message: 'Data reset successfully', data });
  } catch (error) {
    console.error("Failed to reset data:", error);
    return NextResponse.json({ message: 'Error resetting data' }, { status: 500 });
  }
}
