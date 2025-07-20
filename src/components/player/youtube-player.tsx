'use client'

import { useState, useRef, useCallback, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayerReady?: () => void;
  seekToTime?: number;
  onSeekComplete?: () => void;
}

export function YouTubePlayer({ 
  videoId, 
  onTimeUpdate, 
  onDurationChange, 
  onPlayerReady,
  seekToTime,
  onSeekComplete
}: YouTubePlayerProps) {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  const startTimeTracking = useCallback(() => {
    if (timeUpdateInterval.current) return;
    
    timeUpdateInterval.current = setInterval(() => {
      if (player && typeof player.getCurrentTime === 'function') {
        const time = player.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    }, 100);
  }, [player, onTimeUpdate]);

  const stopTimeTracking = useCallback(() => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
      timeUpdateInterval.current = null;
    }
  }, []);

  const onReady: YouTubeProps['onReady'] = (event) => {
    const ytPlayer = event.target;
    setPlayer(ytPlayer);
    setDuration(ytPlayer.getDuration());
    onDurationChange?.(ytPlayer.getDuration());
    onPlayerReady?.();
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    const state = event.data;
    // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (state === 1) { // playing
      setIsPlaying(true);
      startTimeTracking();
    } else {
      setIsPlaying(false);
      stopTimeTracking();
    }
  };

  const togglePlayPause = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const seekTo = (time: number) => {
    if (!player) return;
    player.seekTo(time, true);
    setCurrentTime(time);
    onTimeUpdate?.(time);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!player || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seekTo(newTime);
  };

  // Handle external seek requests
  useEffect(() => {
    if (seekToTime !== undefined && player) {
      seekTo(seekToTime);
      onSeekComplete?.();
    }
  }, [seekToTime, player, onSeekComplete]);

  const opts: YouTubeProps['opts'] = {
    height: '400',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0, // Hide default controls
      rel: 0,
      modestbranding: 1,
    },
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
          className="w-full"
        />
      </div>

      {/* Custom Controls */}
      <div className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div 
            className="relative h-2 bg-muted rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayPause}
              disabled={!player}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => seekTo(0)}
              disabled={!player}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const newVolume = parseInt(e.target.value);
                setVolume(newVolume);
                if (player) {
                  player.setVolume(newVolume);
                }
              }}
              className="w-20 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}