'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JoinBandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinBandModal({ open, onOpenChange }: JoinBandModalProps) {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bands/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() })
      });

      if (response.ok) {
        const band = await response.json();
        onOpenChange(false);
        setJoinCode('');
        router.push(`/bands/${band.id}`);
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to join band');
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
          <DialogTitle>Join Band</DialogTitle>
          <DialogDescription>
            Enter the band's join code to become a member
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
              <label htmlFor="joinCode" className="text-sm font-medium">
                Join Code
              </label>
              <Input
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 8-character code"
                maxLength={8}
                style={{ textTransform: 'uppercase' }}
                required
              />
              <p className="text-xs text-muted-foreground">
                Ask your band admin for the join code
              </p>
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
            <Button type="submit" disabled={loading || !joinCode.trim()}>
              {loading ? 'Joining...' : 'Join Band'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}