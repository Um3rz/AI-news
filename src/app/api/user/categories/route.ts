import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import type { Session } from 'next-auth';

function getUserId(session: Session | null): string | null {
  const maybeUser = session?.user as Record<string, unknown> | undefined;
  const maybeId = maybeUser?.id;
  return typeof maybeId === 'string' ? maybeId : null;
}

export async function GET() {
  const session = await getServerSession();
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { interestedCategories: { select: { id: true } } },
  });

  const categoryIds = user?.interestedCategories.map((c) => c.id) || [];
  return NextResponse.json({ categoryIds });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { categoryIds } = await req.json();
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    return NextResponse.json({ error: 'categoryIds array required' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      interestedCategories: {
        set: [],
        connect: categoryIds.map((id: string) => ({ id })),
      },
    },
  });

  return NextResponse.json({ success: true });
}
