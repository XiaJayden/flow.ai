'use client'

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { BandsList } from '@/components/bands/bands-list';

interface DashboardBandsWrapperProps {
  initialBands: any[];
}

export function DashboardBandsWrapper({ initialBands }: DashboardBandsWrapperProps) {
  const { data: session, status } = useSession();
  const [bands, setBands] = useState(initialBands);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Refresh bands when session is established
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('Client: Session established, refreshing bands...');
      // Force a re-render by updating the bands state
      setBands([...initialBands]);
    }
  }, [status, session, initialBands]);

  // Show loading state during hydration
  if (!isHydrated || status === 'loading') {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading bands...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <BandsList bands={bands} />
    </div>
  );
}
