import { getAuthenticatedUser, getUserBands } from "@/lib/auth-utils";
import { SongPriorityWidget } from "@/components/dashboard/song-priority-widget";
import { BandActivityWidget } from "@/components/dashboard/band-activity-widget";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { RecordWidget } from "@/components/dashboard/record-widget";
import { DashboardBandsWrapper } from "@/components/dashboard/dashboard-bands-wrapper";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  // Use robust authentication check
  const user = await getAuthenticatedUser(true);
  
  if (!user) {
    return <div>Authentication failed</div>;
  }
  
  console.log('Dashboard: User authenticated:', { id: user.id, username: user.username });
  
  // Get user's bands with proper error handling
  const bands = await getUserBands(user.id);
  
  console.log('Dashboard: Bands fetched:', bands.length, 'bands');

  // If no bands found, log additional debugging info
  if (bands.length === 0) {
    console.log('Dashboard: No bands found for user. Checking database...');
    // Additional debugging - check if user has any band memberships
    try {
      const directCheck = await db.bandMember.findMany({
        where: { userId: user.id },
        include: { band: true }
      });
      console.log('Direct database check found:', directCheck.length, 'memberships');
    } catch (error) {
      console.error('Error in direct database check:', error);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Welcome back, {user.name || user.username}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your bands and practice sessions
        </p>
      </div>

      {/* Bands List */}
      <DashboardBandsWrapper initialBands={bands} />

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