'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, MessageSquare, Clock } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { AddSongModal } from './add-song-modal';

interface SongsListProps {
  bandId: string;
  songs: Array<{
    id: string;
    title: string;
    artist?: string | null;
    youtubeId: string;
    duration: number;
    thumbnail?: string | null;
    addedAt: Date;
    _count?: {
      annotations: number;
    };
  }>;
  canAddSongs: boolean;
  availableInstruments?: string[];
}

export function SongsList({ bandId, songs, canAddSongs, availableInstruments }: SongsListProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Songs ({songs.length})</CardTitle>
            {canAddSongs && (
              <Button onClick={() => setShowAddModal(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Song
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {songs.length === 0 ? (
            <div className="text-center py-8">
              <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No songs yet</h3>
              <p className="text-muted-foreground mb-4">
                Add YouTube videos to start practicing together
              </p>
              {canAddSongs && (
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Song
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {songs.map((song) => (
                <Link key={song.id} href={`/bands/${bandId}/songs/${song.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={song.thumbnail || '/placeholder-song.jpg'}
                            alt={song.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{song.title}</h4>
                          {song.artist && (
                            <p className="text-sm text-muted-foreground truncate">
                              {song.artist}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(song.duration)}
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {song._count?.annotations || 0} annotations
                            </div>
                            <span>
                              Added {new Date(song.addedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddSongModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        bandId={bandId}
        availableInstruments={availableInstruments}
      />
    </>
  );
}