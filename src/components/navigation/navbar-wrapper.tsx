import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Navbar } from "./navbar";

export async function NavbarWrapper() {
  const session = await getServerSession(authOptions);
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  
  let bands: any[] = [];
  let currentSong: any = null;
  
  if (session) {
    // Get user's bands
    const userBands = await db.bandMember.findMany({
      where: { userId: session.user.id },
      include: {
        band: {
          include: {
            _count: {
              select: {
                members: true,
                songs: true
              }
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    bands = userBands.map(membership => ({
      ...membership.band,
      role: membership.role,
      joinedAt: membership.joinedAt
    }));

    // Check if we're on a song practice page and get song data
    const songMatch = pathname.match(/^\/bands\/([^\/]+)\/songs\/([^\/]+)$/);
    if (songMatch) {
      const [, bandId, songId] = songMatch;
      try {
        const song = await db.song.findUnique({
          where: { id: songId },
          include: {
            band: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (song) {
          currentSong = {
            title: song.title,
            band: {
              name: song.band.name
            }
          };
        }
      } catch (error) {
        // Song not found or access denied
        console.error('Error fetching song for navbar:', error);
      }
    }
  }

  return <Navbar bands={bands} currentSong={currentSong} />;
}