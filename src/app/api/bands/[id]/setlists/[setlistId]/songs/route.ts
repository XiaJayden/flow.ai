import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/bands/[id]/setlists/[setlistId]/songs - Get all songs in a setlist
export async function GET(
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

    // Get all songs in the setlist
    const setlistSongs = await db.setlistSong.findMany({
      where: {
        setlistId: resolvedParams.setlistId
      },
      include: {
        song: {
          include: {
            _count: {
              select: {
                annotations: true
              }
            }
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    // Transform to return just the songs with their order
    const songs = setlistSongs.map(setlistSong => ({
      ...setlistSong.song,
      setlistOrder: setlistSong.order
    }));

    return NextResponse.json(songs);
  } catch (error) {
    console.error("Error fetching setlist songs:", error);
    return NextResponse.json({ error: "Failed to fetch setlist songs" }, { status: 500 });
  }
}

// POST /api/bands/[id]/setlists/[setlistId]/songs - Add song to setlist
export async function POST(
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

    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json({ error: "Song ID is required" }, { status: 400 });
    }

    // Verify song belongs to this band
    const song = await db.song.findUnique({
      where: {
        id: songId,
        bandId: resolvedParams.id
      }
    });

    if (!song) {
      return NextResponse.json({ error: "Song not found in this band" }, { status: 404 });
    }

    // Get the current highest order in the setlist
    const highestOrder = await db.setlistSong.findFirst({
      where: {
        setlistId: resolvedParams.setlistId
      },
      orderBy: {
        order: 'desc'
      }
    });

    const nextOrder = (highestOrder?.order || 0) + 1;

    // Add song to setlist
    const setlistSong = await db.setlistSong.create({
      data: {
        setlistId: resolvedParams.setlistId,
        songId: songId,
        order: nextOrder
      },
      include: {
        song: {
          include: {
            _count: {
              select: {
                annotations: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      ...setlistSong.song,
      setlistOrder: setlistSong.order
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding song to setlist:", error);
    
    // Handle unique constraint violation (song already in setlist)
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: "Song is already in this setlist" }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Failed to add song to setlist" }, { status: 500 });
  }
}

// DELETE /api/bands/[id]/setlists/[setlistId]/songs - Remove song from setlist
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

    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json({ error: "Song ID is required" }, { status: 400 });
    }

    // Remove song from setlist
    await db.setlistSong.delete({
      where: {
        setlistId_songId: {
          setlistId: resolvedParams.setlistId,
          songId: songId
        }
      }
    });

    return NextResponse.json({ message: "Song removed from setlist successfully" });
  } catch (error) {
    console.error("Error removing song from setlist:", error);
    return NextResponse.json({ error: "Failed to remove song from setlist" }, { status: 500 });
  }
}