import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT /api/bands/[id]/setlists/[setlistId] - Update setlist name
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; setlistId: string }> }
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

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: "Setlist name is required" }, { status: 400 });
    }

    // Update the setlist
    const setlist = await db.setlist.update({
      where: {
        id: resolvedParams.setlistId,
        bandId: resolvedParams.id // Ensure setlist belongs to this band
      },
      data: {
        name: name.trim()
      },
      include: {
        _count: {
          select: {
            setlistSongs: true
          }
        }
      }
    });

    return NextResponse.json(setlist);
  } catch (error) {
    console.error("Error updating setlist:", error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: "A setlist with this name already exists" }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Failed to update setlist" }, { status: 500 });
  }
}

// DELETE /api/bands/[id]/setlists/[setlistId] - Delete setlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; setlistId: string }> }
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

    // Delete the setlist (cascade will handle setlistSongs)
    await db.setlist.delete({
      where: {
        id: resolvedParams.setlistId,
        bandId: resolvedParams.id // Ensure setlist belongs to this band
      }
    });

    return NextResponse.json({ message: "Setlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting setlist:", error);
    return NextResponse.json({ error: "Failed to delete setlist" }, { status: 500 });
  }
}