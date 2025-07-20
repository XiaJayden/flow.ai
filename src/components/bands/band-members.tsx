import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface BandMembersProps {
  members: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      username: string;
      name?: string;
      instruments: string[];
    };
  }>;
  userRole: string;
  bandId: string;
}

export function BandMembers({ members, userRole, bandId }: BandMembersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {(member.user.name || member.user.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">
                  {member.user.name || member.user.username}
                </p>
                <Badge 
                  variant={member.role === 'admin' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {member.role}
                </Badge>
              </div>
              
              {member.user.instruments.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {member.user.instruments.map((instrument) => (
                    <Badge key={instrument} variant="outline" className="text-xs">
                      {instrument}
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-1">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}