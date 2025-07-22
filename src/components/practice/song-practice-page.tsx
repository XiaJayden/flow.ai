'use client'

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play } from 'lucide-react';
import { YouTubePlayer } from '@/components/player/youtube-player';
import { AnnotationSidebar } from '@/components/annotations/annotation-sidebar';
import { AnnotationTimeline } from '@/components/annotations/annotation-timeline';
import { AnnotationWithDetails } from '@/types';
import { formatTime } from '@/lib/utils';
import { filterInstrumentParts } from '@/lib/constants';

interface SongPracticePageProps {
  song: {
    id: string;
    title: string;
    artist?: string | null;
    youtubeId: string;
    duration: number;
    thumbnail?: string | null;
    bandId: string;
    annotations: AnnotationWithDetails[];
    band: {
      id: string;
      name: string;
    };
  };
  userInstruments: string[];
  availableInstruments: string[];
  bandId: string;
}

export function SongPracticePage({ 
  song, 
  userInstruments, 
  availableInstruments,
  bandId
}: SongPracticePageProps) {
  // Filter out base instruments when numbered parts exist
  const filteredAvailableInstruments = filterInstrumentParts(availableInstruments);
  
  const [annotations, setAnnotations] = useState<AnnotationWithDetails[]>(song.annotations);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(song.duration);
  const [seekToTime, setSeekToTime] = useState<number | undefined>();
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(filteredAvailableInstruments);
  const [playerReady, setPlayerReady] = useState(false);
  const [customInstrumentColors, setCustomInstrumentColors] = useState<Record<string, string>>({});
  const [scrollToAnnotationFn, setScrollToAnnotationFn] = useState<((timestamp: number) => void) | null>(null);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((newDuration: number) => {
    setDuration(newDuration);
  }, []);

  const handleSeekToTime = useCallback((time: number) => {
    setSeekToTime(time);
  }, []);

  const handleSeekComplete = useCallback(() => {
    setSeekToTime(undefined);
  }, []);

  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true);
  }, []);

  const handleAnnotationCreated = useCallback(async () => {
    // Refresh annotations
    try {
      const response = await fetch(`/api/songs/${song.id}/annotations`);
      if (response.ok) {
        const updatedAnnotations = await response.json();
        setAnnotations(updatedAnnotations);
      }
    } catch (error) {
      console.error('Failed to refresh annotations:', error);
    }
  }, [song.id]);

  const handleTimelineClick = useCallback((time: number) => {
    setSeekToTime(time);
  }, []);

  const handleInstrumentColorChange = useCallback((instrument: string, color: string) => {
    setCustomInstrumentColors(prev => ({
      ...prev,
      [instrument]: color
    }));
  }, []);

  const handleInstrumentFilterChange = useCallback((instruments: string[]) => {
    setSelectedInstruments(instruments);
  }, []);

  const handleScrollToAnnotation = useCallback((scrollFunction: (timestamp: number) => void) => {
    console.log('Setting scroll function:', scrollFunction);
    setScrollToAnnotationFn(() => scrollFunction);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/bands/${bandId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to {song.band.name}
                </Button>
              </Link>
              
              <div className="flex items-center gap-4">
                {song.thumbnail && (
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="w-12 h-9 object-cover rounded"
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold">{song.title}</h1>
                  {song.artist && (
                    <p className="text-muted-foreground">{song.artist}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Play className="h-3 w-3 mr-1" />
                {formatTime(duration)}
              </Badge>
              <Badge variant="outline">
                {annotations.length} annotations
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-lg p-6 space-y-4">
              <YouTubePlayer
                videoId={song.youtubeId}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleDurationChange}
                onPlayerReady={handlePlayerReady}
                seekToTime={seekToTime}
                onSeekComplete={handleSeekComplete}
              />
              
              {/* Timeline - replaces the YouTube player's progress bar */}
              {playerReady && (
                <AnnotationTimeline
                  annotations={annotations}
                  duration={duration}
                  currentTime={currentTime}
                  selectedInstruments={selectedInstruments}
                  onSeekToTime={handleSeekToTime}
                  onTimelineClick={handleTimelineClick}
                  customInstrumentColors={customInstrumentColors}
                  onMarkerClick={scrollToAnnotationFn}
                />
              )}
            </div>
          </div>

          {/* Annotation Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 h-[calc(100vh-8rem)]">
              <AnnotationSidebar
                annotations={annotations}
                availableInstruments={filteredAvailableInstruments}
                userInstruments={userInstruments}
                currentTime={currentTime}
                onSeekToTime={handleSeekToTime}
                onAnnotationCreated={handleAnnotationCreated}
                songId={song.id}
                customInstrumentColors={customInstrumentColors}
                onInstrumentColorChange={handleInstrumentColorChange}
                selectedInstruments={selectedInstruments}
                onInstrumentFilterChange={handleInstrumentFilterChange}
                onScrollToAnnotation={handleScrollToAnnotation}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}