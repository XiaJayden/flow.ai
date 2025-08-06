'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Mic } from 'lucide-react'
import { TrackMixer } from '@/components/studio/track-mixer'
import { FileUpload } from '@/components/studio/file-upload'
import { WaveformDisplay } from '@/components/studio/waveform-display'
import { AudioEngine } from '@/lib/audio-engine'
import { MultiTrackAudioEngine } from '@/lib/multi-track-audio-engine'
import { createStemSeparator, StemSeparationProgress, SeparatedStems, SeparationQuality, SeparationMode } from '@/lib/stem-separator'
import { SpleeterML } from '@/lib/spleeter-ml'

export default function StudioPage() {
  const { data: session, status } = useSession()
  
  // Audio engine reference  
  const audioEngineRef = useRef<AudioEngine | null>(null)
  const multiTrackEngineRef = useRef<MultiTrackAudioEngine | null>(null)
  
  // Audio state
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [separatedStems, setSeparatedStems] = useState<SeparatedStems | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [masterVolume, setMasterVolume] = useState(75)
  const [isLoading, setIsLoading] = useState(false)
  
  // Stem separation state
  const [isSeparating, setIsSeparating] = useState(false)
  const [separationProgress, setSeparationProgress] = useState<StemSeparationProgress | null>(null)
  const [separationQuality, setSeparationQuality] = useState<SeparationQuality>('balanced')
  const [separationMode, setSeparationMode] = useState<SeparationMode>('basic')
  
  // Model caching state
  const [modelCacheInfo, setModelCacheInfo] = useState<{
    cachedModels: string[]
    isPreloading: boolean
    memoryUsage: any
  }>({ cachedModels: [], isPreloading: false, memoryUsage: null })
  const [isPreloadingModel, setIsPreloadingModel] = useState(false)

  // Initialize audio engines
  useEffect(() => {
    audioEngineRef.current = new AudioEngine()
    multiTrackEngineRef.current = new MultiTrackAudioEngine()
    
    // Set up callbacks for simple engine
    audioEngineRef.current.setOnTimeUpdate((time) => {
      setCurrentTime(time)
    })
    
    audioEngineRef.current.setOnEnded(() => {
      setIsPlaying(false)
    })

    // Set up callbacks for multi-track engine
    multiTrackEngineRef.current.setOnTimeUpdate((time) => {
      setCurrentTime(time)
    })
    
    multiTrackEngineRef.current.setOnEnded(() => {
      setIsPlaying(false)
    })

    // Set initial volume
    audioEngineRef.current.setVolume(masterVolume)
    multiTrackEngineRef.current.setMasterVolume(masterVolume / 100)

    // Cleanup
    return () => {
      audioEngineRef.current?.dispose()
      multiTrackEngineRef.current?.dispose()
    }
  }, [])

  // Update volume when it changes
  useEffect(() => {
    audioEngineRef.current?.setVolume(masterVolume)
    multiTrackEngineRef.current?.setMasterVolume(masterVolume / 100)
  }, [masterVolume])
  
  // Dynamic track data based on separated stems
  const [tracks, setTracks] = useState<Array<{
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
  }>>([])

  // Update tracks when stems are separated
  useEffect(() => {
    if (separatedStems) {
      const stemTracks = [
        {
          id: 'vocals',
          name: 'Vocals',
          type: 'stem' as const,
          instrument: 'vocals',
          isPlaying: false,
          isMuted: false,
          isSolo: false,
          volume: 85
        },
        {
          id: 'drums',
          name: 'Drums',
          type: 'stem' as const,
          instrument: 'drums',
          isPlaying: false,
          isMuted: false,
          isSolo: false,
          volume: 75
        },
        {
          id: 'bass',
          name: 'Bass',
          type: 'stem' as const,
          instrument: 'bass',
          isPlaying: false,
          isMuted: false,
          isSolo: false,
          volume: 80
        },
        {
          id: 'other',
          name: 'Other',
          type: 'stem' as const,
          instrument: 'other',
          isPlaying: false,
          isMuted: false,
          isSolo: false,
          volume: 70
        }
      ]
      setTracks(stemTracks)
    }
  }, [separatedStems])

  const handleTrackUpdate = (trackId: string, updates: any) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    ))

    // Update multi-track engine if stems are loaded
    if (multiTrackEngineRef.current && separatedStems) {
      if (updates.volume !== undefined) {
        multiTrackEngineRef.current.setTrackVolume(trackId, updates.volume / 100)
      }
      if (updates.isMuted !== undefined) {
        multiTrackEngineRef.current.setTrackMute(trackId, updates.isMuted)
      }
      if (updates.isSolo !== undefined) {
        multiTrackEngineRef.current.setTrackSolo(trackId, updates.isSolo)
      }
    }
  }

  const handleTrackDelete = (trackId: string) => {
    setTracks(prev => prev.filter(track => track.id !== trackId))
    multiTrackEngineRef.current?.removeTrack(trackId)
  }

  // Stem separation function
  const handleStemSeparation = async () => {
    console.log('🔴 BUTTON CLICKED! Starting stem separation...')
    console.log('🔴 Button state - isSeparating:', isSeparating)
    console.log('🔴 Audio buffer available:', !!audioBuffer)
    
    if (!audioBuffer) {
      console.log('🔴 No audio buffer - showing alert')
      alert('Please load an audio file first')
      return
    }

    console.log('📊 Audio buffer info:', {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      length: audioBuffer.length
    })

    setIsSeparating(true)
    setSeparationProgress({ stage: 'analyzing', progress: 0 })

    try {
      console.log('🔧 Creating separator with quality:', separationQuality)
      const separator = createStemSeparator()
      
      separator.setProgressCallback((progress) => {
        console.log('📈 Progress update:', progress)
        setSeparationProgress(progress)
      })
      
      console.log('⚡ Starting separation process...')
      const stems = await separator.separateStems(audioBuffer, separationQuality, separationMode)
      
      console.log('✅ Stems separated successfully:', {
        vocals: stems.vocals.duration,
        drums: stems.drums.duration,
        bass: stems.bass.duration,
        other: stems.other.duration
      })
      
      setSeparatedStems(stems)

      // Load stems into multi-track engine
      if (multiTrackEngineRef.current) {
        console.log('🎚️ Loading stems into multi-track engine...')
        await multiTrackEngineRef.current.addTrack('vocals', 'Vocals', stems.vocals)
        await multiTrackEngineRef.current.addTrack('drums', 'Drums', stems.drums)
        await multiTrackEngineRef.current.addTrack('bass', 'Bass', stems.bass)
        await multiTrackEngineRef.current.addTrack('other', 'Other', stems.other)
        console.log('🎛️ All stems loaded into engine')
      } else {
        console.error('❌ Multi-track engine not available')
      }

      console.log('🎉 Stem separation complete!')
    } catch (error) {
      console.error('❌ Error separating stems:', error)
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack)
        alert(`Error separating stems: ${error.message}`)
      } else {
        alert('Error separating stems: Unknown error occurred')
      }
    } finally {
      setIsSeparating(false)
      setSeparationProgress(null)
    }
  }

  // Background model preloading
  const startModelPreloading = async () => {
    if (separationMode === 'ml' && !isPreloadingModel) {
      setIsPreloadingModel(true)
      console.log('🔄 Starting background model preload...')
      
      try {
        // Preload the 4stems model in background
        await SpleeterML.preloadModel('4stems')
        
        // Update cache info
        const cacheInfo = SpleeterML.getModelCacheInfo()
        setModelCacheInfo(cacheInfo)
        
        console.log('✅ Background model preload complete')
      } catch (error) {
        console.warn('⚠️ Background model preload failed:', error)
      } finally {
        setIsPreloadingModel(false)
      }
    }
  }

  // Audio handling functions
  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const audioContext = new AudioContext()
      const buffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Load into audio engine
      await audioEngineRef.current?.loadAudioBuffer(buffer)
      
      setAudioBuffer(buffer)
      setDuration(buffer.duration)
      setCurrentTime(0)
      setIsPlaying(false)
      
      console.log('Audio loaded:', {
        duration: buffer.duration,
        sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels
      })

      // Start preloading ML model in background if ML mode is selected
      if (separationMode === 'ml') {
        startModelPreloading()
      }
      
    } catch (error) {
      console.error('Error loading audio file:', error)
      alert('Error loading audio file. Please try a different file.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleYouTubeUrl = async (url: string) => {
    setIsLoading(true)
    try {
      // For now, just log the URL - we'll implement YouTube audio extraction later
      console.log('YouTube URL:', url)
      alert('YouTube integration coming soon! For now, please upload an audio file.')
    } catch (error) {
      console.error('Error processing YouTube URL:', error)
      alert('Error processing YouTube URL.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlay = () => {
    if (separatedStems && multiTrackEngineRef.current) {
      // Use multi-track engine for separated stems
      multiTrackEngineRef.current.play(currentTime)
      setIsPlaying(true)
    } else if (audioEngineRef.current) {
      // Use simple engine for original audio
      audioEngineRef.current.play(currentTime)
      setIsPlaying(true)
    }
  }

  const handlePause = () => {
    if (separatedStems && multiTrackEngineRef.current) {
      multiTrackEngineRef.current.pause()
      setIsPlaying(false)
    } else if (audioEngineRef.current) {
      audioEngineRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleStop = () => {
    if (separatedStems && multiTrackEngineRef.current) {
      multiTrackEngineRef.current.stop()
      setIsPlaying(false)
      setCurrentTime(0)
    } else if (audioEngineRef.current) {
      audioEngineRef.current.stop()
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }

  const handleSeek = (time: number) => {
    if (separatedStems && multiTrackEngineRef.current) {
      multiTrackEngineRef.current.seek(time)
      setCurrentTime(time)
      const wasPlaying = multiTrackEngineRef.current.getIsPlaying()
      setIsPlaying(wasPlaying)
    } else if (audioEngineRef.current) {
      audioEngineRef.current.seek(time)
      setCurrentTime(time)
      const wasPlaying = audioEngineRef.current.getIsPlaying()
      setIsPlaying(wasPlaying)
    }
  }

  const handleRecord = () => {
    setIsRecording(!isRecording)
    // TODO: Implement recording functionality
    console.log('Toggle recording:', !isRecording)
  }

  const handleVolumeChange = (volume: number) => {
    setMasterVolume(volume)
    // Volume is already updated via useEffect
  }

  const handleSeparationModeChange = (mode: SeparationMode) => {
    setSeparationMode(mode)
    
    // Start preloading if ML mode is selected and audio is loaded
    if (mode === 'ml' && audioBuffer) {
      startModelPreloading()
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Studio</h1>
          <p className="text-muted-foreground">
            Collaborative music creation with AI-powered stem separation
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Main Studio Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Track Mixer - Left Side */}
        <div className="lg:col-span-1">
          <TrackMixer 
            tracks={tracks}
            onTrackUpdate={handleTrackUpdate}
            onTrackDelete={handleTrackDelete}
          />
        </div>

        {/* Main Workspace - Right Side */}
        <div className="lg:col-span-3 space-y-4">
          {/* File Upload Area */}
          <FileUpload
            onFileUpload={handleFileUpload}
            onYouTubeUrl={handleYouTubeUrl}
            isLoading={isLoading}
          />

          {/* Stem Separation Controls */}
          {audioBuffer && !separatedStems && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Stem Separation</h3>
                  <p className="text-sm text-muted-foreground">
                    Extract individual instruments from your audio
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select 
                    value={separationMode} 
                    onChange={(e) => handleSeparationModeChange(e.target.value as SeparationMode)}
                    className="border rounded px-2 py-1 text-sm"
                    disabled={isSeparating}
                  >
                    <option value="basic">Basic (Fast)</option>
                    <option value="ml">
                      AI/ML (High Quality)
                      {modelCacheInfo.cachedModels.includes('4stems') ? ' ✓' : ''}
                    </option>
                  </select>
                  
                  {separationMode === 'basic' && (
                    <select 
                      value={separationQuality} 
                      onChange={(e) => setSeparationQuality(e.target.value as SeparationQuality)}
                      className="border rounded px-2 py-1 text-sm"
                      disabled={isSeparating}
                    >
                      <option value="fast">Fast</option>
                      <option value="balanced">Balanced</option>
                      <option value="high">High Quality</option>
                    </select>
                  )}
                  <Button 
                    onClick={handleStemSeparation}
                    disabled={isSeparating}
                    size="sm"
                    className={isSeparating ? "bg-blue-500 text-white" : ""}
                  >
                    {isSeparating ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Separating...</span>
                      </div>
                    ) : (
                      'Separate Stems'
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Model Preloading Indicator */}
              {isPreloadingModel && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-purple-800">
                      Preloading AI model in background...
                    </span>
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    This will speed up your first ML separation
                  </div>
                </div>
              )}

              {isSeparating && separationProgress && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-blue-800 capitalize">
                        {separationProgress.stage === 'analyzing' ? 'Analyzing audio...' : 
                         separationProgress.stage === 'separating' ? 'Separating stems...' :
                         separationProgress.stage === 'loading' ? (separationProgress.message || 'Loading model...') :
                         'Processing...'}
                      </span>
                      {separationProgress.currentStem && (
                        <span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded text-xs">
                          {separationProgress.currentStem}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-blue-800">{separationProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${separationProgress.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    {separationProgress.message || 'This may take a few moments depending on audio length...'}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Model Cache Status */}
          {separationMode === 'ml' && modelCacheInfo.cachedModels.length > 0 && (
            <Card className="p-3 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">
                    AI Model Cached
                  </span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    {modelCacheInfo.cachedModels.join(', ')}
                  </span>
                </div>
                <span className="text-xs text-green-600">
                  Ready for instant loading
                </span>
              </div>
            </Card>
          )}

          {/* Separation Success Message */}
          {separatedStems && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  Stems separated successfully! Use the track mixer to control individual instruments.
                </span>
              </div>
            </Card>
          )}

          {/* Waveform Display */}
          <WaveformDisplay
            audioBuffer={separatedStems ? separatedStems.original : audioBuffer || undefined}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onSeek={handleSeek}
            onRecord={handleRecord}
            isRecording={isRecording}
            volume={masterVolume}
            onVolumeChange={handleVolumeChange}
          />

          {/* Recording Controls */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Recording</h3>
                <p className="text-sm text-muted-foreground">
                  {isRecording ? 'Recording...' : 'Ready to record'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Count-in:</span>
                <select className="border rounded px-2 py-1 text-sm">
                  <option>4 beats</option>
                  <option>2 beats</option>
                  <option>1 beat</option>
                  <option>None</option>
                </select>
                <Button 
                  variant={isRecording ? "destructive" : "default"} 
                  size="sm"
                  onClick={handleRecord}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  {isRecording ? 'Stop Recording' : 'Record'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}