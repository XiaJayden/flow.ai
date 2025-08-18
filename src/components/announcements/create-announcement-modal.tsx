'use client'

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface CreateAnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  onAnnouncementCreated?: (announcement: any) => void;
}

export function CreateAnnouncementModal({ 
  open, 
  onOpenChange, 
  bandId,
  onAnnouncementCreated 
}: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/bands/${bandId}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: title.trim(), 
          content: content.trim() 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create announcement');
      }

      const newAnnouncement = await response.json();
      
      // Reset form
      setTitle('');
      setContent('');
      setError('');
      onOpenChange(false);
      
      // Notify parent component
      if (onAnnouncementCreated) {
        onAnnouncementCreated(newAnnouncement);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setTitle('');
        setContent('');
        setError('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
          <DialogDescription>
            Share news, updates, or reminders with your band members.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Rehearsal this Wednesday"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className={error ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              placeholder="Add details about your announcement..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              rows={3}
              className={error ? 'border-red-500' : ''}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title.trim() || !content.trim()}
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Announcement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}