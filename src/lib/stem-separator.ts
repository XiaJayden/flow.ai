export interface StemSeparationProgress {
  stage: 'loading' | 'analyzing' | 'separating' | 'complete'
  progress: number // 0-100
  currentStem?: string
  message?: string
}

export interface SeparatedStems {
  vocals: AudioBuffer
  drums: AudioBuffer
  bass: AudioBuffer
  other: AudioBuffer
  original: AudioBuffer
}

export type SeparationQuality = 'fast' | 'balanced' | 'high' | 'ml'
export type SeparationMode = 'basic' | 'ml'

export class StemSeparator {
  private audioContext: AudioContext
  private onProgress?: (progress: StemSeparationProgress) => void

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
  }

  setProgressCallback(callback: (progress: StemSeparationProgress) => void) {
    this.onProgress = callback
  }

  async separateStems(
    audioBuffer: AudioBuffer, 
    quality: SeparationQuality = 'balanced',
    mode: SeparationMode = 'basic'
  ): Promise<SeparatedStems> {
    console.log('🔄 StemSeparator: Starting separation process')
    console.log('📊 Mode:', mode, 'Quality:', quality)
    
    this.onProgress?.({ stage: 'analyzing', progress: 0 })

    if (mode === 'ml' || quality === 'ml') {
      // Use ML-based separation
      console.log('🤖 Using ML-based separation')
      return await this.mlSeparation(audioBuffer)
    } else {
      // Use basic frequency-based separation
      console.log('🔄 Using basic frequency-based separation')
      const stems = await this.directAudioSeparation(audioBuffer, quality)
      console.log('✅ StemSeparator: Direct separation complete')
      
      this.onProgress?.({ stage: 'complete', progress: 100 })
      return stems
    }
  }

  private async mlSeparation(audioBuffer: AudioBuffer): Promise<SeparatedStems> {
    // Import ML separator dynamically to avoid loading TensorFlow.js unless needed
    const { SpleeterML } = await import('./spleeter-ml')
    
    const mlSeparator = new SpleeterML()
    
    // Forward progress updates
    mlSeparator.setProgressCallback((mlProgress) => {
      // Convert ML progress to basic progress format
      let stage: 'analyzing' | 'separating' | 'complete'
      
      switch (mlProgress.stage) {
        case 'loading':
        case 'preprocessing':
          stage = 'analyzing'
          break
        case 'inference':
        case 'postprocessing':
          stage = 'separating'
          break
        case 'complete':
          stage = 'complete'
          break
        default:
          stage = 'analyzing'
      }
      
      this.onProgress?.({
        stage,
        progress: mlProgress.progress,
        currentStem: mlProgress.currentStem
      })
    })

    try {
      // Load the 4-stems model
      await mlSeparator.loadModel('4stems')
      
      // Perform ML-based separation
      const mlResults = await mlSeparator.separateStems(audioBuffer)
      
      // Convert to expected format
      const stems: SeparatedStems = {
        vocals: mlResults.vocals || audioBuffer,
        drums: mlResults.drums || audioBuffer,
        bass: mlResults.bass || audioBuffer,
        other: mlResults.other || audioBuffer,
        original: audioBuffer
      }
      
      // Clean up ML resources
      mlSeparator.dispose()
      
      return stems
      
    } catch (error) {
      console.error('❌ ML separation failed, falling back to basic mode:', error)
      mlSeparator.dispose()
      
      // Fallback to basic separation
      this.onProgress?.({ stage: 'separating', progress: 0 })
      return await this.directAudioSeparation(audioBuffer, 'balanced')
    }
  }

  private convertToMono(audioBuffer: AudioBuffer): Float32Array {
    const length = audioBuffer.length
    const monoData = new Float32Array(length)
    
    if (audioBuffer.numberOfChannels === 1) {
      monoData.set(audioBuffer.getChannelData(0))
    } else {
      // Average stereo channels
      const leftChannel = audioBuffer.getChannelData(0)
      const rightChannel = audioBuffer.getChannelData(1)
      
      for (let i = 0; i < length; i++) {
        monoData[i] = (leftChannel[i] + rightChannel[i]) / 2
      }
    }
    
    return monoData
  }

  private async performFFT(audioData: Float32Array, sampleRate: number): Promise<{
    frequencies: Float32Array[]
    magnitude: Float32Array[]
    phase: Float32Array[]
  }> {
    // Simple sliding window FFT
    const windowSize = 2048
    const hopSize = windowSize / 4
    const windows = Math.floor((audioData.length - windowSize) / hopSize) + 1
    
    const frequencies: Float32Array[] = []
    const magnitude: Float32Array[] = []
    const phase: Float32Array[] = []

    for (let w = 0; w < windows; w++) {
      const start = w * hopSize
      const window = audioData.slice(start, start + windowSize)
      
      // Apply Hanning window
      this.applyHanningWindow(window)
      
      // Perform FFT (simplified - in real implementation you'd use a proper FFT library)
      const { mag, ph } = this.simpleFFT(window)
      
      frequencies.push(window)
      magnitude.push(mag)
      phase.push(ph)

      // Update progress
      if (w % 100 === 0) {
        const progress = Math.floor((w / windows) * 75) + 25
        this.onProgress?.({ stage: 'analyzing', progress })
      }
    }

    return { frequencies, magnitude, phase }
  }

  private applyHanningWindow(window: Float32Array) {
    const N = window.length
    for (let n = 0; n < N; n++) {
      const hanningValue = 0.5 * (1 - Math.cos(2 * Math.PI * n / (N - 1)))
      window[n] *= hanningValue
    }
  }

  private simpleFFT(window: Float32Array): { mag: Float32Array, ph: Float32Array } {
    // This is a simplified FFT - in production you'd use a proper FFT library like fft.js
    const N = window.length
    const magnitude = new Float32Array(N / 2)
    const phase = new Float32Array(N / 2)
    
    for (let k = 0; k < N / 2; k++) {
      let real = 0
      let imag = 0
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N
        real += window[n] * Math.cos(angle)
        imag += window[n] * Math.sin(angle)
      }
      
      magnitude[k] = Math.sqrt(real * real + imag * imag)
      phase[k] = Math.atan2(imag, real)
    }
    
    return { mag: magnitude, ph: phase }
  }

  private async spectralSeparation(
    fftData: { frequencies: Float32Array[], magnitude: Float32Array[], phase: Float32Array[] },
    originalBuffer: AudioBuffer,
    quality: SeparationQuality
  ): Promise<SeparatedStems> {
    const { sampleRate, length } = originalBuffer
    
    // Create empty buffers for each stem
    const vocals = this.audioContext.createBuffer(2, length, sampleRate)
    const drums = this.audioContext.createBuffer(2, length, sampleRate)
    const bass = this.audioContext.createBuffer(2, length, sampleRate)
    const other = this.audioContext.createBuffer(2, length, sampleRate)

    const stems = ['vocals', 'drums', 'bass', 'other'] as const
    
    for (let stemIndex = 0; stemIndex < stems.length; stemIndex++) {
      const stemName = stems[stemIndex]
      this.onProgress?.({ 
        stage: 'separating', 
        progress: Math.floor((stemIndex / stems.length) * 100),
        currentStem: stemName
      })

      const stemBuffer = await this.isolateStem(
        fftData, 
        originalBuffer, 
        stemName, 
        quality
      )

      // Copy to appropriate output buffer
      const targetBuffer = stemName === 'vocals' ? vocals : 
                          stemName === 'drums' ? drums :
                          stemName === 'bass' ? bass : other

      for (let channel = 0; channel < 2; channel++) {
        const channelData = targetBuffer.getChannelData(channel)
        const sourceData = stemBuffer.getChannelData(Math.min(channel, stemBuffer.numberOfChannels - 1))
        channelData.set(sourceData)
      }
    }

    return {
      vocals,
      drums, 
      bass,
      other,
      original: originalBuffer
    }
  }

  private async isolateStem(
    fftData: { frequencies: Float32Array[], magnitude: Float32Array[], phase: Float32Array[] },
    originalBuffer: AudioBuffer,
    stemType: 'vocals' | 'drums' | 'bass' | 'other',
    quality: SeparationQuality
  ): Promise<AudioBuffer> {
    // Simple frequency-based separation (this is very basic - real ML models work much better)
    const { sampleRate, length } = originalBuffer
    const outputBuffer = this.audioContext.createBuffer(originalBuffer.numberOfChannels, length, sampleRate)

    // Define frequency ranges for each stem (rough approximations)
    const frequencyRanges = {
      vocals: { low: 80, high: 8000 },    // Human voice range
      drums: { low: 20, high: 2000 },     // Kick, snare, hats
      bass: { low: 20, high: 250 },       // Bass frequencies  
      other: { low: 250, high: 20000 }    // Everything else
    }

    const range = frequencyRanges[stemType]
    
    // Apply frequency filtering to original audio
    for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
      const inputData = originalBuffer.getChannelData(channel)
      const outputData = outputBuffer.getChannelData(channel)
      
      // Simple bandpass filter (in production, use proper filtering)
      const filtered = this.applyBandpassFilter(inputData, sampleRate, range.low, range.high)
      outputData.set(filtered)
    }

    return outputBuffer
  }

  // Simplified direct audio separation using Web Audio API filters
  private async directAudioSeparation(
    audioBuffer: AudioBuffer,
    quality: SeparationQuality
  ): Promise<SeparatedStems> {
    const { sampleRate, length, numberOfChannels } = audioBuffer
    
    // Create buffers for each stem
    const vocals = this.audioContext.createBuffer(numberOfChannels, length, sampleRate)
    const drums = this.audioContext.createBuffer(numberOfChannels, length, sampleRate)
    const bass = this.audioContext.createBuffer(numberOfChannels, length, sampleRate)
    const other = this.audioContext.createBuffer(numberOfChannels, length, sampleRate)

    // Define stems to process
    const stemConfigs = [
      { name: 'vocals', lowFreq: 200, highFreq: 8000, buffer: vocals },
      { name: 'drums', lowFreq: 60, highFreq: 2000, buffer: drums },
      { name: 'bass', lowFreq: 20, highFreq: 250, buffer: bass },
      { name: 'other', lowFreq: 250, highFreq: 15000, buffer: other }
    ]

    // Process each stem
    for (let stemIndex = 0; stemIndex < stemConfigs.length; stemIndex++) {
      const stem = stemConfigs[stemIndex]
      const baseProgress = Math.floor((stemIndex / stemConfigs.length) * 100)
      
      this.onProgress?.({ 
        stage: 'separating', 
        progress: baseProgress,
        currentStem: stem.name
      })

      // Process each channel for this stem
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel)
        
        // Apply frequency filtering for this stem
        const filteredData = this.applyBandpassFilter(
          inputData, 
          sampleRate, 
          stem.lowFreq, 
          stem.highFreq
        )
        
        // Copy to output buffer
        stem.buffer.getChannelData(channel).set(filteredData)
        
        // Update progress within stem
        const channelProgress = Math.floor((channel / numberOfChannels) * 25)
        this.onProgress?.({ 
          stage: 'separating', 
          progress: baseProgress + channelProgress,
          currentStem: stem.name
        })
        
        // Yield control to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 5))
      }
    }

    return {
      vocals,
      drums, 
      bass,
      other,
      original: audioBuffer
    }
  }

  private applyBandpassFilter(
    inputData: Float32Array, 
    sampleRate: number, 
    lowFreq: number, 
    highFreq: number
  ): Float32Array {
    // Simple bandpass filter using basic IIR approach
    const output = new Float32Array(inputData.length)
    
    // Calculate filter coefficients
    const nyquist = sampleRate / 2
    const lowNorm = lowFreq / nyquist
    const highNorm = highFreq / nyquist
    
    // Simple one-pole filters
    const lowAlpha = Math.exp(-2 * Math.PI * lowNorm)
    const highAlpha = Math.exp(-2 * Math.PI * highNorm)
    
    let lowState = 0
    let highState = 0
    
    for (let i = 0; i < inputData.length; i++) {
      // High-pass filter (remove low frequencies)
      highState = highAlpha * highState + (1 - highAlpha) * inputData[i]
      const highpassed = inputData[i] - highState
      
      // Low-pass filter (remove high frequencies)  
      lowState = lowAlpha * lowState + (1 - lowAlpha) * highpassed
      
      output[i] = lowState * 0.3 // Reduce volume to prevent clipping
    }
    
    return output
  }
}

// Utility function to create stem separator
export function createStemSeparator(audioContext?: AudioContext): StemSeparator {
  const context = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)()
  return new StemSeparator(context)
}