
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Star, ShoppingBag, MessageCircle, Users, Home, Zap } from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Home', href: '#', icon: Home },
    { name: 'Readings', href: '#readings', icon: Star },
    { name: 'Live', href: '#live', icon: Zap },
    { name: 'Shop', href: '#shop', icon: ShoppingBag },
    { name: 'Community', href: '#community', icon: Users },
    { name: 'Messages', href: '#messages', icon: MessageCircle },
  ];

  const handleAddFunds = () => {
    alert('Demo: Add funds to account feature');
  };

  const handleDashboard = () => {
    alert('Demo: Navigate to user dashboard');
  };

  const handleNavigation = (href: string) => {
    if (href === '#') return;
    alert(`Demo: Navigate to ${href} section`);
  };

  return (
    <header className="mystical-header celestial-background">
      <div className="container mx-auto px-4">
        {/* Brand Section */}
        <div className="text-center mb-6">
          <h1 className="brand-title">SoulSeer</h1>
          <p className="brand-tagline">A Community of Gifted Psychics</p>
        </div>

        {/* Navigation */}
        <nav className="flex items-center justify-between">
          {/* Desktop Navigation */}
          <div className="hidden lg:flex">
            <NavigationMenu>
              <NavigationMenuList className="space-x-6">
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuLink 
                      href={item.href}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-200 hover:text-pink-400 transition-colors duration-200 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation(item.href);
                      }}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Account Balance & Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <Badge variant="secondary" className="bg-gray-800/50 text-yellow-400 border-yellow-400/30">
              <span className="golden-accent">Balance: $25.50</span>
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-pink-400/50 text-pink-400 hover:bg-pink-400/10"
              onClick={handleAddFunds}
            >
              Add Funds
            </Button>
            <Button 
              size="sm" 
              className="mystical-button"
              onClick={handleDashboard}
            >
              Dashboard
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-200">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="mystical-card border-l-gray-700">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigationItems.map((item) => (
                    <button
                      key={item.name}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-200 hover:text-pink-400 hover:bg-gray-800/30 rounded-lg transition-all duration-200 text-left w-full"
                      onClick={() => {
                        handleNavigation(item.href);
                        setIsMenuOpen(false);
                      }}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-700 pt-4 mt-6">
                    <div className="px-4 py-2">
                      <Badge variant="secondary" className="bg-gray-800/50 text-yellow-400 border-yellow-400/30 mb-3">
                        <span className="golden-accent">Balance: $25.50</span>
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mb-2 border-pink-400/50 text-pink-400 hover:bg-pink-400/10"
                      onClick={() => {
                        handleAddFunds();
                        setIsMenuOpen(false);
                      }}
                    >
                      Add Funds
                    </Button>
                    <Button 
                      className="w-full mystical-button"
                      onClick={() => {
                        handleDashboard();
                        setIsMenuOpen(false);
                      }}
                    >
                      Dashboard
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
