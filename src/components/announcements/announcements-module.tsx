'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Edit2, Trash2, User } from "lucide-react";
import { CreateAnnouncementModal } from './create-announcement-modal';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    name: string | null;
  };
}

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

interface AnnouncementsModuleProps {
  bandId: string;
  announcements: Announcement[];
  nextPractice: BandEvent | null;
  currentUserId: string;
}

export function AnnouncementsModule({ 
  bandId, 
  announcements: initialAnnouncements, 
  nextPractice,
  currentUserId 
}: AnnouncementsModuleProps) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  const handleAnnouncementCreated = (newAnnouncement: Announcement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const response = await fetch(`/api/bands/${bandId}/announcements/${announcementId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Announcements</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {/* Next Practice (Pinned) */}
          {nextPractice && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Next Practice</span>
                <Badge variant="outline" className="text-xs bg-blue-100">
                  Pinned
                </Badge>
              </div>
              <p className="text-sm font-medium text-blue-900">
                {formatDateTime(nextPractice.eventDate)}
              </p>
              {nextPractice.location && (
                <p className="text-xs text-blue-700 mt-1">
                  📍 {nextPractice.location}
                </p>
              )}
            </div>
          )}

          {/* Practice Scheduler Button */}
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => {/* TODO: Navigate to scheduler */}}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Practice Scheduler
          </Button>

          {/* Announcements List */}
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No announcements yet</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add first announcement
                </Button>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {announcement.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {announcement.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm" 
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{announcement.user.name || announcement.user.username}</span>
                    </div>
                    <span>{formatDate(announcement.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CreateAnnouncementModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        bandId={bandId}
        onAnnouncementCreated={handleAnnouncementCreated}
      />
    </>
  );
}