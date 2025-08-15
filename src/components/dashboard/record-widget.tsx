'use client'

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Settings, Play, Square, Clock } from 'lucide-react';

export function RecordWidget() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Mic className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold">Quick Record</h3>
        </div>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <div className="space-y-4">
        {/* Recording Controls Placeholder */}
        <div className="flex items-center justify-center space-x-3 py-8">
          <Button 
            variant="outline" 
            size="lg"
            className="rounded-full h-16 w-16 p-0 opacity-50 cursor-not-allowed"
            disabled
          >
            <Play className="h-6 w-6" />
          </Button>
          <Button 
            variant="destructive" 
            size="lg"
            className="rounded-full h-20 w-20 p-0 opacity-50 cursor-not-allowed"
            disabled
          >
            <Mic className="h-8 w-8" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="rounded-full h-16 w-16 p-0 opacity-50 cursor-not-allowed"
            disabled
          >
            <Square className="h-6 w-6" />
          </Button>
        </div>

        {/* Recording Info Placeholder */}
        <div className="space-y-2 text-center text-muted-foreground">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className="font-mono">00:00</span>
          </div>
          <p className="text-sm">Ready to record your practice session</p>
        </div>

        {/* Settings Button */}
        <div className="flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="opacity-50 cursor-not-allowed"
            disabled
          >
            <Settings className="h-4 w-4 mr-2" />
            Audio Settings
          </Button>
        </div>

        {/* Feature Preview */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg border-2 border-dashed">
          <div className="text-center space-y-2">
            <Mic className="h-6 w-6 mx-auto text-muted-foreground opacity-50" />
            <h4 className="text-sm font-medium">Recording Studio</h4>
            <p className="text-xs text-muted-foreground">
              Record practice sessions, individual parts, and collaborate with your band members in real-time.
            </p>
            <div className="flex flex-wrap justify-center gap-1 mt-3">
              <Badge variant="secondary" className="text-xs">Multi-track</Badge>
              <Badge variant="secondary" className="text-xs">Real-time</Badge>
              <Badge variant="secondary" className="text-xs">Cloud sync</Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}