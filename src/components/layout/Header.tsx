import React, { useState } from 'react';
import { Sun as Run, Flame, BarChart, Target, LogIn, LogOut, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AuthModal from '../auth/AuthModal';
import Button from '../common/Button';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface HeaderProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  user: any | null;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, user }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart size={20} /> },
    { id: 'runs', label: 'My Runs', icon: <Run size={20} /> },
    { id: 'progress', label: 'Progress', icon: <Flame size={20} /> },
    { id: 'goals', label: 'Goals', icon: <Target size={20} /> },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Run className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">RunTracker</span>
            </div>
            
            <nav className="flex space-x-4 items-center">
              {user && navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${activeTab === item.id 
                      ? 'text-blue-700 bg-blue-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
                  `}
                >
                  <span className="mr-2">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <User size={16} className="mr-2" />
                    <span>{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    icon={<LogOut size={16} />}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  icon={<LogIn size={16} />}
                >
                  Login
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>
      
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
};

export default Header;