import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import PageContainer from './components/layout/PageContainer';
import DashboardStats from './components/dashboard/DashboardStats';
import RecentRunsList from './components/dashboard/RecentRunsList';
import WeeklyMileageChart from './components/dashboard/WeeklyMileageChart';
import RunsList from './components/runs/RunsList';
import RunForm from './components/runs/RunForm';
import ProgressCharts from './components/progress/ProgressCharts';
import GoalsList from './components/goals/GoalsList';
import GoalForm from './components/goals/GoalForm';
import Button from './components/common/Button';
import { AppProvider } from './context/AppContext';
import { PlusCircle } from 'lucide-react';
import { supabase } from './lib/supabase';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRunForm, setShowRunForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // Render tab content based on active tab
  const renderTabContent = () => {
    if (!user) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to RunTracker
          </h2>
          <p className="text-gray-600 mb-8">
            Please log in or sign up to start tracking your runs
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <DashboardStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentRunsList />
              <WeeklyMileageChart />
            </div>
          </>
        );
      
      case 'runs':
        return (
          <>
            {showRunForm ? (
              <RunForm onClose={() => setShowRunForm(false)} />
            ) : (
              <RunsList />
            )}
          </>
        );
      
      case 'progress':
        return <ProgressCharts />;
      
      case 'goals':
        return (
          <>
            {showGoalForm ? (
              <GoalForm onClose={() => setShowGoalForm(false)} />
            ) : (
              <GoalsList />
            )}
          </>
        );
      
      default:
        return <div>Page not found</div>;
    }
  };
  
  // Get tab title and action button based on active tab
  const getTabConfig = () => {
    if (!user) {
      return {
        title: 'Welcome to RunTracker',
        action: null
      };
    }

    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          action: (
            <Button 
              icon={<PlusCircle size={16} />}
              onClick={() => {
                setActiveTab('runs');
                setShowRunForm(true);
              }}
            >
              Log Run
            </Button>
          )
        };
      
      case 'runs':
        return {
          title: 'My Runs',
          action: !showRunForm && (
            <Button 
              icon={<PlusCircle size={16} />}
              onClick={() => setShowRunForm(true)}
            >
              Log Run
            </Button>
          )
        };
      
      case 'progress':
        return {
          title: 'Progress Tracking',
          action: null
        };
      
      case 'goals':
        return {
          title: 'Running Goals',
          action: !showGoalForm && (
            <Button 
              icon={<PlusCircle size={16} />}
              onClick={() => setShowGoalForm(true)}
            >
              Add Goal
            </Button>
          )
        };
      
      default:
        return { title: 'Page Not Found', action: null };
    }
  };
  
  const tabConfig = getTabConfig();
  
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <Header 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          user={user}
        />
        
        <main>
          <PageContainer 
            title={tabConfig.title}
            action={tabConfig.action}
          >
            {renderTabContent()}
          </PageContainer>
        </main>
      </div>
    </AppProvider>
  );
}

export default App;