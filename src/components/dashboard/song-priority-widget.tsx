'use client'

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Clock, Star } from 'lucide-react';

interface Band {
  id: string;
  name: string;
  role: string;
  joinedAt: Date;
  _count?: {
    members: number;
    songs: number;
  };
}

interface SongPriorityWidgetProps {
  bands: Band[];
}

// Dummy song data - would come from API in real implementation
const dummySongs = [
  {
    id: '1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    bandName: 'Jamberry',
    priority: 'high' as const,
    lastPracticed: '2 days ago',
    duration: '5:55'
  },
  {
    id: '2',
    title: 'Still Into You',
    artist: 'Paramore',
    bandName: 'Paramore',
    priority: 'high' as const,
    lastPracticed: '1 week ago',
    duration: '3:36'
  },
  {
    id: '3',
    title: 'Mr. Brightside',
    artist: 'The Killers',
    bandName: 'Jamberry',
    priority: 'medium' as const,
    lastPracticed: '3 days ago',
    duration: '3:42'
  },
  {
    id: '4',
    title: 'Misery Business',
    artist: 'Paramore',
    bandName: 'Paramore',
    priority: 'medium' as const,
    lastPracticed: '5 days ago',
    duration: '3:31'
  },
  {
    id: '5',
    title: 'Sweet Child O Mine',
    artist: 'Guns N Roses',
    bandName: 'Jamberry',
    priority: 'low' as const,
    lastPracticed: '2 weeks ago',
    duration: '5:03'
  }
];

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

const priorityLabels = {
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

export function SongPriorityWidget({ bands }: SongPriorityWidgetProps) {
  const [selectedBand, setSelectedBand] = useState<string>('all');

  const filteredSongs = selectedBand === 'all' 
    ? dummySongs 
    : dummySongs.filter(song => song.bandName === selectedBand);

  // Sort by priority (high -> medium -> low)
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Song Priority List</h3>
        </div>
        <Badge variant="secondary">{filteredSongs.length} songs</Badge>
      </div>

      {/* Band Filter Tabs */}
      <Tabs value={selectedBand} onValueChange={setSelectedBand} className="mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Bands</TabsTrigger>
          <TabsTrigger value="Jamberry">Jamberry</TabsTrigger>
          <TabsTrigger value="Paramore">Paramore</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Songs List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedSongs.map((song) => (
          <div key={song.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <div className={`w-3 h-3 rounded-full ${priorityColors[song.priority]}`} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium truncate">{song.title}</h4>
                <Badge variant="outline" className="text-xs">{priorityLabels[song.priority]}</Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{song.artist}</span>
                {selectedBand === 'all' && (
                  <Badge variant="secondary" className="text-xs">{song.bandName}</Badge>
                )}
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{song.lastPracticed}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Music className="h-3 w-3" />
                  <span>{song.duration}</span>
                </div>
              </div>
            </div>

            <Button variant="ghost" size="sm">
              Practice
            </Button>
          </div>
        ))}
      </div>

      {sortedSongs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No songs found for the selected filter
        </div>
      )}
    </Card>
  );
}