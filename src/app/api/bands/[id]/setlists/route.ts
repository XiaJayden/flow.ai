import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/bands/[id]/setlists - Get all setlists for a band
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

    // Get all setlists for the band with song counts
    const setlists = await db.setlist.findMany({
      where: {
        bandId: resolvedParams.id
      },
      include: {
        _count: {
          select: {
            setlistSongs: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(setlists);
  } catch (error) {
    console.error("Error fetching setlists:", error);
    return NextResponse.json({ error: "Failed to fetch setlists" }, { status: 500 });
  }
}

// POST /api/bands/[id]/setlists - Create a new setlist
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

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: "Setlist name is required" }, { status: 400 });
    }

    // Create the setlist
    const setlist = await db.setlist.create({
      data: {
        name: name.trim(),
        bandId: resolvedParams.id
      },
      include: {
        _count: {
          select: {
            setlistSongs: true
          }
        }
      }
    });

    return NextResponse.json(setlist, { status: 201 });
  } catch (error) {
    console.error("Error creating setlist:", error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: "A setlist with this name already exists" }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Failed to create setlist" }, { status: 500 });
  }
}