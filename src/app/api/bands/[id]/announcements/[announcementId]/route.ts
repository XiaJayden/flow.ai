import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT /api/bands/[id]/announcements/[announcementId] - Update announcement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
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

    // Update the announcement
    const announcement = await db.announcement.update({
      where: {
        id: resolvedParams.announcementId,
        bandId: resolvedParams.id // Ensure announcement belongs to this band
      },
      data: {
        title: title.trim(),
        content: content.trim(),
        updatedAt: new Date()
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

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
  }
}

// DELETE /api/bands/[id]/announcements/[announcementId] - Delete announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
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

    // Delete the announcement
    await db.announcement.delete({
      where: {
        id: resolvedParams.announcementId,
        bandId: resolvedParams.id // Ensure announcement belongs to this band
      }
    });

    return NextResponse.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}