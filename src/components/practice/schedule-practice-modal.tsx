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

interface SchedulePracticeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  onEventCreated?: (event: any) => void;
}

export function SchedulePracticeModal({ 
  open, 
  onOpenChange, 
  bandId,
  onEventCreated 
}: SchedulePracticeModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !eventDate || !eventTime) {
      setError('Title, date, and time are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Combine date and time into ISO string
      const combinedDateTime = new Date(`${eventDate}T${eventTime}`);
      
      if (isNaN(combinedDateTime.getTime())) {
        setError('Invalid date or time');
        return;
      }

      const response = await fetch(`/api/bands/${bandId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: title.trim(),
          description: description.trim() || null,
          eventType: 'practice',
          eventDate: combinedDateTime.toISOString(),
          location: location.trim() || null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to schedule practice');
      }

      const newEvent = await response.json();
      
      // Reset form
      setTitle('');
      setDescription('');
      setEventDate('');
      setEventTime('');
      setLocation('');
      setError('');
      onOpenChange(false);
      
      // Notify parent component
      if (onEventCreated) {
        onEventCreated(newEvent);
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
        setDescription('');
        setEventDate('');
        setEventTime('');
        setLocation('');
        setError('');
      }
    }
  };

  // Set default values when modal opens
  const handleOpen = (newOpen: boolean) => {
    if (newOpen && !title) {
      setTitle('Band Practice');
      // Set default date to next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setEventDate(nextWeek.toISOString().split('T')[0]);
      setEventTime('19:00'); // 7 PM default
    }
    handleOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Practice</DialogTitle>
          <DialogDescription>
            Set up your next band practice session.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Practice Name</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Band Practice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className={error ? 'border-red-500' : ''}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Date</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                disabled={isLoading}
                className={error ? 'border-red-500' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventTime">Time</Label>
              <Input
                id="eventTime"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                disabled={isLoading}
                className={error ? 'border-red-500' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              type="text"
              placeholder="e.g., Studio A, Mike's garage"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any notes about the practice session..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={2}
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
              disabled={isLoading || !title.trim() || !eventDate || !eventTime}
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Schedule Practice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}