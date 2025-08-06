'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, FileAudio, ExternalLink, X } from 'lucide-react'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  onYouTubeUrl: (url: string) => void
  isLoading?: boolean
}

export function FileUpload({ onFileUpload, onYouTubeUrl, isLoading = false }: FileUploadProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (isAudioFile(file)) {
        onFileUpload(file)
      } else {
        alert('Please upload an audio file (MP3, WAV, M4A, OGG)')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (isAudioFile(file)) {
        onFileUpload(file)
      } else {
        alert('Please upload an audio file (MP3, WAV, M4A, OGG)')
      }
    }
  }

  const isAudioFile = (file: File) => {
    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm']
    return audioTypes.includes(file.type) || 
           file.name.toLowerCase().match(/\.(mp3|wav|m4a|ogg|webm)$/)
  }

  const handleYouTubeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (youtubeUrl.trim()) {
      onYouTubeUrl(youtubeUrl.trim())
      setYoutubeUrl('')
    }
  }

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/
    return youtubeRegex.test(url)
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FileAudio className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Audio File</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop an audio file here, or click to browse
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Supported formats: MP3, WAV, M4A, OGG, WebM
          </p>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload className="mr-2 h-4 w-4" />
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">OR</span>
          </div>
        </div>

        {/* YouTube URL Input */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <ExternalLink className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Add YouTube Video</h3>
          </div>
          <form onSubmit={handleYouTubeSubmit} className="space-y-3">
            <div className="flex space-x-2">
              <Input
                type="url"
                placeholder="Paste YouTube URL here..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              {youtubeUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setYoutubeUrl('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!youtubeUrl.trim() || !isValidYouTubeUrl(youtubeUrl) || isLoading}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Load YouTube Video
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Video audio will be extracted and processed for stem separation
          </p>
        </div>
      </div>
    </Card>
  )
}