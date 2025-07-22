'use client'

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/utils';
import { AnnotationWithDetails } from '@/types';
import { getInstrumentWithEmoji, getAnnotationColor } from '@/lib/constants';

interface AnnotationTimelineProps {
  annotations: AnnotationWithDetails[];
  duration: number;
  currentTime: number;
  selectedInstruments: string[];
  onSeekToTime: (time: number) => void;
  onTimelineClick: (time: number) => void;
  customInstrumentColors?: Record<string, string>;
  onMarkerClick?: ((timestamp: number) => void) | null;
}

export function AnnotationTimeline({
  annotations,
  duration,
  currentTime,
  selectedInstruments,
  onSeekToTime,
  onTimelineClick,
  customInstrumentColors,
  onMarkerClick
}: AnnotationTimelineProps) {
  // Filter annotations based on selected instruments
  const filteredAnnotations = useMemo(() => {
    return annotations.filter(annotation =>
      annotation.instruments.some(inst => selectedInstruments.includes(inst))
    );
  }, [annotations, selectedInstruments]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const clickTime = percent * duration;
    onTimelineClick(clickTime);
  };

  const getAnnotationPosition = (timestamp: number) => {
    if (duration === 0) return 0;
    return (timestamp / duration) * 100;
  };

  const getCurrentTimePosition = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  // Group annotations that are very close together to avoid overlap
  const groupedAnnotations = useMemo(() => {
    const sorted = [...filteredAnnotations].sort((a, b) => a.timestamp - b.timestamp);
    const groups: AnnotationWithDetails[][] = [];
    let currentGroup: AnnotationWithDetails[] = [];
    
    sorted.forEach((annotation, index) => {
      if (currentGroup.length === 0) {
        currentGroup = [annotation];
      } else {
        const lastAnnotation = currentGroup[currentGroup.length - 1];
        // Group annotations within 5 seconds of each other
        if (annotation.timestamp - lastAnnotation.timestamp < 5) {
          currentGroup.push(annotation);
        } else {
          groups.push(currentGroup);
          currentGroup = [annotation];
        }
      }
      
      if (index === sorted.length - 1) {
        groups.push(currentGroup);
      }
    });
    
    return groups;
  }, [filteredAnnotations]);

  return (
    <div className="space-y-4">

      {/* Timeline Container */}
      <div className="relative">
        {/* Timeline Track */}
        <div 
          className="relative h-12 bg-muted rounded-lg cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
        >
          {/* Progress Bar */}
          <div 
            className="absolute top-0 left-0 h-full bg-primary/20 transition-all duration-100"
            style={{ width: `${getCurrentTimePosition()}%` }}
          />

          {/* Current Time Indicator */}
          <div 
            className="absolute top-0 w-0.5 h-full bg-primary transition-all duration-100"
            style={{ left: `${getCurrentTimePosition()}%` }}
          />

          {/* Annotation Markers */}
          {groupedAnnotations.map((group, groupIndex) => {
            const primaryAnnotation = group[0];
            const position = getAnnotationPosition(primaryAnnotation.timestamp);
            const hasMultiple = group.length > 1;
            const annotationColor = getAnnotationColor(primaryAnnotation.instruments, customInstrumentColors);
            
            return (
              <div
                key={`group-${groupIndex}`}
                className="absolute top-1 transform -translate-x-1/2 cursor-pointer"
                style={{ left: `${position}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeekToTime(primaryAnnotation.timestamp);
                  // Also scroll to the annotation in the sidebar
                  if (onMarkerClick) {
                    onMarkerClick(primaryAnnotation.timestamp);
                  }
                }}
              >
                {/* Marker Dot */}
                <div 
                  className="w-3 h-3 rounded-full border-2 border-background hover:scale-125 transition-transform"
                  style={{ 
                    backgroundColor: annotationColor,
                    boxShadow: hasMultiple ? `0 0 0 1px ${annotationColor}, 0 0 0 3px rgba(255,165,0,0.3)` : undefined
                  }}
                />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-popover border rounded-md shadow-md p-2 text-xs whitespace-nowrap max-w-48">
                    <div className="font-medium">{formatTime(primaryAnnotation.timestamp)}</div>
                    <div className="text-muted-foreground truncate">
                      {primaryAnnotation.content.substring(0, 50)}
                      {primaryAnnotation.content.length > 50 ? '...' : ''}
                    </div>
                    {hasMultiple && (
                      <div className="text-orange-600 font-medium">
                        +{group.length - 1} more
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {primaryAnnotation.instruments.slice(0, 3).map(instrument => (
                        <Badge key={instrument} variant="outline" className="text-xs px-1 py-0">
                          {getInstrumentWithEmoji(instrument)}
                        </Badge>
                      ))}
                      {primaryAnnotation.instruments.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{primaryAnnotation.instruments.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0:00</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 text-xs">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTimelineClick(0)}
          className="h-7 px-2"
        >
          Start
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTimelineClick(currentTime)}
          className="h-7 px-2"
        >
          Add at {formatTime(currentTime)}
        </Button>
        {filteredAnnotations.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSeekToTime(filteredAnnotations[0].timestamp)}
            className="h-7 px-2"
          >
            First Annotation
          </Button>
        )}
      </div>
    </div>
  );
}