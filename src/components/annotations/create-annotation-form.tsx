'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatTime } from '@/lib/utils';
import { X } from 'lucide-react';

interface CreateAnnotationFormProps {
  songId: string;
  currentTime: number;
  userInstruments: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

const ALL_INSTRUMENTS = [
  'Guitar', 'Bass', 'Drums', 'Vocals', 'Piano', 'Keyboard', 
  'Violin', 'Saxophone', 'Trumpet', 'Other'
];

export function CreateAnnotationForm({
  songId,
  currentTime,
  userInstruments,
  onSuccess,
  onCancel
}: CreateAnnotationFormProps) {
  const [content, setContent] = useState('');
  const [timestamp, setTimestamp] = useState(currentTime);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(userInstruments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Annotation content is required');
      return;
    }

    if (selectedInstruments.length === 0) {
      setError('Please select at least one instrument');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/songs/${songId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          timestamp,
          instruments: selectedInstruments
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create annotation');
      }
    } catch (error) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments(prev => 
      prev.includes(instrument)
        ? prev.filter(i => i !== instrument)
        : [...prev, instrument]
    );
  };

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimestamp = (timeStr: string) => {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  };

  return (
    <Card className="border-primary">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">New Annotation</h4>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
              {error}
            </div>
          )}

          {/* Timestamp */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Timestamp</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={formatTimestamp(timestamp)}
                onChange={(e) => setTimestamp(parseTimestamp(e.target.value))}
                placeholder="0:00"
                className="w-20"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTimestamp(currentTime)}
              >
                Use Current ({formatTime(currentTime)})
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add your annotation..."
              className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Instruments */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Instruments</label>
            <div className="flex flex-wrap gap-2">
              {ALL_INSTRUMENTS.map(instrument => (
                <Badge
                  key={instrument}
                  variant={selectedInstruments.includes(instrument) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => toggleInstrument(instrument)}
                >
                  {instrument}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Creating...' : 'Create Annotation'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}