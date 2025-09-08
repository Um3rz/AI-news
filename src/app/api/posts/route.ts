import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import type { Session } from 'next-auth';

function getUserId(session: Session | null): string | null {
  const maybeUser = session?.user as Record<string, unknown> | undefined;
  const maybeId = maybeUser?.id;
  return typeof maybeId === 'string' ? maybeId : null;
}

export async function GET() {
  try {
    const session = await getServerSession();
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ data: [], success: true });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { interestedCategories: { select: { id: true } } },
    });

    const categoryIds = user?.interestedCategories.map((c) => c.id) || [];
    if (categoryIds.length === 0) {
      return NextResponse.json({ data: [], success: true });
    }

    const posts = await prisma.post.findMany({
      where: {
        categoryId: { in: categoryIds },
      },
      include: {
        category: true,
        sources: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      data: posts,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch posts',
        data: [],
        success: false,
      },
      { status: 500 }
    );
  }
}