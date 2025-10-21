import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseInstruments } from "@/lib/utils";
import { BandHeader } from "@/components/bands/band-header";
import { SongModule } from "@/components/songs/song-module";
import { AnnouncementsModule } from "@/components/announcements/announcements-module";
import { PracticeSchedulerModule } from "@/components/practice/practice-scheduler-module";
import { BandAvatarsModule } from "@/components/avatars/band-avatars-module";
import { TempImageBar } from "@/components/bands/temp-image-bar";

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
          announcements: {
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
          },
          events: {
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

  // Transform announcements to convert dates to strings
  const transformedAnnouncements = band.announcements.map(announcement => ({
    ...announcement,
    createdAt: announcement.createdAt.toISOString(),
    updatedAt: announcement.updatedAt.toISOString()
  }));

  // Get all unique instruments from band members
  const allBandInstruments = Array.from(
    new Set(
      membersWithInstruments.flatMap(member => member.user.instruments)
    )
  ).sort();

  // Get next practice (upcoming practice event)
  const nextPracticeRaw = band.events
    .filter(event => event.eventType === 'practice' && new Date(event.eventDate) > new Date())
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())[0] || null;

  // Transform next practice to convert dates to strings
  const nextPractice = nextPracticeRaw ? {
    ...nextPracticeRaw,
    eventDate: nextPracticeRaw.eventDate.toISOString(),
    createdAt: nextPracticeRaw.createdAt.toISOString(),
    updatedAt: nextPracticeRaw.updatedAt.toISOString()
  } : null;

  // Transform all events to convert dates to strings
  const transformedEvents = band.events.map(event => ({
    ...event,
    eventDate: event.eventDate.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString()
  }));

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
        
        <div className="w-[35%] flex flex-col gap-4">
          {/* Announcements Module - 40% */}
          <div className="h-[40vh]">
            <AnnouncementsModule 
              bandId={band.id}
              announcements={transformedAnnouncements}
              nextPractice={nextPractice}
              currentUserId={session.user.id}
            />
          </div>
          
          {/* Practice Scheduler Module - 40% */}
          <div className="h-[40vh]">
            <PracticeSchedulerModule 
              bandId={band.id}
              events={transformedEvents}
              currentUserId={session.user.id}
            />
          </div>
          
          {/* Temp Image Bar - 20% */}
          <div className="h-[20vh]">
            <TempImageBar />
          </div>
        </div>
      </div>
    </div>
  );
}