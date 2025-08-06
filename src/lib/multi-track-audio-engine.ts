export interface AudioTrack {
  id: string
  name: string
  buffer: AudioBuffer
  volume: number // 0-1
  isMuted: boolean
  isSolo: boolean
  gainNode: GainNode
  sourceNode: AudioBufferSourceNode | null
}

export class MultiTrackAudioEngine {
  private audioContext: AudioContext | null = null
  private tracks: Map<string, AudioTrack> = new Map()
  private masterGainNode: GainNode | null = null
  private startTime: number = 0
  private pauseTime: number = 0
  private isPlaying: boolean = false
  private onTimeUpdate?: (currentTime: number) => void
  private onEnded?: () => void
  private animationFrameId?: number

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGainNode = this.audioContext.createGain()
      this.masterGainNode.connect(this.audioContext.destination)
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }

  async addTrack(id: string, name: string, buffer: AudioBuffer): Promise<void> {
    if (!this.audioContext || !this.masterGainNode) {
      throw new Error('Audio engine not initialized')
    }

    // Create gain node for this track
    const gainNode = this.audioContext.createGain()
    gainNode.connect(this.masterGainNode)

    const track: AudioTrack = {
      id,
      name,
      buffer,
      volume: 0.8, // Default volume
      isMuted: false,
      isSolo: false,
      gainNode,
      sourceNode: null
    }

    this.tracks.set(id, track)
    this.updateTrackRouting()
  }

  removeTrack(id: string): void {
    const track = this.tracks.get(id)
    if (track) {
      if (track.sourceNode) {
        track.sourceNode.stop()
        track.sourceNode.disconnect()
      }
      track.gainNode.disconnect()
      this.tracks.delete(id)
      this.updateTrackRouting()
    }
  }

  setTrackVolume(id: string, volume: number): void {
    const track = this.tracks.get(id)
    if (track) {
      track.volume = Math.max(0, Math.min(1, volume))
      this.updateTrackGain(track)
    }
  }

  setTrackMute(id: string, isMuted: boolean): void {
    const track = this.tracks.get(id)
    if (track) {
      track.isMuted = isMuted
      this.updateTrackGain(track)
    }
  }

  setTrackSolo(id: string, isSolo: boolean): void {
    const track = this.tracks.get(id)
    if (track) {
      track.isSolo = isSolo
      this.updateTrackRouting()
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  private updateTrackGain(track: AudioTrack): void {
    const hasSolo = Array.from(this.tracks.values()).some(t => t.isSolo)
    
    let effectiveVolume = 0
    
    if (track.isMuted) {
      effectiveVolume = 0
    } else if (hasSolo) {
      // If any track is soloed, only play soloed tracks
      effectiveVolume = track.isSolo ? track.volume : 0
    } else {
      // Normal playback
      effectiveVolume = track.volume
    }
    
    track.gainNode.gain.value = effectiveVolume
  }

  private updateTrackRouting(): void {
    // Update gain for all tracks based on solo/mute state
    this.tracks.forEach(track => {
      this.updateTrackGain(track)
    })
  }

  async play(startOffset: number = 0): Promise<void> {
    if (!this.audioContext || !this.masterGainNode) {
      throw new Error('Audio engine not initialized')
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    this.stop() // Stop any existing playback

    const offset = startOffset || this.pauseTime
    this.startTime = this.audioContext.currentTime - offset

    // Start all tracks
    for (const track of this.tracks.values()) {
      const sourceNode = this.audioContext.createBufferSource()
      sourceNode.buffer = track.buffer
      sourceNode.connect(track.gainNode)
      
      sourceNode.onended = () => {
        if (this.isPlaying) {
          this.handleTrackEnded()
        }
      }
      
      track.sourceNode = sourceNode
      sourceNode.start(0, offset)
    }

    this.isPlaying = true
    this.startTimeTracking()
  }

  pause(): void {
    if (this.isPlaying) {
      this.pauseTime = this.getCurrentTime()
      this.stopAllTracks()
      this.isPlaying = false
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
      }
    }
  }

  stop(): void {
    this.stopAllTracks()
    this.isPlaying = false
    this.pauseTime = 0
    this.startTime = 0
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }

  private stopAllTracks(): void {
    this.tracks.forEach(track => {
      if (track.sourceNode) {
        try {
          track.sourceNode.stop()
        } catch (e) {
          // Source might already be stopped
        }
        track.sourceNode.disconnect()
        track.sourceNode = null
      }
    })
  }

  private handleTrackEnded(): void {
    // Since we can't reliably check playback state, we'll rely on the time tracking
    // to determine when all tracks have ended
    if (this.isPlaying && this.getCurrentTime() >= this.getDuration()) {
      this.isPlaying = false
      this.pauseTime = 0
      this.onEnded?.()
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
      }
    }
  }

  seek(time: number): void {
    const wasPlaying = this.isPlaying
    this.stop()
    this.pauseTime = Math.max(0, Math.min(time, this.getDuration()))
    
    if (wasPlaying) {
      this.play()
    }
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0
    
    if (this.isPlaying) {
      return this.audioContext.currentTime - this.startTime
    } else {
      return this.pauseTime
    }
  }

  getDuration(): number {
    // Return the duration of the longest track
    let maxDuration = 0
    this.tracks.forEach(track => {
      if (track.buffer.duration > maxDuration) {
        maxDuration = track.buffer.duration
      }
    })
    return maxDuration
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }

  getTracks(): AudioTrack[] {
    return Array.from(this.tracks.values())
  }

  getTrack(id: string): AudioTrack | undefined {
    return this.tracks.get(id)
  }

  setOnTimeUpdate(callback: (currentTime: number) => void): void {
    this.onTimeUpdate = callback
  }

  setOnEnded(callback: () => void): void {
    this.onEnded = callback
  }

  private startTimeTracking(): void {
    let lastUpdate = 0
    const updateTime = (timestamp: number) => {
      if (this.isPlaying) {
        // Throttle updates to ~10fps for better performance
        if (timestamp - lastUpdate >= 100) {
          const currentTime = this.getCurrentTime()
          this.onTimeUpdate?.(currentTime)
          
          // Check if we've reached the end
          if (currentTime >= this.getDuration()) {
            this.stop()
            this.onEnded?.()
            return
          }
          
          lastUpdate = timestamp
        }
        
        this.animationFrameId = requestAnimationFrame(updateTime)
      }
    }
    this.animationFrameId = requestAnimationFrame(updateTime)
  }

  dispose(): void {
    this.stop()
    this.tracks.clear()
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
  }
}