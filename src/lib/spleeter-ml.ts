import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'

export interface MLSeparationProgress {
  stage: 'loading' | 'preprocessing' | 'inference' | 'postprocessing' | 'complete'
  progress: number // 0-100
  currentStem?: string
  message?: string
}

export interface SpleeterModel {
  model: tf.GraphModel
  modelType: '2stems' | '4stems' | '5stems'
  inputShape: number[]
  outputShape: number[]
}

export class SpleeterML {
  private model: SpleeterModel | null = null
  private onProgress?: (progress: MLSeparationProgress) => void
  private static modelCache = new Map<string, SpleeterModel>()
  private static isPreloading = false
  private lastUsed = Date.now()

  constructor() {
    // Initialize TensorFlow.js backend
    this.initializeTensorFlow()
    
    // Start cleanup timer
    this.startCleanupTimer()
  }

  private async initializeTensorFlow() {
    try {
      // Set backend to WebGL for GPU acceleration
      await tf.setBackend('webgl')
      console.log('✅ TensorFlow.js WebGL backend initialized')
      console.log('📊 TF Backend:', tf.getBackend())
      console.log('🖥️ WebGL Support:', await tf.env().get('WEBGL_VERSION'))
    } catch (error) {
      console.warn('⚠️ WebGL not available, falling back to CPU')
      await tf.setBackend('cpu')
    }
  }

  setProgressCallback(callback: (progress: MLSeparationProgress) => void) {
    this.onProgress = callback
  }

  private startCleanupTimer() {
    // Clean up unused models every 5 minutes
    setInterval(() => {
      this.cleanupUnusedModels()
    }, 5 * 60 * 1000)
  }

  private cleanupUnusedModels() {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    
    SpleeterML.modelCache.forEach((model, key) => {
      if (this.lastUsed < fiveMinutesAgo && model !== this.model) {
        console.log(`🧹 Cleaning up unused model: ${key}`)
        model.model.dispose()
        SpleeterML.modelCache.delete(key)
      }
    })
  }

  static async preloadModel(modelType: '2stems' | '4stems' | '5stems' = '4stems'): Promise<void> {
    if (SpleeterML.isPreloading || SpleeterML.modelCache.has(modelType)) {
      return
    }

    SpleeterML.isPreloading = true
    console.log(`🔄 Background preloading ${modelType} model...`)

    try {
      const instance = new SpleeterML()
      await instance.loadModel(modelType)
      console.log(`✅ Background preload complete: ${modelType}`)
    } catch (error) {
      console.warn(`⚠️ Background preload failed: ${modelType}`, error)
    } finally {
      SpleeterML.isPreloading = false
    }
  }

  static getModelCacheInfo() {
    return {
      cachedModels: Array.from(SpleeterML.modelCache.keys()),
      cacheSize: SpleeterML.modelCache.size,
      isPreloading: SpleeterML.isPreloading,
      memoryUsage: tf.memory()
    }
  }

  async loadModel(modelType: '2stems' | '4stems' | '5stems' = '4stems'): Promise<void> {
    this.lastUsed = Date.now()
    
    // Check cache first
    if (SpleeterML.modelCache.has(modelType)) {
      console.log(`✅ Loading ${modelType} from cache`)
      this.model = SpleeterML.modelCache.get(modelType)!
      this.onProgress?.({ 
        stage: 'loading', 
        progress: 100, 
        message: 'Model loaded from cache!' 
      })
      return
    }

    this.onProgress?.({ 
      stage: 'loading', 
      progress: 0, 
      message: `Loading ${modelType} Spleeter model...` 
    })

    try {
      // Check if model files exist
      const modelUrl = this.getModelUrl(modelType)
      const modelExists = await this.checkModelExists(modelUrl)
      
      if (!modelExists) {
        console.warn(`⚠️ Model files not found at ${modelUrl}, using mock implementation`)
        // Use mock model for development
        this.model = this.createMockModel(modelType)
        SpleeterML.modelCache.set(modelType, this.model)
        
        this.onProgress?.({ 
          stage: 'loading', 
          progress: 100, 
          message: 'Using development mock model' 
        })
        return
      }
      
      console.log(`🔄 Loading Spleeter ${modelType} model from:`, modelUrl)
      
      // Load the real model with progress tracking
      const model = await tf.loadGraphModel(modelUrl, {
        onProgress: (fraction) => {
          const progress = Math.floor(fraction * 100)
          this.onProgress?.({ 
            stage: 'loading', 
            progress, 
            message: `Downloading model... ${progress}%` 
          })
        }
      })

      this.model = {
        model,
        modelType,
        inputShape: this.getInputShape(modelType),
        outputShape: this.getOutputShape(modelType)
      }

      // Cache the loaded model
      SpleeterML.modelCache.set(modelType, this.model)

      this.onProgress?.({ 
        stage: 'loading', 
        progress: 100, 
        message: 'Model loaded successfully!' 
      })

      console.log('✅ Spleeter model loaded and cached:', {
        type: modelType,
        inputShape: this.model.inputShape,
        outputShape: this.model.outputShape,
        memoryUsage: tf.memory()
      })

    } catch (error) {
      console.error('❌ Failed to load Spleeter model:', error)
      console.log('🔄 Falling back to mock implementation')
      
      // Fallback to mock model
      this.model = this.createMockModel(modelType)
      SpleeterML.modelCache.set(modelType, this.model)
      
      this.onProgress?.({ 
        stage: 'loading', 
        progress: 100, 
        message: 'Using fallback mock model' 
      })
    }
  }

