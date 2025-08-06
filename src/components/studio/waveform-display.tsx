'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Volume2,
  Mic,
  Settings,
  ZoomIn,
  ZoomOut
} from 'lucide-react'

interface WaveformDisplayProps {
  audioBuffer?: AudioBuffer
  isPlaying: boolean
  currentTime: number
  duration: number
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSeek: (time: number) => void
  onRecord: () => void
  isRecording: boolean
  volume: number
  onVolumeChange: (volume: number) => void
}

export function WaveformDisplay({
  audioBuffer,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onRecord,
  isRecording,
  volume,
  onVolumeChange
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)

  const waveformDataRef = useRef<{peaks: Array<{min: number, max: number}>, zoom: number} | null>(null)

  const generateWaveformData = useCallback((audioBuffer: AudioBuffer, width: number, zoom: number) => {
    const data = audioBuffer.getChannelData(0)
    const samplesPerPixel = Math.floor(data.length / (width * zoom))
    const peaks: Array<{min: number, max: number}> = []

    for (let x = 0; x < width; x++) {
      const start = Math.floor(x * samplesPerPixel)
      const end = Math.floor((x + 1) * samplesPerPixel)
      
      let min = 0
      let max = 0
      
      for (let i = start; i < end && i < data.length; i++) {
        const sample = data[i]
        if (sample > max) max = sample
        if (sample < min) min = sample
      }
      
      peaks.push({ min, max })
    }

    return { peaks, zoom }
  }, [])


  // Store previous playhead position to clear it
  const prevPlayheadRef = useRef<number>(-1)

  // Draw only static waveform (NO playhead, NO currentTime dependency)
  const drawStaticWaveform = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !audioBuffer) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get the CSS display size
    const rect = canvas.getBoundingClientRect()
    const displayWidth = rect.width
    const displayHeight = rect.height
    
    // Set canvas size to match display size with DPI scaling
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr
      canvas.height = displayHeight * dpr
      canvas.style.width = displayWidth + 'px'
      canvas.style.height = displayHeight + 'px'
      ctx.scale(dpr, dpr)
    }
    
    const width = displayWidth
    const height = displayHeight
    
    // Clear entire canvas
    ctx.clearRect(0, 0, width, height)

    // Only regenerate waveform data if zoom changed or no cache
    if (!waveformDataRef.current || waveformDataRef.current.zoom !== zoom) {
      waveformDataRef.current = generateWaveformData(audioBuffer, width, zoom)
    }

    const amplitude = height / 2
    const peaks = waveformDataRef.current.peaks

    // Draw waveform using cached peaks
    ctx.fillStyle = '#3b82f6'
    ctx.strokeStyle = '#1d4ed8'
    ctx.lineWidth = 1

    for (let x = 0; x < Math.min(width, peaks.length); x++) {
      const { min, max } = peaks[x]
      const barHeight = Math.max(1, (max - min) * amplitude)
      const y = amplitude + (min * amplitude)
      
      ctx.fillRect(x, y, 1, barHeight)
    }

    // Draw time markers (static)
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px system-ui'
    const timeStep = Math.max(10, Math.floor(duration / 10))
    for (let time = 0; time <= duration; time += timeStep) {
      const x = (time / duration) * width
      const minutes = Math.floor(time / 60)
      const seconds = Math.floor(time % 60)
      const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`
      ctx.fillText(timeText, x, height - 5)
    }

    // Reset playhead tracking since we cleared everything
    prevPlayheadRef.current = -1
  }, [audioBuffer, zoom, duration, generateWaveformData]) // ✅ NO currentTime!

  // Draw only playhead (lightweight update for time changes)
  const drawPlayheadOnly = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !audioBuffer || duration <= 0 || !waveformDataRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get the CSS display size (same as static drawing)
    const rect = canvas.getBoundingClientRect()
    const displayWidth = rect.width
    const displayHeight = rect.height
    
    // Ensure canvas context uses correct scaling (same as static drawing)
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0) // Reset and apply DPI scaling
    
    const playheadX = (currentTime / duration) * displayWidth
    
    // Clear previous playhead if it exists
    if (prevPlayheadRef.current >= 0) {
      const clearWidth = 3
      const clearStart = Math.max(0, prevPlayheadRef.current - clearWidth)
      const clearEnd = Math.min(displayWidth, prevPlayheadRef.current + clearWidth)
      
      // Clear the old playhead area
      ctx.clearRect(clearStart, 0, clearEnd - clearStart, displayHeight)
      
      // Redraw waveform in cleared area
      const peaks = waveformDataRef.current.peaks
      const amplitude = displayHeight / 2
      
      ctx.fillStyle = '#3b82f6'
      for (let x = Math.floor(clearStart); x <= Math.ceil(clearEnd) && x < peaks.length; x++) {
        const { min, max } = peaks[x]
        const barHeight = Math.max(1, (max - min) * amplitude)
        const y = amplitude + (min * amplitude)
        ctx.fillRect(x, y, 1, barHeight)
      }
    }

    // Draw new playhead
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(playheadX, 0)
    ctx.lineTo(playheadX, displayHeight)
    ctx.stroke()
    
    prevPlayheadRef.current = playheadX
  }, [currentTime, duration, audioBuffer])

  // Redraw static waveform when audio/zoom changes (NOT when time changes)
  useEffect(() => {
    if (audioBuffer && canvasRef.current) {
      drawStaticWaveform()
    }
  }, [audioBuffer, zoom, drawStaticWaveform])

  // Only redraw playhead when time changes (and static waveform exists)
  useEffect(() => {
    if (audioBuffer && canvasRef.current && duration > 0 && waveformDataRef.current) {
      drawPlayheadOnly()
    }
  }, [currentTime, drawPlayheadOnly])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!duration) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickTime = (x / rect.width) * duration
    onSeek(clickTime)
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickTime = (x / rect.width) * duration
    onSeek(clickTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 2, 8))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 2, 0.25))

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Waveform</h3>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Waveform Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-32 bg-muted/20 rounded-lg cursor-pointer"
          onClick={handleCanvasClick}
        />
        {!audioBuffer && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">Load an audio file to see waveform</p>
          </div>
        )}
      </div>

      {/* Timeline Controls */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div 
          className="w-full h-2 bg-muted rounded-full relative cursor-pointer"
          onClick={handleTimelineClick}
        >
          <div 
            className="h-full bg-primary rounded-full pointer-events-none"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={onStop}>
            <Square className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={isPlaying ? onPause : onPlay}>
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button size="sm" variant="outline">
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant={isRecording ? "destructive" : "outline"}
            onClick={onRecord}
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            onValueChange={(value) => onVolumeChange(value[0])}
            max={100}
            step={1}
            className="w-24"
          />
          <span className="text-xs text-muted-foreground w-8">{volume}%</span>
          <Button size="sm" variant="ghost">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}