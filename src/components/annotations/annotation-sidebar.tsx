'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { getInstrumentWithEmoji, getInstrumentColor, COLOR_OPTIONS } from '@/lib/constants';

interface AnnotationSidebarProps {
  annotations: AnnotationWithDetails[];
  availableInstruments: string[];
  userInstruments: string[];
  currentTime: number;
  onSeekToTime: (time: number) => void;
  onAnnotationCreated: () => void;
  songId: string;
  customInstrumentColors?: Record<string, string>;
  onInstrumentColorChange?: (instrument: string, color: string) => void;
  selectedInstruments?: string[];
  onInstrumentFilterChange?: (instruments: string[]) => void;
  onScrollToAnnotation?: (scrollFunction: (timestamp: number) => void) => void;
}

export function AnnotationSidebar({
  annotations,
  availableInstruments,
  userInstruments,
  currentTime,
  onSeekToTime,
  onAnnotationCreated,
  songId,
  customInstrumentColors = {},
  onInstrumentColorChange,
  selectedInstruments: externalSelectedInstruments,
  onInstrumentFilterChange,
  onScrollToAnnotation
}: AnnotationSidebarProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [internalSelectedInstruments, setInternalSelectedInstruments] = useState<string[]>(availableInstruments);
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [colorPickerVisible, setColorPickerVisible] = useState<string | null>(null);
  
  const annotationsContainerRef = useRef<HTMLDivElement>(null);
  const annotationRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Use external state if provided, otherwise use internal state
  const selectedInstruments = externalSelectedInstruments || internalSelectedInstruments;
  const setSelectedInstruments = onInstrumentFilterChange || setInternalSelectedInstruments;

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerVisible && !(event.target as Element).closest('.color-picker-container')) {
        setColorPickerVisible(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [colorPickerVisible]);

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

  // Scroll to annotation function
  const scrollToAnnotationByTimestamp = useCallback((timestamp: number) => {
    console.log('Scrolling to annotation at timestamp:', timestamp);
    
    // Find the annotation closest to the timestamp
    if (filteredAnnotations.length === 0) {
      console.log('No filtered annotations available');
      return;
    }
    
    const targetAnnotation = filteredAnnotations.find(annotation => 
      Math.abs(annotation.timestamp - timestamp) < 2.5 // Within 2.5 seconds
    ) || filteredAnnotations.reduce((closest, annotation) => {
      const currentDiff = Math.abs(annotation.timestamp - timestamp);
      const closestDiff = Math.abs(closest.timestamp - timestamp);
      return currentDiff < closestDiff ? annotation : closest;
    });

    console.log('Target annotation found:', targetAnnotation?.id, 'at timestamp:', targetAnnotation?.timestamp);

    if (targetAnnotation) {
      const annotationElement = annotationRefs.current.get(targetAnnotation.id);
      const container = annotationsContainerRef.current;
      
      console.log('Annotation element:', annotationElement, 'Container:', container);
      
      if (annotationElement && container) {
        // Calculate the position to scroll to (top of container)
        const containerTop = container.getBoundingClientRect().top;
        const elementTop = annotationElement.getBoundingClientRect().top;
        const scrollTop = container.scrollTop + (elementTop - containerTop);
        
        console.log('Scrolling to position:', scrollTop);
        
        // Smooth scroll to the annotation
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [filteredAnnotations]);

  // Pass scroll function to parent
  useEffect(() => {
    if (onScrollToAnnotation) {
      onScrollToAnnotation(scrollToAnnotationByTimestamp);
    }
  }, [onScrollToAnnotation, scrollToAnnotationByTimestamp]);

  const toggleInstrument = (instrument: string) => {
    const newInstruments = selectedInstruments.includes(instrument)
      ? selectedInstruments.filter(i => i !== instrument)
      : [...selectedInstruments, instrument];
    setSelectedInstruments(newInstruments);
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
            {availableInstruments.map(instrument => {
              const color = getInstrumentColor(instrument, customInstrumentColors);
              const isSelected = selectedInstruments.includes(instrument);
              
              return (
                <button
                  key={instrument}
                  className={`text-xs px-2 py-1 rounded-md border transition-all hover:opacity-80 font-medium ${
                    isSelected 
                      ? 'text-white' 
                      : 'text-foreground bg-background'
                  }`}
                  style={isSelected ? { 
                    backgroundColor: color,
                    borderColor: color
                  } : {
                    borderColor: color,
                    color: color
                  }}
                  onClick={() => toggleInstrument(instrument)}
                >
                  {getInstrumentWithEmoji(instrument)}
                </button>
              );
            })}
          </div>
        </div>

      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4" ref={annotationsContainerRef}>
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
          <div className="space-y-3 pb-72">
            {filteredAnnotations.map(annotation => (
              <div 
                key={annotation.id} 
                className="border rounded-lg p-3 hover:bg-muted/50"
                ref={(el) => {
                  if (el) {
                    annotationRefs.current.set(annotation.id, el);
                  } else {
                    annotationRefs.current.delete(annotation.id);
                  }
                }}
              >
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
                    {annotation.instruments.map(instrument => {
                      const color = getInstrumentColor(instrument, customInstrumentColors);
                      const isColorPickerOpen = colorPickerVisible === instrument;
                      
                      return (
                        <div key={instrument} className="relative color-picker-container">
                          <button
                            className="text-xs px-2 py-1 rounded-md border transition-all hover:opacity-80 text-white font-medium"
                            style={{ 
                              backgroundColor: color,
                              borderColor: color
                            }}
                            onClick={() => {
                              if (onInstrumentColorChange) {
                                setColorPickerVisible(isColorPickerOpen ? null : instrument);
                              }
                            }}
                          >
                            {getInstrumentWithEmoji(instrument)}
                          </button>
                          
                          {/* Color Picker Popup */}
                          {isColorPickerOpen && onInstrumentColorChange && (
                            <div className="absolute top-full left-0 mt-1 bg-popover border rounded-md shadow-lg p-2 z-50">
                              <div className="grid grid-cols-6 gap-1">
                                {COLOR_OPTIONS.slice(0, 18).map(colorOption => (
                                  <button
                                    key={colorOption}
                                    className="w-6 h-6 rounded border border-background/20 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: colorOption }}
                                    onClick={() => {
                                      onInstrumentColorChange(instrument, colorOption);
                                      setColorPickerVisible(null);
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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