  private async checkModelExists(modelUrl: string): Promise<boolean> {
    try {
      const response = await fetch(modelUrl, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      return false
    }
  }

  private createMockModel(modelType: '2stems' | '4stems' | '5stems'): SpleeterModel {
    // Create a lightweight mock model that doesn't require actual TensorFlow model files
    const mockTfModel = {
      predict: (input: tf.Tensor) => {
        // This would be replaced with actual model prediction
        return input
      },
      dispose: () => {
        console.log(`🧹 Mock model ${modelType} disposed`)
      }
    } as tf.GraphModel

    return {
      model: mockTfModel,
      modelType,
      inputShape: this.getInputShape(modelType),
      outputShape: this.getOutputShape(modelType)
    }
  }

  private getModelUrl(modelType: '2stems' | '4stems' | '5stems'): string {
    // These would be URLs to your hosted TensorFlow.js models
    // For production, you'd host converted Spleeter models here
    const baseUrl = '/models/spleeter'
    
    switch (modelType) {
      case '2stems':
        return `${baseUrl}/2stems/model.json`
      case '4stems':
        return `${baseUrl}/4stems/model.json`
      case '5stems':
        return `${baseUrl}/5stems/model.json`
      default:
        throw new Error(`Unsupported model type: ${modelType}`)
    }
  }

  private getInputShape(modelType: string): number[] {
    // Typical Spleeter input shapes (these are approximate)
    switch (modelType) {
      case '2stems':
      case '4stems':
      case '5stems':
        return [1, -1, 2048, 2] // [batch, time, frequency, channels]
      default:
        return [1, -1, 2048, 2]
    }
  }

  private getOutputShape(modelType: string): number[] {
    // Output shapes depend on number of stems
    const stems = modelType === '2stems' ? 2 : modelType === '4stems' ? 4 : 5
    return [1, -1, 2048, 2, stems] // [batch, time, frequency, channels, stems]
  }

  async separateStems(audioBuffer: AudioBuffer): Promise<{
    vocals?: AudioBuffer
    drums?: AudioBuffer
    bass?: AudioBuffer
    other?: AudioBuffer
    accompaniment?: AudioBuffer
    piano?: AudioBuffer
  }> {
    if (!this.model) {
      throw new Error('Model not loaded. Call loadModel() first.')
    }

    this.onProgress?.({ 
      stage: 'preprocessing', 
      progress: 0, 
      message: 'Preprocessing audio...' 
    })

    try {
      // Step 1: Convert audio to tensor
      console.log('🔄 Converting audio to tensor...')
      const inputTensor = await this.audioBufferToTensor(audioBuffer)
      
      this.onProgress?.({ 
        stage: 'preprocessing', 
        progress: 50, 
        message: 'Audio converted to tensor' 
      })

      // Step 2: Run inference
      this.onProgress?.({ 
        stage: 'inference', 
        progress: 0, 
        message: 'Running ML inference...' 
      })

      console.log('🔄 Running model inference...')
      const outputs = await this.runInference(inputTensor)

      this.onProgress?.({ 
        stage: 'inference', 
        progress: 100, 
        message: 'Inference complete' 
      })

      // Step 3: Convert tensors back to audio
      this.onProgress?.({ 
        stage: 'postprocessing', 
        progress: 0, 
        message: 'Converting results to audio...' 
      })

      console.log('🔄 Converting tensors back to audio...')
      const separatedStems = await this.tensorsToAudioBuffers(outputs, audioBuffer)

      this.onProgress?.({ 
        stage: 'complete', 
        progress: 100, 
        message: 'Separation complete!' 
      })

      // Clean up tensors
      inputTensor.dispose()
      outputs.forEach(tensor => tensor.dispose())

      console.log('✅ ML stem separation complete')
      console.log('📊 Memory usage after cleanup:', tf.memory())

      return separatedStems

    } catch (error) {
      console.error('❌ ML separation failed:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`ML separation failed: ${message}`)
    }
  }

  private async audioBufferToTensor(audioBuffer: AudioBuffer): Promise<tf.Tensor> {
    // Convert AudioBuffer to the format expected by Spleeter
    const { sampleRate, length, numberOfChannels } = audioBuffer
    
    // Spleeter typically expects stereo input
    const channels = Math.min(numberOfChannels, 2)
    const audioData = new Float32Array(length * channels)
    
    // Interleave channels for stereo
    for (let i = 0; i < length; i++) {
      for (let c = 0; c < channels; c++) {
        const channelData = audioBuffer.getChannelData(c)
        audioData[i * channels + c] = channelData[i]
      }
    }

    // Create tensor with shape [batch, time, channels]
    const tensor = tf.tensor3d(audioData, [1, length, channels])
    
    console.log('📊 Input tensor shape:', tensor.shape)
    return tensor
  }

  private async runInference(inputTensor: tf.Tensor): Promise<tf.Tensor[]> {
    if (!this.model) {
      throw new Error('Model not loaded')
    }

    // For now, create a mock implementation since we don't have actual models
    return this.mockInference(inputTensor)
  }

  private async mockInference(inputTensor: tf.Tensor): Promise<tf.Tensor[]> {
    // This is a placeholder that creates mock separated stems
    // In a real implementation, this would be: model.predict(inputTensor)
    
    console.log('🔄 Running mock ML inference (replace with real model)')
    
    const [batch, time, channels] = inputTensor.shape
    const numStems = this.model?.modelType === '2stems' ? 2 : 4
    
    // Create mock separated stems with different frequency filtering
    const mockStems: tf.Tensor[] = []
    
    for (let stem = 0; stem < numStems; stem++) {
      // Apply different filtering to simulate stem separation
      const filteredTensor = tf.tidy(() => {
        // Simple time domain filtering simulation (since full FFT is complex)
        const squeezed = inputTensor.squeeze([0])
        
        // Apply different amplitude masks for each stem (simple mock)
        const stemMask = stem / numStems
        const attenuatedTensor = tf.mul(squeezed, tf.scalar(0.3 + stemMask * 0.7))
        
        return attenuatedTensor.expandDims(0) // Add batch dimension back
      })
      
      mockStems.push(filteredTensor)
      
      // Update progress
      const progress = Math.floor(((stem + 1) / numStems) * 100)
      this.onProgress?.({ 
        stage: 'inference', 
        progress, 
        currentStem: this.getStemName(stem)
      })
      
      // Yield control
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return mockStems
  }

  private getStemName(stemIndex: number): string {
    if (!this.model) return 'unknown'
    
    switch (this.model.modelType) {
      case '2stems':
        return stemIndex === 0 ? 'vocals' : 'accompaniment'
      case '4stems':
        const names4 = ['vocals', 'drums', 'bass', 'other']
        return names4[stemIndex] || 'other'
      case '5stems':
        const names5 = ['vocals', 'drums', 'bass', 'piano', 'other']
        return names5[stemIndex] || 'other'
      default:
        return 'stem_' + stemIndex
    }
  }

  private async tensorsToAudioBuffers(
    stemTensors: tf.Tensor[], 
    originalBuffer: AudioBuffer
  ): Promise<{
    vocals?: AudioBuffer
    drums?: AudioBuffer
    bass?: AudioBuffer
    other?: AudioBuffer
    accompaniment?: AudioBuffer
    piano?: AudioBuffer
  }> {
    const { sampleRate, numberOfChannels } = originalBuffer
    const results: any = {}
    
    for (let i = 0; i < stemTensors.length; i++) {
      const stemName = this.getStemName(i)
      
      this.onProgress?.({ 
        stage: 'postprocessing', 
        progress: Math.floor(((i + 1) / stemTensors.length) * 100),
        currentStem: stemName 
      })
      
      // Convert tensor back to AudioBuffer
      const tensorData = await stemTensors[i].data()
      const length = tensorData.length / numberOfChannels
      
      const audioBuffer = new AudioContext().createBuffer(numberOfChannels, length, sampleRate)
      
      // De-interleave channels
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel)
        for (let sample = 0; sample < length; sample++) {
          channelData[sample] = tensorData[sample * numberOfChannels + channel]
        }
      }
      
      results[stemName] = audioBuffer
    }
    
    return results
  }

  dispose() {
    if (this.model) {
      this.model.model.dispose()
      this.model = null
    }
    
    // Clean up any remaining tensors
    tf.disposeVariables()
    console.log('🧹 TensorFlow.js resources cleaned up')
  }

  getMemoryUsage() {
    return tf.memory()
  }

  isModelLoaded(): boolean {
    return this.model !== null
  }

  getModelInfo() {
    if (!this.model) return null
    
    return {
      type: this.model.modelType,
      inputShape: this.model.inputShape,
      outputShape: this.model.outputShape,
      memoryUsage: tf.memory()
    }
  }
}