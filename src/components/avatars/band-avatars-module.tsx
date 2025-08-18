'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstrumentAvatar } from "@/components/ui/instrument-avatar";
import { getInstrumentWithEmoji } from "@/lib/constants";

interface BandMember {
  id: string;
  user: {
    id: string;
    username: string;
    name: string | null;
    instruments: string[];
  };
}

interface BandAvatarsModuleProps {
  members: BandMember[];
}

export function BandAvatarsModule({ members }: BandAvatarsModuleProps) {
  const getUserInitials = (user: any) => {
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Band Members</CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Placeholder for future cartoon avatars */}
        <div className="text-center py-4 mb-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-dashed border-purple-200">
          <div className="text-4xl mb-2">🎵</div>
          <p className="text-sm text-muted-foreground">
            Cartoon avatars coming soon!
          </p>
        </div>

        {/* Current member grid */}
        <div className="grid grid-cols-2 gap-3">
          {members.map((member) => (
            <div key={member.id} className="text-center space-y-2">
              <InstrumentAvatar
                instruments={member.user.instruments}
                fallbackText={getUserInitials(member.user)}
                className="h-12 w-12 mx-auto"
              />
              
              <div className="space-y-1">
                <p className="text-xs font-medium leading-none truncate">
                  {member.user.name || member.user.username}
                </p>
                
                {member.user.instruments.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {member.user.instruments.slice(0, 2).map((instrument) => (
                      <Badge key={instrument} variant="outline" className="text-xs px-1 py-0">
                        {getInstrumentWithEmoji(instrument).split(' ')[0]} {/* Just the emoji */}
                      </Badge>
                    ))}
                    {member.user.instruments.length > 2 && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        +{member.user.instruments.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}