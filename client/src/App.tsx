
import { Header } from '@/components/Header';
import { OnlineReaders } from '@/components/OnlineReaders';
import { LiveStreams } from '@/components/LiveStreams';
import { FeaturedProducts } from '@/components/FeaturedProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Zap, Gift, Users, MessageCircle, TrendingUp } from 'lucide-react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-background celestial-background">
      <Header />
      
      <main className="container mx-auto px-4 pb-8">
        {/* Hero Section */}
        <section className="text-center py-12 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
              Connect with Gifted Psychics
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Experience authentic spiritual guidance through personalized readings, live streams, and a vibrant community of seekers and gifted readers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="mystical-button px-8 py-3 text-lg">
                <Zap className="w-5 h-5 mr-2" />
                Start Your Reading
              </Button>
              <Button size="lg" variant="outline" className="border-pink-400/50 text-pink-400 hover:bg-pink-400/10 px-8 py-3 text-lg">
                <Users className="w-5 h-5 mr-2" />
                Join Live Streams
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="mystical-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-pink-400 mb-1">250+</div>
              <div className="text-sm text-gray-400">Verified Readers</div>
            </CardContent>
          </Card>
          <Card className="mystical-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-400 mb-1">50k+</div>
              <div className="text-sm text-gray-400">Readings Completed</div>
            </CardContent>
          </Card>
          <Card className="mystical-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-400 mb-1">24/7</div>
              <div className="text-sm text-gray-400">Available Support</div>
            </CardContent>
          </Card>
          <Card className="mystical-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">4.9★</div>
              <div className="text-sm text-gray-400">Average Rating</div>
            </CardContent>
          </Card>
        </section>

        {/* Online Readers Section */}
        <OnlineReaders />

        {/* Live Streams Section */}
        <LiveStreams />

        {/* Featured Products Section */}
        <FeaturedProducts />

        {/* Community Highlights */}
        <section className="py-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-pink-400">
            Community Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="mystical-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageCircle className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold">Active Discussions</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Join thousands of spiritual seekers in our community forums discussing dreams, synchronicities, and spiritual growth.
                </p>
                <Button variant="outline" className="border-blue-400/50 text-blue-400 hover:bg-blue-400/10">
                  Join Community
                </Button>
              </CardContent>
            </Card>

            <Card className="mystical-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Gift className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold">Virtual Gifting</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Show appreciation to your favorite readers with beautiful virtual gifts during live streams and sessions.
                </p>
                <Button variant="outline" className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10">
                  Explore Gifts
                </Button>
              </CardContent>
            </Card>

            <Card className="mystical-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold">Success Stories</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Read inspiring testimonials from clients who found clarity, love, and purpose through our gifted readers.
                </p>
                <Button variant="outline" className="border-green-400/50 text-green-400 hover:bg-green-400/10">
                  Read Stories
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Discover Your Path?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Connect with authentic spiritual guidance and join a community dedicated to growth, healing, and enlightenment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="mystical-button px-8 py-3 text-lg">
                <Star className="w-5 h-5 mr-2" />
                Get Your First Reading
              </Button>
              <Button size="lg" variant="outline" className="border-gray-400/50 text-gray-300 hover:bg-gray-400/10 px-8 py-3 text-lg">
                Learn More
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-pink-400 mb-4">SoulSeer</h3>
              <p className="text-gray-400 text-sm">
                Connecting souls with authentic spiritual guidance since 2024.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-pink-400">Tarot Readings</a></li>
                <li><a href="#" className="hover:text-pink-400">Psychic Readings</a></li>
                <li><a href="#" className="hover:text-pink-400">Live Streams</a></li>
                <li><a href="#" className="hover:text-pink-400">Spiritual Shop</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Community</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-pink-400">Forums</a></li>
                <li><a href="#" className="hover:text-pink-400">Events</a></li>
                <li><a href="#" className="hover:text-pink-400">Blog</a></li>
                <li><a href="#" className="hover:text-pink-400">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-pink-400">Help Center</a></li>
                <li><a href="#" className="hover:text-pink-400">Contact Us</a></li>
                <li><a href="#" className="hover:text-pink-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-pink-400">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800/50 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 SoulSeer. All rights reserved. ✨</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
