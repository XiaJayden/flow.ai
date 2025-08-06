'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Headphones,
  MoreVertical,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Track {
  id: string
  name: string
  type: 'stem' | 'recording'
  instrument: string
  isPlaying: boolean
  isMuted: boolean
  isSolo: boolean
  volume: number
  user?: string
  takes?: number
}

interface TrackMixerProps {
  tracks: Track[]
  onTrackUpdate: (trackId: string, updates: Partial<Track>) => void
  onTrackDelete: (trackId: string) => void
}

export function TrackMixer({ tracks, onTrackUpdate, onTrackDelete }: TrackMixerProps) {
  const [masterVolume, setMasterVolume] = useState([75])

  const stemTracks = tracks.filter(track => track.type === 'stem')
  const recordingTracks = tracks.filter(track => track.type === 'recording')

  const handleVolumeChange = (trackId: string, volume: number[]) => {
    onTrackUpdate(trackId, { volume: volume[0] })
  }

  const toggleMute = (trackId: string, currentMute: boolean) => {
    onTrackUpdate(trackId, { isMuted: !currentMute })
  }

  const toggleSolo = (trackId: string, currentSolo: boolean) => {
    onTrackUpdate(trackId, { isSolo: !currentSolo })
  }

  const togglePlay = (trackId: string, currentPlay: boolean) => {
    onTrackUpdate(trackId, { isPlaying: !currentPlay })
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Track Mixer</h3>
        <Button size="sm" variant="outline">Mix Down</Button>
      </div>

      {/* Master Volume */}
      <div className="mb-6 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Master</span>
          <span className="text-xs text-muted-foreground">{masterVolume[0]}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <VolumeX className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={masterVolume}
            onValueChange={setMasterVolume}
            max={100}
            step={1}
            className="flex-1"
          />
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Original Stems */}
      {stemTracks.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Original Stems</h4>
          <div className="space-y-3">
            {stemTracks.map((track) => (
              <TrackControl
                key={track.id}
                track={track}
                onVolumeChange={(volume) => handleVolumeChange(track.id, volume)}
                onToggleMute={() => toggleMute(track.id, track.isMuted)}
                onToggleSolo={() => toggleSolo(track.id, track.isSolo)}
                onTogglePlay={() => togglePlay(track.id, track.isPlaying)}
                onDelete={() => onTrackDelete(track.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Member Recordings */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Recordings</h4>
        {recordingTracks.length > 0 ? (
          <div className="space-y-3">
            {recordingTracks.map((track) => (
              <TrackControl
                key={track.id}
                track={track}
                onVolumeChange={(volume) => handleVolumeChange(track.id, volume)}
                onToggleMute={() => toggleMute(track.id, track.isMuted)}
                onToggleSolo={() => toggleSolo(track.id, track.isSolo)}
                onTogglePlay={() => togglePlay(track.id, track.isPlaying)}
                onDelete={() => onTrackDelete(track.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground p-4 text-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
            No recordings yet
          </div>
        )}
      </div>
    </Card>
  )
}

interface TrackControlProps {
  track: Track
  onVolumeChange: (volume: number[]) => void
  onToggleMute: () => void
  onToggleSolo: () => void
  onTogglePlay: () => void
  onDelete: () => void
}

function TrackControl({ 
  track, 
  onVolumeChange, 
  onToggleMute, 
  onToggleSolo, 
  onTogglePlay,
  onDelete 
}: TrackControlProps) {
  return (
    <div className="p-3 border rounded-lg bg-background">
      {/* Track Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={track.isPlaying ? "default" : "outline"}
            className="h-6 w-6 p-0"
            onClick={onTogglePlay}
          >
            {track.isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          <div>
            <div className="text-sm font-medium">{track.name}</div>
            {track.user && (
              <div className="text-xs text-muted-foreground">by {track.user}</div>
            )}
            {track.takes && track.takes > 1 && (
              <div className="text-xs text-muted-foreground">{track.takes} takes</div>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Track
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Volume Slider */}
      <div className="flex items-center space-x-2 mb-2">
        <VolumeX className="h-3 w-3 text-muted-foreground" />
        <Slider
          value={[track.volume]}
          onValueChange={onVolumeChange}
          max={100}
          step={1}
          className="flex-1"
          disabled={track.isMuted}
        />
        <Volume2 className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground w-8">
          {track.isMuted ? 'M' : `${track.volume}%`}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Switch
            checked={track.isMuted}
            onCheckedChange={onToggleMute}
            size="sm"
          />
          <span className="text-xs">Mute</span>
        </div>
        <div className="flex items-center space-x-1">
          <Switch
            checked={track.isSolo}
            onCheckedChange={onToggleSolo}
            size="sm"
          />
          <span className="text-xs">Solo</span>
        </div>
        <Button size="sm" variant="ghost" className="h-6 px-2">
          <Headphones className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}