'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { SongsList } from './songs-list';
import { CreateSetlistModal } from '@/components/setlists/create-setlist-modal';
import { AddSongModal } from './add-song-modal';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Setlist {
  id: string;
  name: string;
  songCount: number;
}

interface SongModuleProps {
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
  setlists: Setlist[];
  canAddSongs: boolean;
  availableInstruments?: string[];
}

export function SongModule({ 
  bandId, 
  songs, 
  setlists, 
  canAddSongs, 
  availableInstruments 
}: SongModuleProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateSetlistModal, setShowCreateSetlistModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [setlistSongs, setSetlistSongs] = useState<Record<string, any[]>>({});
  const [localSetlists, setLocalSetlists] = useState(setlists);

  // Fetch songs for a specific setlist
  const fetchSetlistSongs = async (setlistId: string) => {
    try {
      const response = await fetch(`/api/bands/${bandId}/setlists/${setlistId}/songs`);
      if (response.ok) {
        const songs = await response.json();
        setSetlistSongs(prev => ({ ...prev, [setlistId]: songs }));
      }
    } catch (error) {
      console.error('Error fetching setlist songs:', error);
    }
  };

  // Fetch setlist songs when tab changes
  useEffect(() => {
    if (activeTab !== "all" && !setlistSongs[activeTab]) {
      fetchSetlistSongs(activeTab);
    }
  }, [activeTab, bandId]);

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // If dropped in the same location, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Only handle drops from "all" to setlists
    if (source.droppableId === "all" && destination.droppableId !== "all") {
      const songId = draggableId;
      const setlistId = destination.droppableId;

      try {
        const response = await fetch(`/api/bands/${bandId}/setlists/${setlistId}/songs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ songId }),
        });

        if (response.ok) {
          // Refresh the setlist songs
          await fetchSetlistSongs(setlistId);
        } else {
          const data = await response.json();
          console.error('Error adding song to setlist:', data.error);
        }
      } catch (error) {
        console.error('Error adding song to setlist:', error);
      }
    }
  };

  // Filter songs based on active tab
  const getFilteredSongs = () => {
    if (activeTab === "all") {
      return songs;
    }
    return setlistSongs[activeTab] || [];
  };

  const filteredSongs = getFilteredSongs();

  const handleSetlistCreated = (newSetlist: Setlist) => {
    setLocalSetlists(prev => [...prev, newSetlist]);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Card className="h-full">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-6 pt-6 pb-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-x-auto">
                    <TabsList className="flex h-auto p-0 bg-transparent">
                      <TabsTrigger 
                        value="all" 
                        className="data-[state=active]:bg-muted rounded-md px-6 py-3 whitespace-nowrap"
                      >
                        All Songs ({songs.length})
                      </TabsTrigger>
                      
                      {localSetlists.map((setlist) => (
                        <TabsTrigger 
                          key={setlist.id}
                          value={setlist.id}
                          className="data-[state=active]:bg-muted rounded-md px-6 py-3 whitespace-nowrap"
                        >
                          {setlist.name} ({setlist.songCount})
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-10 w-10 p-0 flex-shrink-0"
                      onClick={() => setShowCreateSetlistModal(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {canAddSongs && (
                    <Button 
                      onClick={() => setShowAddModal(true)} 
                      size="sm"
                      className="flex-shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Song
                    </Button>
                  )}
                </div>
              </div>

              <TabsContent value="all" className="m-0 p-6">
                <Droppable droppableId="all">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      <SongsList 
                        bandId={bandId}
                        songs={filteredSongs}
                        canAddSongs={false}
                        availableInstruments={availableInstruments}
                        currentView="all"
                        isDragContext={true}
                      />
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </TabsContent>

              {localSetlists.map((setlist) => (
                <TabsContent key={setlist.id} value={setlist.id} className="m-0 p-6">
                  <Droppable droppableId={setlist.id}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className={`min-h-32 ${snapshot.isDraggingOver ? 'bg-muted/50 rounded-lg' : ''}`}
                      >
                        <SongsList 
                          bandId={bandId}
                          songs={filteredSongs}
                          canAddSongs={false}
                          availableInstruments={availableInstruments}
                          currentView="setlist"
                          setlistId={setlist.id}
                          setlistName={setlist.name}
                          isDragContext={true}
                        />
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </DragDropContext>

      <CreateSetlistModal
        open={showCreateSetlistModal}
        onOpenChange={setShowCreateSetlistModal}
        bandId={bandId}
        onSetlistCreated={handleSetlistCreated}
      />

      <AddSongModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        bandId={bandId}
        availableInstruments={availableInstruments}
      />
    </>
  );
}