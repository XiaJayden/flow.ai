'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface InstrumentAvatarProps {
  src?: string | null
  alt?: string
  instruments?: string[]
  fallbackText?: string
  className?: string
}

// Simple SVG instrument icons as data URIs
const instrumentIcons: Record<string, string> = {
  Guitar: `data:image/svg+xml,${encodeURIComponent(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#8B4513"/>
      <ellipse cx="50" cy="50" rx="25" ry="35" fill="#DEB887" stroke="#8B4513" stroke-width="2"/>
      <circle cx="50" cy="50" r="8" fill="#654321"/>
      <line x1="50" y1="15" x2="50" y2="85" stroke="#654321" stroke-width="1"/>
      <rect x="48" y="10" width="4" height="20" fill="#654321"/>
      <rect x="46" y="8" width="8" height="4" fill="#654321"/>
    </svg>
  `)}`,
  
  Bass: `data:image/svg+xml,${encodeURIComponent(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#4A4A4A"/>
      <ellipse cx="50" cy="50" rx="28" ry="38" fill="#696969" stroke="#2F2F2F" stroke-width="2"/>
      <circle cx="50" cy="50" r="10" fill="#2F2F2F"/>
      <line x1="50" y1="12" x2="50" y2="88" stroke="#2F2F2F" stroke-width="2"/>
      <rect x="47" y="8" width="6" height="18" fill="#2F2F2F"/>
      <rect x="44" y="6" width="12" height="6" fill="#2F2F2F"/>
    </svg>
  `)}`,
  
  Drums: `data:image/svg+xml,${encodeURIComponent(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#B22222"/>
      <ellipse cx="50" cy="45" rx="30" ry="25" fill="#DC143C" stroke="#8B0000" stroke-width="2"/>
      <ellipse cx="50" cy="55" rx="30" ry="8" fill="#8B0000"/>
      <line x1="25" y1="30" x2="35" y2="20" stroke="#654321" stroke-width="3"/>
      <line x1="75" y1="30" x2="65" y2="20" stroke="#654321" stroke-width="3"/>
      <circle cx="35" cy="18" r="4" fill="#F5F5DC"/>
      <circle cx="65" cy="18" r="4" fill="#F5F5DC"/>
    </svg>
  `)}`,
  
  Vocals: `data:image/svg+xml,${encodeURIComponent(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#4169E1"/>
      <rect x="35" y="20" width="30" height="40" rx="15" fill="#6495ED" stroke="#191970" stroke-width="2"/>
      <rect x="40" y="60" width="20" height="15" fill="#191970"/>
      <circle cx="45" cy="35" r="3" fill="#FFD700"/>
      <circle cx="55" cy="35" r="3" fill="#FFD700"/>
      <rect x="43" y="40" width="14" height="8" rx="7" fill="#FFD700"/>
      <line x1="50" y1="75" x2="50" y2="85" stroke="#191970" stroke-width="3"/>
    </svg>
  `)}`,
  
  Piano: `data:image/svg+xml,${encodeURIComponent(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#2F4F4F"/>
      <rect x="25" y="35" width="50" height="30" rx="3" fill="#F8F8FF" stroke="#000" stroke-width="1"/>
      <rect x="30" y="35" width="6" height="18" fill="#000"/>
      <rect x="38" y="35" width="6" height="18" fill="#000"/>
      <rect x="46" y="35" width="6" height="18" fill="#000"/>
      <rect x="54" y="35" width="6" height="18" fill="#000"/>
      <rect x="62" y="35" width="6" height="18" fill="#000"/>
      <line x1="32" y1="53" x2="32" y2="65" stroke="#DDD" stroke-width="1"/>
      <line x1="39" y1="53" x2="39" y2="65" stroke="#DDD" stroke-width="1"/>
      <line x1="46" y1="53" x2="46" y2="65" stroke="#DDD" stroke-width="1"/>
      <line x1="54" y1="53" x2="54" y2="65" stroke="#DDD" stroke-width="1"/>
      <line x1="61" y1="53" x2="61" y2="65" stroke="#DDD" stroke-width="1"/>
      <line x1="68" y1="53" x2="68" y2="65" stroke="#DDD" stroke-width="1"/>
    </svg>
  `)}`,
  
  Keyboard: `data:image/svg+xml,${encodeURIComponent(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#483D8B"/>
      <rect x="20" y="40" width="60" height="20" rx="3" fill="#F0F0F0" stroke="#000" stroke-width="1"/>
      <rect x="25" y="40" width="4" height="12" fill="#000"/>
      <rect x="31" y="40" width="4" height="12" fill="#000"/>
      <rect x="37" y="40" width="4" height="12" fill="#000"/>
      <rect x="43" y="40" width="4" height="12" fill="#000"/>
      <rect x="49" y="40" width="4" height="12" fill="#000"/>
      <rect x="55" y="40" width="4" height="12" fill="#000"/>
      <rect x="61" y="40" width="4" height="12" fill="#000"/>
      <rect x="67" y="40" width="4" height="12" fill="#000"/>
      <rect x="73" y="40" width="4" height="12" fill="#000"/>
      <rect x="20" y="25" width="60" height="10" rx="2" fill="#696969"/>
      <circle cx="35" cy="30" r="2" fill="#FFD700"/>
      <circle cx="50" cy="30" r="2" fill="#FFD700"/>
      <circle cx="65" cy="30" r="2" fill="#FFD700"/>
    </svg>
  `)}`,
  
  Violin: `data:image/svg+xml,${encodeURIComponent(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#8B4513"/>
      <ellipse cx="50" cy="60" rx="15" ry="25" fill="#D2691E" stroke="#654321" stroke-width="2"/>
      <ellipse cx="50" cy="40" rx="12" ry="20" fill="#D2691E" stroke="#654321" stroke-width="2"/>
      <rect x="49" y="15" width="2" height="30" fill="#654321"/>
      <rect x="47" y="12" width="6" height="8" fill="#654321"/>
      <path d="M 42 55 Q 45 50 42 45" stroke="#654321" stroke-width="2" fill="none"/>
      <path d="M 58 55 Q 55 50 58 45" stroke="#654321" stroke-width="2" fill="none"/>
      <line x1="45" y1="45" x2="55" y2="45" stroke="#000" stroke-width="0.5"/>
      <line x1="45" y1="50" x2="55" y2="50" stroke="#000" stroke-width="0.5"/>
      <line x1="45" y1="55" x2="55" y2="55" stroke="#000" stroke-width="0.5"/>
      <line x1="45" y1="60" x2="55" y2="60" stroke="#000" stroke-width="0.5"/>
    </svg>
  `)}`,
  
  Saxophone: `data:image/svg+xml,${encodeURIComponent(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#FFD700"/>
      <path d="M 45 20 Q 35 25 30 40 Q 25 60 35 75 Q 45 85 60 80 Q 70 75 65 60" stroke="#B8860B" stroke-width="4" fill="#FFA500"/>
      <circle cx="40" cy="35" r="3" fill="#8B4513"/>
      <circle cx="35" cy="45" r="3" fill="#8B4513"/>
      <circle cx="38" cy="55" r="3" fill="#8B4513"/>
      <circle cx="45" cy="65" r="3" fill="#8B4513"/>
      <circle cx="55" cy="70" r="3" fill="#8B4513"/>
      <rect x="44" y="15" width="6" height="10" rx="3" fill="#B8860B"/>
      <rect x="46" y="10" width="2" height="8" fill="#654321"/>
      <ellipse cx="65" cy="75" rx="8" ry="6" fill="#B8860B" stroke="#8B4513" stroke-width="1"/>
    </svg>
  `)}`,
  
  Trumpet: `data:image/svg+xml,${encodeURIComponent(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#DAA520"/>
      <ellipse cx="35" cy="50" rx="8" ry="12" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
      <rect x="43" y="47" width="35" height="6" fill="#FFD700" stroke="#B8860B" stroke-width="1"/>
      <ellipse cx="78" cy="50" rx="6" ry="8" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
      <rect x="50" y="45" width="3" height="10" fill="#B8860B"/>
      <rect x="58" y="45" width="3" height="10" fill="#B8860B"/>
      <rect x="66" y="45" width="3" height="10" fill="#B8860B"/>
      <circle cx="52" cy="42" r="2" fill="#8B4513"/>
      <circle cx="60" cy="42" r="2" fill="#8B4513"/>
      <circle cx="68" cy="42" r="2" fill="#8B4513"/>
    </svg>
  `)}`,
  
  Other: `data:image/svg+xml,${encodeURIComponent(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#9370DB"/>
      <circle cx="50" cy="50" r="25" fill="#BA55D3" stroke="#663399" stroke-width="2"/>
      <path d="M 35 35 L 65 65 M 65 35 L 35 65" stroke="#663399" stroke-width="3" stroke-linecap="round"/>
      <circle cx="35" cy="35" r="6" fill="#FFD700"/>
      <circle cx="65" cy="35" r="6" fill="#FFD700"/>
      <circle cx="35" cy="65" r="6" fill="#FFD700"/>
      <circle cx="65" cy="65" r="6" fill="#FFD700"/>
      <circle cx="50" cy="50" r="8" fill="#663399"/>
      <text x="50" y="55" text-anchor="middle" fill="#FFF" font-size="12" font-family="Arial">♪</text>
    </svg>
  `)}`,
}

const getInstrumentIcon = (instruments: string[]): string => {
  // Priority order for instrument selection
  const priority = ['Guitar', 'Bass', 'Drums', 'Vocals', 'Piano', 'Keyboard', 'Violin', 'Saxophone', 'Trumpet']
  
  for (const instrument of priority) {
    if (instruments.includes(instrument)) {
      return instrumentIcons[instrument] || instrumentIcons.Other
    }
  }
  
  // Check for any instrument that exists in our icons
  for (const instrument of instruments) {
    if (instrumentIcons[instrument]) {
      return instrumentIcons[instrument]
    }
  }
  
  return instrumentIcons.Other
}

export function InstrumentAvatar({ 
  src, 
  alt, 
  instruments = [], 
  fallbackText,
  className 
}: InstrumentAvatarProps) {
  // If we have a profile image, use it
  if (src) {
    return (
      <Avatar className={className}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback>
          {instruments.length > 0 ? (
            <img 
              src={getInstrumentIcon(instruments)} 
              alt={`${instruments[0]} icon`}
              className="h-full w-full object-cover"
            />
          ) : (
            fallbackText || 'U'
          )}
        </AvatarFallback>
      </Avatar>
    )
  }

  // Use instrument icon as default
  if (instruments.length > 0) {
    return (
      <Avatar className={className}>
        <AvatarImage 
          src={getInstrumentIcon(instruments)} 
          alt={`${instruments[0]} icon`}
        />
        <AvatarFallback>
          {fallbackText || instruments[0]?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
    )
  }

  // Final fallback to text
  return (
    <Avatar className={className}>
      <AvatarFallback>
        {fallbackText || 'U'}
      </AvatarFallback>
    </Avatar>
  )
}