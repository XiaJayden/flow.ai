'use client'

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, List, Clock, MapPin, Users } from 'lucide-react';

// Dummy events data - would come from API in real implementation
const dummyEvents = [
  {
    id: '1',
    title: 'Band Practice',
    band: 'Jamberry',
    date: new Date(2024, 11, 20, 19, 0), // Dec 20, 2024, 7:00 PM
    location: 'Mike\'s Garage',
    attendees: 4,
    type: 'practice' as const
  },
  {
    id: '2',
    title: 'Recording Session',
    band: 'Paramore',
    date: new Date(2024, 11, 22, 14, 0), // Dec 22, 2024, 2:00 PM
    location: 'Sound Studio',
    attendees: 5,
    type: 'recording' as const
  },
  {
    id: '3',
    title: 'Gig - Local Venue',
    band: 'Jamberry',
    date: new Date(2024, 11, 28, 20, 0), // Dec 28, 2024, 8:00 PM
    location: 'The Rock House',
    attendees: 4,
    type: 'gig' as const
  },
  {
    id: '4',
    title: 'Songwriting Session',
    band: 'Paramore',
    date: new Date(2025, 0, 3, 16, 0), // Jan 3, 2025, 4:00 PM
    location: 'Emma\'s Studio',
    attendees: 3,
    type: 'writing' as const
  },
  {
    id: '5',
    title: 'Band Practice',
    band: 'Jamberry',
    date: new Date(2025, 0, 8, 19, 0), // Jan 8, 2025, 7:00 PM
    location: 'Community Center',
    attendees: 4,
    type: 'practice' as const
  }
];

const eventTypeColors = {
  practice: 'bg-blue-500',
  recording: 'bg-purple-500',
  gig: 'bg-red-500',
  writing: 'bg-green-500'
};

const eventTypeLabels = {
  practice: 'Practice',
  recording: 'Recording',
  gig: 'Gig',
  writing: 'Writing'
};

export function CalendarWidget() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isUpcoming = (date: Date) => {
    return date > new Date();
  };

  const upcomingEvents = dummyEvents
    .filter(event => isUpcoming(event.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">Upcoming Events</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{upcomingEvents.length} events</Badge>
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-l-none"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="flex space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${eventTypeColors[event.type]}`} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium truncate">{event.title}</h4>
                  <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                    {eventTypeLabels[event.type]}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(event.date)} at {formatTime(event.date)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{event.attendees} members</span>
                    </div>
                  </div>
                  
                  <Badge variant="secondary" className="text-xs">
                    {event.band}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Calendar view placeholder
        <div className="space-y-4">
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Calendar view coming soon</p>
            <p className="text-xs mt-1">Switch to list view to see your events</p>
          </div>
        </div>
      )}

      {upcomingEvents.length === 0 && viewMode === 'list' && (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No upcoming events scheduled</p>
        </div>
      )}
    </Card>
  );
}