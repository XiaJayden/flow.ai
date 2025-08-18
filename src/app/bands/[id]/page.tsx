import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseInstruments } from "@/lib/utils";
import { BandHeader } from "@/components/bands/band-header";
import { SongModule } from "@/components/songs/song-module";
import { BandMembers } from "@/components/bands/band-members";

interface BandPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BandPage({ params }: BandPageProps) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }

  // Check if user is a member of this band
  const membership = await db.bandMember.findUnique({
    where: {
      userId_bandId: {
        userId: session.user.id,
        bandId: resolvedParams.id
      }
    },
    include: {
      band: {
        include: {
          members: {
            include: {
              user: true
            },
            orderBy: [
              { role: 'desc' }, // admins first
              { joinedAt: 'asc' }
            ]
          },
          songs: {
            include: {
              _count: {
                select: {
                  annotations: true
                }
              }
            },
            orderBy: {
              addedAt: 'desc'
            }
          },
          setlists: {
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
          },
          _count: {
            select: {
              members: true,
              songs: true
            }
          }
        }
      }
    }
  });

  if (!membership) {
    notFound();
  }

  const band = membership.band;
  const userRole = membership.role;

  // Transform members to include parsed instruments
  const membersWithInstruments = band.members.map(member => ({
    ...member,
    user: {
      ...member.user,
      instruments: parseInstruments(member.user.instruments)
    }
  }));

  const bandWithInstruments = {
    ...band,
    members: membersWithInstruments
  };

  // Get all unique instruments from band members
  const allBandInstruments = Array.from(
    new Set(
      membersWithInstruments.flatMap(member => member.user.instruments)
    )
  ).sort();

  return (
    <div className="container mx-auto px-4 py-8">
      <BandHeader band={bandWithInstruments} userRole={userRole} />
      
      <div className="flex gap-4 mt-4">
        <div className="w-[65%]">
          <SongModule 
            bandId={band.id} 
            songs={band.songs} 
            setlists={band.setlists.map(setlist => ({
              id: setlist.id,
              name: setlist.name,
              songCount: setlist._count.setlistSongs
            }))}
            canAddSongs={userRole === 'admin' || userRole === 'member'}
            availableInstruments={allBandInstruments}
          />
        </div>
        
        <div className="w-[35%]">
          <BandMembers 
            members={membersWithInstruments} 
            userRole={userRole}
            bandId={band.id}
          />
        </div>
      </div>
    </div>
  );
}