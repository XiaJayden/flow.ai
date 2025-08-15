'use client'

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Activity, MessageSquare, Music, Upload, User } from 'lucide-react';

interface Band {
  id: string;
  name: string;
  role: string;
  joinedAt: Date;
  _count?: {
    members: number;
    songs: number;
  };
}

interface BandActivityWidgetProps {
  bands: Band[];
}

// Dummy activity data - would come from API in real implementation
const dummyActivities = [
  {
    id: '1',
    type: 'annotation' as const,
    user: { name: 'Sarah Johnson', username: 'sarahj', avatar: null },
    action: 'added an annotation to',
    target: 'Bohemian Rhapsody',
    band: 'Jamberry',
    timestamp: '2 minutes ago',
    content: 'Need to work on the guitar solo timing here'
  },
  {
    id: '2',
    type: 'song' as const,
    user: { name: 'Mike Chen', username: 'mikec', avatar: null },
    action: 'added song',
    target: 'Still Into You',
    band: 'Paramore',
    timestamp: '1 hour ago',
    content: null
  },
  {
    id: '3',
    type: 'upload' as const,
    user: { name: 'Alex Rivera', username: 'alexr', avatar: null },
    action: 'uploaded bass recording for',
    target: 'Mr. Brightside',
    band: 'Jamberry',
    timestamp: '3 hours ago',
    content: 'Bass_MrBrightside_Take2.wav'
  },
  {
    id: '4',
    type: 'annotation' as const,
    user: { name: 'Emma Davis', username: 'emmad', avatar: null },
    action: 'commented on',
    target: 'Misery Business',
    band: 'Paramore',
    timestamp: '5 hours ago',
    content: 'The drums sound great in this section!'
  },
  {
    id: '5',
    type: 'song' as const,
    user: { name: 'Tom Wilson', username: 'tomw', avatar: null },
    action: 'added song',
    target: 'Sweet Child O Mine',
    band: 'Jamberry',
    timestamp: '1 day ago',
    content: null
  },
  {
    id: '6',
    type: 'upload' as const,
    user: { name: 'Lisa Park', username: 'lisap', avatar: null },
    action: 'uploaded vocal recording for',
    target: 'Still Into You',
    band: 'Paramore',
    timestamp: '2 days ago',
    content: 'Vocals_StillIntoYou_Final.wav'
  }
];

const activityIcons = {
  annotation: MessageSquare,
  song: Music,
  upload: Upload
};

const activityColors = {
  annotation: 'text-blue-500',
  song: 'text-green-500',
  upload: 'text-purple-500'
};

export function BandActivityWidget({ bands }: BandActivityWidgetProps) {
  const getUserInitials = (user: { name: string }) => {
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Band Activity</h3>
        </div>
        <Badge variant="secondary">{dummyActivities.length} recent</Badge>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {dummyActivities.map((activity) => {
          const Icon = activityIcons[activity.type];
          return (
            <div key={activity.id} className="flex space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={activity.user.avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {getUserInitials(activity.user)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <Icon className={`h-4 w-4 ${activityColors[activity.type]}`} />
                  <span className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>
                    {' '}{activity.action}{' '}
                    <span className="font-medium">{activity.target}</span>
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1">
                  <Badge variant="outline" className="text-xs">{activity.band}</Badge>
                  <span>{activity.timestamp}</span>
                </div>
                
                {activity.content && (
                  <div className="text-sm text-muted-foreground bg-muted/30 rounded p-2 mt-1">
                    {activity.type === 'upload' ? (
                      <div className="flex items-center space-x-1">
                        <Upload className="h-3 w-3" />
                        <span className="font-mono text-xs">{activity.content}</span>
                      </div>
                    ) : (
                      <span>"{activity.content}"</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {dummyActivities.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No recent activity
        </div>
      )}
    </Card>
  );
}