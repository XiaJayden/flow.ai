import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseInstruments } from "@/lib/utils";
import { BandsList } from "@/components/bands/bands-list";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {session.user?.name || session.user?.username}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your bands and practice sessions
        </p>
      </div>

      <DashboardStats bands={bands} />
      
      <div className="mt-8">
        <BandsList bands={bands} />
      </div>
    </div>
  );
}