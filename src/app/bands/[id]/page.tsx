import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseInstruments } from "@/lib/utils";
import { BandHeader } from "@/components/bands/band-header";
import { SongsList } from "@/components/songs/songs-list";
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

  return (
    <div className="container mx-auto px-4 py-8">
      <BandHeader band={bandWithInstruments} userRole={userRole} />
      
      <div className="grid gap-8 md:grid-cols-3 mt-8">
        <div className="md:col-span-2">
          <SongsList 
            bandId={band.id} 
            songs={band.songs} 
            canAddSongs={userRole === 'admin' || userRole === 'member'} 
          />
        </div>
        
        <div>
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