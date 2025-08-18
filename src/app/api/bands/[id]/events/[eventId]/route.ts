import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT /api/bands/[id]/events/[eventId] - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
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

    const { title, description, eventType, eventDate, location } = await request.json();

    if (!title || !eventType || !eventDate) {
      return NextResponse.json({ error: "Title, eventType, and eventDate are required" }, { status: 400 });
    }

    if (typeof title !== 'string' || typeof eventType !== 'string') {
      return NextResponse.json({ error: "Title and eventType must be strings" }, { status: 400 });
    }

    if (title.trim().length === 0 || eventType.trim().length === 0) {
      return NextResponse.json({ error: "Title and eventType cannot be empty" }, { status: 400 });
    }

    // Validate event date
    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid event date" }, { status: 400 });
    }

    // Update the event
    const event = await db.bandEvent.update({
      where: {
        id: resolvedParams.eventId,
        bandId: resolvedParams.id // Ensure event belongs to this band
      },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        eventType: eventType.trim(),
        eventDate: parsedDate,
        location: location?.trim() || null,
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

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE /api/bands/[id]/events/[eventId] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
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

    // Delete the event
    await db.bandEvent.delete({
      where: {
        id: resolvedParams.eventId,
        bandId: resolvedParams.id // Ensure event belongs to this band
      }
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}