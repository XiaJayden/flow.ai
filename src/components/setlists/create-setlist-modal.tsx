'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2 } from "lucide-react";

interface CreateSetlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  onSetlistCreated?: (setlist: any) => void;
}

export function CreateSetlistModal({ 
  open, 
  onOpenChange, 
  bandId,
  onSetlistCreated 
}: CreateSetlistModalProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Setlist name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/bands/${bandId}/setlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create setlist');
      }

      const newSetlist = await response.json();
      
      // Reset form
      setName('');
      setError('');
      onOpenChange(false);
      
      // Notify parent component
      if (onSetlistCreated) {
        onSetlistCreated({
          id: newSetlist.id,
          name: newSetlist.name,
          songCount: newSetlist._count.setlistSongs
        });
      }
      
      // Refresh the page to update the setlists
      router.refresh();
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
        setName('');
        setError('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Setlist</DialogTitle>
          <DialogDescription>
            Create a new setlist to organize your band's songs for performances or practice sessions.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Setlist Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Spring Concert 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          
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
              disabled={isLoading || !name.trim()}
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Setlist
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}