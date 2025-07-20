import { User, Band, BandMember, Song, Annotation, Comment } from '@prisma/client'

export interface UserWithInstruments extends Omit<User, 'instruments'> {
  instruments: string[]
}

export interface BandWithMembers extends Band {
  members: (BandMember & {
    user: UserWithInstruments
  })[]
  _count?: {
    members: number
    songs: number
  }
}

export interface SongWithDetails extends Song {
  band: Band
  annotations: AnnotationWithDetails[]
  _count?: {
    annotations: number
  }
}

export interface AnnotationWithDetails extends Omit<Annotation, 'instruments'> {
  instruments: string[]
  user: UserWithInstruments
  comments: CommentWithUser[]
  _count?: {
    comments: number
  }
}

export interface CommentWithUser extends Comment {
  user: UserWithInstruments
}

export interface BandPermissions {
  canView: boolean
  canEdit: boolean
  canInvite: boolean
  canManageMembers: boolean
  isAdmin: boolean
}

export interface CreateBandData {
  name: string
}

export interface JoinBandData {
  joinCode: string
}

export interface AddSongData {
  youtubeUrl: string
}

export interface CreateAnnotationData {
  timestamp: number
  content: string
  instruments: string[]
}

export interface CreateCommentData {
  content: string
}

export interface YouTubePlayerState {
  playing: boolean
  currentTime: number
  duration: number
  ready: boolean
}

// Next-auth module augmentation
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      name?: string
    }
  }

  interface User {
    username: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username: string
  }
}