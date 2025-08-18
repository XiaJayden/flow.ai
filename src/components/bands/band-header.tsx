'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Settings, Users, Music } from "lucide-react";

interface BandHeaderProps {
  band: {
    id: string;
    name: string;
    joinCode: string;
    createdAt: Date;
    _count: {
      members: number;
      songs: number;
    };
  };
  userRole: string;
}

export function BandHeader({ band, userRole }: BandHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyJoinCode = async () => {
    await navigator.clipboard.writeText(band.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-r from-red-200 to-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-3xl text-slate-900 pl-1">{band.name}</CardTitle>
          
          <div className="flex items-center justify-center flex-1 mx-4 relative" style={{ gap: '9rem', top: '8px' }}>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-600" />
              <span className="font-medium text-slate-800">{band._count.members}</span>
              <span className="text-slate-600 text-sm">members</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-slate-600" />
              <span className="font-medium text-slate-800">{band._count.songs}</span>
              <span className="text-slate-600 text-sm">songs</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Join Code:</span>
              <code className="bg-slate-700 px-2 py-1 rounded text-sm font-mono text-white">
                {band.joinCode}
              </code>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={copyJoinCode}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
              {copied && (
                <span className="text-xs text-green-600">Copied!</span>
              )}
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="relative" style={{ top: '6px' }}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mt-2 text-sm text-slate-500 pl-1">
          Created {new Date(band.createdAt).toLocaleDateString()}
        </div>
      </CardHeader>
    </Card>
  );
}