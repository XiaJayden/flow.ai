export class AudioEngine {
  private audioContext: AudioContext | null = null
  private audioBuffer: AudioBuffer | null = null
  private sourceNode: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
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
      this.gainNode = this.audioContext.createGain()
      this.gainNode.connect(this.audioContext.destination)
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }

  async loadAudioBuffer(buffer: AudioBuffer) {
    this.audioBuffer = buffer
    this.stop() // Stop any currently playing audio
  }

  play(startOffset: number = 0) {
    if (!this.audioContext || !this.audioBuffer || !this.gainNode) {
      console.error('Audio engine not properly initialized')
      return
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    this.stop() // Stop any existing playback

    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = this.audioBuffer
    this.sourceNode.connect(this.gainNode)

    this.sourceNode.onended = () => {
      this.isPlaying = false
      this.pauseTime = 0
      this.onEnded?.()
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
      }
    }

    const offset = startOffset || this.pauseTime
    this.startTime = this.audioContext.currentTime - offset
    this.sourceNode.start(0, offset)
    this.isPlaying = true

    this.startTimeTracking()
  }

  pause() {
    if (this.sourceNode && this.isPlaying) {
      this.pauseTime = this.getCurrentTime()
      this.sourceNode.stop()
      this.sourceNode = null
      this.isPlaying = false
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
      }
    }
  }

  stop() {
    if (this.sourceNode) {
      this.sourceNode.stop()
      this.sourceNode = null
    }
    this.isPlaying = false
    this.pauseTime = 0
    this.startTime = 0
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }

  seek(time: number) {
    const wasPlaying = this.isPlaying
    this.stop()
    this.pauseTime = Math.max(0, Math.min(time, this.getDuration()))
    
    if (wasPlaying) {
      this.play()
    }
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      // Convert percentage to gain (0-1 range)
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume / 100))
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
    return this.audioBuffer?.duration || 0
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }

  setOnTimeUpdate(callback: (currentTime: number) => void) {
    this.onTimeUpdate = callback
  }

  setOnEnded(callback: () => void) {
    this.onEnded = callback
  }

  private startTimeTracking() {
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

  dispose() {
    this.stop()
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
  }
}