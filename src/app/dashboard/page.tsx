import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseInstruments } from "@/lib/utils";
import { SongPriorityWidget } from "@/components/dashboard/song-priority-widget";
import { BandActivityWidget } from "@/components/dashboard/band-activity-widget";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { RecordWidget } from "@/components/dashboard/record-widget";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }

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

  const bands = userBands.map(membership => ({
    ...membership.band,
    role: membership.role,
    joinedAt: membership.joinedAt
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Welcome back, {session.user?.name || session.user?.username}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your bands and practice sessions
        </p>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-4">
        {/* Left Column - 60% */}
        <div className="space-y-4">
          <SongPriorityWidget bands={bands} />
          <BandActivityWidget bands={bands} />
        </div>
        
        {/* Right Column - 40% */}
        <div className="space-y-4">
          <CalendarWidget />
          <RecordWidget />
        </div>
      </div>
    </div>
  );
}