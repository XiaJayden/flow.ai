import { getAuthenticatedUser, getUserBands } from "@/lib/auth-utils";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { Navbar } from "./navbar";

export async function NavbarWrapper() {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  let bands: any[] = [];
  let currentSong: any = null;
  
  // Use robust authentication check (non-blocking)
  const user = await getAuthenticatedUser(false);
  
  if (user) {
    // Get user's bands with proper error handling
    bands = await getUserBands(user.id);

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