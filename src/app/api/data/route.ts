// src/app/api/data/route.ts
import { NextResponse } from 'next/server';
import { getAllData, saveData } from '@/lib/data-service';

export async function GET() {
  try {
    const data = await getAllData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to get data:", error);
    return NextResponse.json({ message: 'Error retrieving data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await saveData(data);
    return NextResponse.json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error("Failed to save data:", error);
    return NextResponse.json({ message: 'Error saving data' }, { status: 500 });
  }
}
