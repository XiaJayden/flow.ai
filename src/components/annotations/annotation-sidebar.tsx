'use client'

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { InstrumentAvatar } from '@/components/ui/instrument-avatar';
import { Plus, MessageSquare, Filter } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { AnnotationWithDetails } from '@/types';
import { CreateAnnotationForm } from './create-annotation-form';
import { CommentThread } from './comment-thread';
import { getInstrumentWithEmoji } from '@/lib/constants';

interface AnnotationSidebarProps {
  annotations: AnnotationWithDetails[];
  availableInstruments: string[];
  userInstruments: string[];
  currentTime: number;
  onSeekToTime: (time: number) => void;
  onAnnotationCreated: () => void;
  songId: string;
}

export function AnnotationSidebar({
  annotations,
  availableInstruments,
  userInstruments,
  currentTime,
  onSeekToTime,
  onAnnotationCreated,
  songId
}: AnnotationSidebarProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(availableInstruments);
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Filter annotations based on selected instruments and search
  const filteredAnnotations = useMemo(() => {
    return annotations
      .filter(annotation => {
        // Filter by instruments
        const hasMatchingInstrument = annotation.instruments.some(inst => 
          selectedInstruments.includes(inst)
        );
        
        // Filter by search query
        const matchesSearch = searchQuery === '' || 
          annotation.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          annotation.user.username.toLowerCase().includes(searchQuery.toLowerCase());
        
        return hasMatchingInstrument && matchesSearch;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [annotations, selectedInstruments, searchQuery]);

  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments(prev => 
      prev.includes(instrument)
        ? prev.filter(i => i !== instrument)
        : [...prev, instrument]
    );
  };

  const toggleAnnotationExpanded = (annotationId: string) => {
    setExpandedAnnotations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(annotationId)) {
        newSet.delete(annotationId);
      } else {
        newSet.add(annotationId);
      }
      return newSet;
    });
  };

  const handleCreateAnnotation = () => {
    setShowCreateForm(true);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Annotations</CardTitle>
          <Button size="sm" onClick={handleCreateAnnotation}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder="Search annotations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2"
        />

        {/* Instrument Filter */}
        <div className="space-y-2 mt-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by instrument:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableInstruments.map(instrument => (
              <Badge
                key={instrument}
                variant={selectedInstruments.includes(instrument) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => toggleInstrument(instrument)}
              >
                {getInstrumentWithEmoji(instrument)}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {showCreateForm && (
          <CreateAnnotationForm
            songId={songId}
            currentTime={currentTime}
            userInstruments={userInstruments}
            availableInstruments={availableInstruments}
            onSuccess={() => {
              setShowCreateForm(false);
              onAnnotationCreated();
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {filteredAnnotations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {annotations.length === 0 ? (
              <div>
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p>No annotations yet</p>
                <p className="text-sm">Add the first annotation to start discussing this song</p>
              </div>
            ) : (
              <div>
                <p>No annotations match your filters</p>
                <p className="text-sm">Try adjusting your instrument selection or search</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnnotations.map(annotation => (
              <div key={annotation.id} className="border rounded-lg p-3 hover:bg-muted/50">
                {/* Annotation Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <InstrumentAvatar
                      instruments={annotation.user.instruments}
                      fallbackText={annotation.user.username.charAt(0).toUpperCase()}
                      className="h-6 w-6"
                    />
                    <span className="text-sm font-medium">{annotation.user.username}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-primary hover:text-primary"
                      onClick={() => onSeekToTime(annotation.timestamp)}
                    >
                      {formatTime(annotation.timestamp)}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {annotation.instruments.map(instrument => (
                      <Badge key={instrument} variant="outline" className="text-xs">
                        {getInstrumentWithEmoji(instrument)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Annotation Content */}
                <p className="text-sm mb-2">{annotation.content}</p>

                {/* Comments Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(annotation.createdAt).toLocaleDateString()}
                  </span>
                  {annotation._count && annotation._count.comments > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => toggleAnnotationExpanded(annotation.id)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {annotation._count.comments} {annotation._count.comments === 1 ? 'reply' : 'replies'}
                    </Button>
                  )}
                </div>

                {/* Comment Thread */}
                {(expandedAnnotations.has(annotation.id) || annotation._count?.comments === 0) && (
                  <div className="mt-3 pt-3 border-t">
                    <CommentThread
                      annotationId={annotation.id}
                      comments={annotation.comments || []}
                      onCommentAdded={onAnnotationCreated}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}