import { NextResponse } from 'next/server';
import { getBolnaExecutionStatus } from '@/lib/server/bolna';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Execution ID query parameter (id) is required.' },
        { status: 400 }
      );
    }

    const result = await getBolnaExecutionStatus(id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Server error querying execution: ${err.message}` },
      { status: 500 }
    );
  }
}
