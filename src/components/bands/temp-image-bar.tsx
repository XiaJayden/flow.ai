'use client'

import Image from 'next/image'
import { useState } from 'react'

interface TempImageBarProps {
  className?: string
}

const instruments = [
  {
    name: 'Drummer',
    src: '/drummer.png',
    alt: 'Drummer'
  },
  {
    name: 'Electric Guitar',
    src: '/electricguitar.png',
    alt: 'Electric Guitar'
  },
  {
    name: 'Guitarist',
    src: '/guitarist.png', 
    alt: 'Guitarist'
  },
  {
    name: 'Singer',
    src: '/singer.png',
    alt: 'Singer'
  }
]

export function TempImageBar({ className = '' }: TempImageBarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className={`h-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-3 border border-border/50 ${className}`}>
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center justify-between gap-1 w-full">
          {instruments.map((instrument, index) => (
            <div
              key={instrument.name}
              className="relative flex justify-center"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div 
                className={`
                  relative transition-all duration-300 ease-out cursor-pointer
                  ${hoveredIndex === index ? 'transform scale-125 -translate-y-1' : 'transform scale-100'}
                  ${hoveredIndex !== null && hoveredIndex !== index ? 'opacity-60' : 'opacity-100'}
                `}
              >
                <div className={`
                  absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-sm transition-opacity duration-300
                  ${hoveredIndex === index ? 'opacity-70' : 'opacity-0'}
                `} />
                
                <Image
                  src={instrument.src}
                  alt={instrument.alt}
                  width={60}
                  height={60}
                  className="w-16 h-16 object-contain"
                />
                
                {/* Tooltip */}
                <div className={`
                  absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                  bg-popover border rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap
                  transition-all duration-200 shadow-md z-10
                  ${hoveredIndex === index 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-1 pointer-events-none'
                  }
                `}>
                  {instrument.name}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-popover border-l border-t rotate-45" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}