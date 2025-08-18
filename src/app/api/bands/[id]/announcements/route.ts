import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/bands/[id]/announcements - Get all announcements for a band
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a member of this band
    const membership = await db.bandMember.findUnique({
      where: {
        userId_bandId: {
          userId: session.user.id,
          bandId: resolvedParams.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this band" }, { status: 403 });
    }

    // Get all announcements for the band
    const announcements = await db.announcement.findMany({
      where: {
        bandId: resolvedParams.id
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

// POST /api/bands/[id]/announcements - Create a new announcement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a member of this band
    const membership = await db.bandMember.findUnique({
      where: {
        userId_bandId: {
          userId: session.user.id,
          bandId: resolvedParams.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this band" }, { status: 403 });
    }

    const { title, content } = await request.json();

    if (!title || !content || typeof title !== 'string' || typeof content !== 'string') {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    if (title.trim().length === 0 || content.trim().length === 0) {
      return NextResponse.json({ error: "Title and content cannot be empty" }, { status: 400 });
    }

    // Create the announcement
    const announcement = await db.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        bandId: resolvedParams.id,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}