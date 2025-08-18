import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/bands/[id]/events - Get all events for a band
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

    // Get all events for the band
    const events = await db.bandEvent.findMany({
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
        eventDate: 'asc'
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/bands/[id]/events - Create a new event
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

    // Create the event
    const event = await db.bandEvent.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        eventType: eventType.trim(),
        eventDate: parsedDate,
        location: location?.trim() || null,
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

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}