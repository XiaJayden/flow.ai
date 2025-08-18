'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Plus, User, Trash2 } from "lucide-react";
import { SchedulePracticeModal } from './schedule-practice-modal';

interface BandEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  eventDate: string;
  location: string | null;
  user: {
    id: string;
    username: string;
    name: string | null;
  };
}

interface PracticeSchedulerModuleProps {
  bandId: string;
  events: BandEvent[];
  currentUserId: string;
}

export function PracticeSchedulerModule({ 
  bandId, 
  events: initialEvents,
  currentUserId 
}: PracticeSchedulerModuleProps) {
  const [events, setEvents] = useState(initialEvents);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const handleEventCreated = (newEvent: BandEvent) => {
    setEvents(prev => [...prev, newEvent].sort((a, b) => 
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    ));
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/bands/${bandId}/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  const upcomingEvents = events.filter(event => isUpcoming(event.eventDate));
  const pastEvents = events.filter(event => !isUpcoming(event.eventDate));

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Practice Schedule</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowScheduleModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Upcoming</h4>
              {upcomingEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <h4 className="text-sm font-medium">
                          {event.title}
                        </h4>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTime(event.eventDate)}</span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm" 
                      onClick={() => handleDeleteEvent(event.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Scheduled by {event.user.name || event.user.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Past Events */}
          {pastEvents.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Recent</h4>
              {pastEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="border rounded-lg p-3 space-y-2 opacity-60">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4" />
                        <h4 className="text-sm font-medium">
                          {event.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(event.eventDate)}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm" 
                      onClick={() => handleDeleteEvent(event.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-3">No practices scheduled</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowScheduleModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule first practice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SchedulePracticeModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        bandId={bandId}
        onEventCreated={handleEventCreated}
      />
    </>
  );
}