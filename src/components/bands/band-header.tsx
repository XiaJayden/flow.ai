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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl">{band.name}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Created {new Date(band.createdAt).toLocaleDateString()}</span>
              <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                {userRole}
              </Badge>
            </div>
          </div>
          
          {userRole === 'admin' && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{band._count.members}</span>
            <span className="text-muted-foreground">members</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{band._count.songs}</span>
            <span className="text-muted-foreground">songs</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Join Code:</span>
            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
              {band.joinCode}
            </code>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={copyJoinCode}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            {copied && (
              <span className="text-xs text-green-600">Copied!</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}