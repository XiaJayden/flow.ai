'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateBandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBandModal({ open, onOpenChange }: CreateBandModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });

      if (response.ok) {
        const band = await response.json();
        onOpenChange(false);
        setName('');
        router.push(`/bands/${band.id}`);
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create band');
      }
    } catch (error) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Band</DialogTitle>
          <DialogDescription>
            Start a new band and invite members to practice together
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid gap-2">
              <label htmlFor="bandName" className="text-sm font-medium">
                Band Name
              </label>
              <Input
                id="bandName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter band name"
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create Band'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}