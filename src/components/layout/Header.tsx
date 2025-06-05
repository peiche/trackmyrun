import React, { useState } from 'react';
import { Footprints as Run, Flame, BarChart, Target, LogIn, LogOut, User, ChevronDown } from 'lucide-react';
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
  const [showDropdown, setShowDropdown] = useState(false);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart size={20} /> },
    { id: 'runs', label: 'My Runs', icon: <Run size={20} /> },
    { id: 'progress', label: 'Progress', icon: <Flame size={20} /> },
    { id: 'goals', label: 'Goals', icon: <Target size={20} /> },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Run className="h-8 w-8 text-gray-900" />
              <span className="ml-2 text-xl font-bold text-gray-900">RunTracker</span>
            </div>

            <div className="flex space-x-4 items-center">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <User size={16} />
                    <span className="hidden sm:inline">{user.email}</span>
                    <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                        Signed in as<br />
                        <span className="font-medium">{user.email}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  icon={<LogIn size={16} />}
                >
                  Login
                </Button>
              )}
            </div>
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

          </nav>
        </div>
      </header>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
};

export default Header;