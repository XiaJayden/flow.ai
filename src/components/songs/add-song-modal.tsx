'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ExternalLink, Music } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { generateInstrumentParts } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { InstrumentSelector } from "@/components/ui/instrument-selector";

interface AddSongModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  availableInstruments?: string[];
}

interface YouTubeResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: number;
  publishedAt: string;
}

export function AddSongModal({ open, onOpenChange, bandId, availableInstruments = [] }: AddSongModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [instrumentParts, setInstrumentParts] = useState<Record<string, number>>({});
  const router = useRouter();

  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments(prev => 
      prev.includes(instrument) 
        ? prev.filter(i => i !== instrument)
        : [...prev, instrument]
    );
  };

  const updateInstrumentParts = (instrument: string, count: number) => {
    setInstrumentParts(prev => ({
      ...prev,
      [instrument]: count
    }));
  };

  const addCustomInstrument = (instrument: string) => {
    if (!selectedInstruments.includes(instrument)) {
      setSelectedInstruments(prev => [...prev, instrument]);
    }
  };

  const getFinalInstruments = (): string[] => {
    const finalInstruments: string[] = [];
    selectedInstruments.forEach(instrument => {
      const parts = instrumentParts[instrument] || 1;
      finalInstruments.push(...generateInstrumentParts(instrument, parts));
    });
    return finalInstruments;
  };

  const searchYouTube = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        setError('Failed to search YouTube');
      }
    } catch (error) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const addSongFromUrl = async () => {
    if (!youtubeUrl.trim()) return;
    
    setAdding('url');
    setError('');
    
    try {
      const response = await fetch(`/api/bands/${bandId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          youtubeUrl: youtubeUrl.trim(),
          instruments: getFinalInstruments()
        })
      });

      if (response.ok) {
        const song = await response.json();
        onOpenChange(false);
        resetForm();
        router.push(`/bands/${bandId}/songs/${song.id}`);
        router.refresh();
      } else {
        const data = await response.json();
        console.error('Song creation error:', data);
        setError(data.error || data.details || 'Failed to add song');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error: ' + (error instanceof Error ? error.message : 'Something went wrong'));
    } finally {
      setAdding(null);
    }
  };

  const addSongFromSearch = async (video: YouTubeResult) => {
    setAdding(video.id);
    setError('');
    
    try {
      const response = await fetch(`/api/bands/${bandId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          youtubeId: video.id,
          instruments: getFinalInstruments()
        })
      });

      if (response.ok) {
        const song = await response.json();
        onOpenChange(false);
        resetForm();
        router.push(`/bands/${bandId}/songs/${song.id}`);
        router.refresh();
      } else {
        const data = await response.json();
        console.error('Song creation error:', data);
        setError(data.error || data.details || 'Failed to add song');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error: ' + (error instanceof Error ? error.message : 'Something went wrong'));
    } finally {
      setAdding(null);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setYoutubeUrl('');
    setResults([]);
    setError('');
    setSelectedInstruments([]);
    setInstrumentParts({});
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Song to Band</DialogTitle>
          <DialogDescription>
            Search YouTube or paste a YouTube URL to add a song
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
          
          {/* Instrument Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <label className="text-sm font-medium">Instruments Used in This Song</label>
            </div>
            <p className="text-xs text-muted-foreground">
              Select which instruments will be played in this song to make annotation creation faster.
            </p>
            <InstrumentSelector
              selectedInstruments={selectedInstruments}
              instrumentParts={instrumentParts}
              onInstrumentToggle={toggleInstrument}
              onInstrumentPartsChange={updateInstrumentParts}
              onCustomInstrumentAdd={addCustomInstrument}
              availableInstruments={availableInstruments}
              showPreview={true}
            />
          </div>
          
          <Separator />
          
          {/* YouTube URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">YouTube URL</label>
            <div className="flex gap-2">
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <Button 
                onClick={addSongFromUrl}
                disabled={!youtubeUrl.trim() || adding === 'url'}
              >
                {adding === 'url' ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or search YouTube</span>
            </div>
          </div>

          {/* YouTube Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search YouTube</label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for songs..."
                onKeyDown={(e) => e.key === 'Enter' && searchYouTube()}
              />
              <Button 
                onClick={searchYouTube}
                disabled={!searchQuery.trim() || loading}
              >
                <Search className="h-4 w-4" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Results</label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((video) => (
                  <div key={video.id} className="border rounded-lg p-3 hover:bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{video.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {video.channelTitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {formatTime(video.duration)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(video.publishedAt).getFullYear()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addSongFromSearch(video)}
                          disabled={adding === video.id}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {adding === video.id ? 'Adding...' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}