import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateJoinCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase()
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function parseInstruments(instrumentsString: string): string[] {
  try {
    return JSON.parse(instrumentsString)
  } catch {
    return []
  }
}

export function stringifyInstruments(instruments: string[]): string {
  return JSON.stringify(instruments)
}