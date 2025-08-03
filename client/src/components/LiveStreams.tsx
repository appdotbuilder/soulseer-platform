
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Play, Users, Eye, Gift, Heart } from 'lucide-react';
import type { LiveStream } from '../../../server/src/schema';

// Extended type for display purposes
interface LiveStreamWithReader extends LiveStream {
  reader_name: string;
  reader_avatar?: string;
}

export function LiveStreams() {
  const [streams, setStreams] = useState<LiveStreamWithReader[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and then show demo data
    const timer = setTimeout(() => {
      setStreams([
        {
          id: '1',
          reader_id: 'reader-1',
          reader_name: 'Luna Starweaver',
          reader_avatar: undefined,
          title: '🌙 Full Moon Tarot Reading & Q&A',
          description: 'Join me for a special full moon tarot session. Bringing clarity to your path with ancient wisdom.',
          status: 'live' as const,
          viewer_count: 142,
          scheduled_at: null,
          started_at: new Date('2024-01-15T20:00:00Z'),
          ended_at: null,
          created_at: new Date('2024-01-15T19:45:00Z')
        },
        {
          id: '2',
          reader_id: 'reader-2',
          reader_name: 'Mystic Rose',
          reader_avatar: undefined,
          title: '✨ Crystal Healing Energy Session',
          description: 'Experience the healing power of crystals in this interactive session. Ask questions and receive guidance.',
          status: 'live' as const,
          viewer_count: 89,
          scheduled_at: null,
          started_at: new Date('2024-01-15T20:30:00Z'),
          ended_at: null,
          created_at: new Date('2024-01-15T20:15:00Z')
        },
        {
          id: '3',
          reader_id: 'reader-3',
          reader_name: 'Oracle Phoenix',
          reader_avatar: undefined,
          title: '🔮 Past Life Regression Journey',
          description: 'Discover your soul\'s journey through time. A guided meditation to unlock past life memories.',
          status: 'live' as const,
          viewer_count: 67,
          scheduled_at: null,
          started_at: new Date('2024-01-15T21:00:00Z'),
          ended_at: null,
          created_at: new Date('2024-01-15T20:45:00Z')
        }
      ] as LiveStreamWithReader[]);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleJoinStream = (streamId: string) => {
    // Demo implementation - show alert instead of actual stream joining
    alert(`Demo: Joining stream ${streamId}`);
  };

  const formatViewerCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getStreamDuration = (startedAt: Date): string => {
    const now = new Date();
    const duration = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));
    if (duration < 60) {
      return `${duration}m`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <section className="py-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-pink-400">
          Live Streams
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mystical-card animate-pulse">
              <div className="aspect-video bg-gray-700 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-700 rounded w-16"></div>
                    <div className="h-6 bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-pink-400">Live Streams</h2>
        <Badge variant="secondary" className="bg-red-600/20 text-red-400 border-red-400/30">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
          {streams.length} Live Now
        </Badge>
      </div>
      
      {streams.length === 0 ? (
        <div className="text-center py-12">
          <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-400 mb-2">No live streams right now</p>
          <p className="text-gray-500">Check back soon for live psychic sessions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream: LiveStreamWithReader) => (
            <Card key={stream.id} className="mystical-card overflow-hidden hover:scale-105 transition-transform duration-200">
              {/* Stream Thumbnail/Preview */}
              <div className="relative aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20"></div>
                <Play className="w-16 h-16 text-white/80 relative z-10" />
                
                {/* Live Badge */}
                <Badge className="absolute top-2 left-2 bg-red-600 text-white border-none">
                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                  LIVE
                </Badge>
                
                {/* Viewer Count */}
                <Badge variant="secondary" className="absolute top-2 right-2 bg-black/50 text-white border-none">
                  <Eye className="w-3 h-3 mr-1" />
                  {formatViewerCount(stream.viewer_count)}
                </Badge>
                
                {/* Duration */}
                {stream.started_at && (
                  <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/50 text-white border-none">
                    {getStreamDuration(stream.started_at)}
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-4">
                {/* Reader Info */}
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="w-10 h-10 border-2 border-pink-400/50">
                    <AvatarImage src={stream.reader_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.reader_name}`} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-600 to-purple-600 text-white text-sm">
                      {stream.reader_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-pink-400 truncate">
                      {stream.reader_name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>{formatViewerCount(stream.viewer_count)} viewers</span>
                    </div>
                  </div>
                </div>
                
                {/* Stream Title */}
                <h3 className="font-semibold text-white mb-2 line-clamp-2">
                  {stream.title}
                </h3>
                
                {/* Stream Description */}
                {stream.description && (
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {stream.description}
                  </p>
                )}
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button 
                    className="flex-1 mystical-button" 
                    size="sm"
                    onClick={() => handleJoinStream(stream.id)}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Join Stream
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-pink-400/50 text-pink-400 hover:bg-pink-400/10"
                    onClick={() => alert('Demo: Send gift feature')}
                  >
                    <Gift className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-red-400/50 text-red-400 hover:bg-red-400/10"
                    onClick={() => alert('Demo: Like stream feature')}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* View All Streams Button */}
      {streams.length > 0 && (
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            className="border-pink-400/50 text-pink-400 hover:bg-pink-400/10"
            onClick={() => alert('Demo: View all streams feature')}
          >
            View All Live Streams
          </Button>
        </div>
      )}
    </section>
  );
}
