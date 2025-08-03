
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageCircle, Phone, Video, Clock } from 'lucide-react';
import type { ReaderProfile } from '../../../server/src/schema';

export function OnlineReaders() {
  const [readers, setReaders] = useState<ReaderProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and then show demo data
    const timer = setTimeout(() => {
      setReaders([
        {
          id: '1',
          user_id: 'reader-1',
          display_name: 'Luna Starweaver',
          bio: 'Tarot reader with 15+ years of experience in love and career guidance',
          specialties: ['Tarot', 'Love & Relationships', 'Career'],
          years_experience: 15,
          rating: 4.9,
          total_reviews: 1247,
          is_online: true,
          is_available: true,
          chat_rate_per_minute: 3.99,
          phone_rate_per_minute: 4.99,
          video_rate_per_minute: 6.99,
          total_earnings: 15420.50,
          pending_payout: 234.75,
          created_at: new Date('2023-01-15'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: '2',
          user_id: 'reader-2',
          display_name: 'Mystic Rose',
          bio: 'Clairvoyant and crystal healer specializing in spiritual awakening',
          specialties: ['Clairvoyance', 'Crystal Healing', 'Spiritual Guidance'],
          years_experience: 8,
          rating: 4.7,
          total_reviews: 892,
          is_online: true,
          is_available: true,
          chat_rate_per_minute: 2.99,
          phone_rate_per_minute: 3.99,
          video_rate_per_minute: 5.99,
          total_earnings: 8750.25,
          pending_payout: 156.80,
          created_at: new Date('2023-06-20'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: '3',
          user_id: 'reader-3',
          display_name: 'Oracle Phoenix',
          bio: 'Spiritual guide and medium connecting you with divine wisdom and ancestral messages',
          specialties: ['Mediumship', 'Spirit Guides', 'Past Lives'],
          years_experience: 12,
          rating: 4.8,
          total_reviews: 634,
          is_online: true,
          is_available: true,
          chat_rate_per_minute: 4.49,
          phone_rate_per_minute: 5.99,
          video_rate_per_minute: 7.99,
          total_earnings: 12340.75,
          pending_payout: 189.50,
          created_at: new Date('2023-03-10'),
          updated_at: new Date('2024-01-15')
        }
      ] as ReaderProfile[]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleStartReading = (readerId: string, sessionType: 'chat' | 'phone' | 'video') => {
    // Demo implementation - show alert instead of actual session creation
    alert(`Demo: Starting ${sessionType} session with reader ${readerId}`);
  };

  if (isLoading) {
    return (
      <section className="py-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-pink-400">
          Available Psychics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mystical-card animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-32"></div>
                    <div className="h-3 bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4"></div>
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
      <h2 className="text-3xl font-bold text-center mb-8 text-pink-400">
        Available Psychics
      </h2>
      
      {readers.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-400 mb-2">No psychics are currently online</p>
          <p className="text-gray-500">Check back soon for available readers</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readers.map((reader: ReaderProfile) => (
            <Card key={reader.id} className="mystical-card hover:scale-105 transition-transform duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-pink-400/50">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reader.display_name}`} />
                      <AvatarFallback className="bg-gradient-to-br from-pink-600 to-purple-600 text-white">
                        {reader.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1 w-5 h-5 online-indicator rounded-full border-2 border-gray-900"></div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-pink-400">{reader.display_name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < Math.floor(reader.rating) ? 'text-yellow-400 fill-current' : 'text-gray-600'} star-rating`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">
                        {reader.rating} ({reader.total_reviews})
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                  {reader.bio}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {reader.specialties.slice(0, 3).map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="bg-gray-800/50 text-gray-300">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                
                <div className="text-sm text-gray-400 mb-4">
                  <span className="golden-accent">{reader.years_experience} years experience</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-green-400" />
                      <span>Chat</span>
                    </div>
                    <span className="golden-accent">${reader.chat_rate_per_minute}/min</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-blue-400" />
                      <span>Phone</span>
                    </div>
                    <span className="golden-accent">${reader.phone_rate_per_minute}/min</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4 text-purple-400" />
                      <span>Video</span>
                    </div>
                    <span className="golden-accent">${reader.video_rate_per_minute}/min</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-6">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 border-green-400/50 text-green-400 hover:bg-green-400/10"
                    onClick={() => handleStartReading(reader.id, 'chat')}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Chat
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 border-blue-400/50 text-blue-400 hover:bg-blue-400/10"
                    onClick={() => handleStartReading(reader.id, 'phone')}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 mystical-button"
                    onClick={() => handleStartReading(reader.id, 'video')}
                  >
                    <Video className="w-4 h-4 mr-1" />
                    Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
