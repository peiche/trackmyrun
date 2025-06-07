import { useState, useEffect } from 'react';
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
import FileImport from './components/import/FileImport';
import Button from './components/common/Button';
import { AppProvider } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { PlusCircle, Upload } from 'lucide-react';
import { supabase } from './lib/supabase';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRunForm, setShowRunForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          // If there's an error or no session, sign out to clear any invalid tokens
          await supabase.auth.signOut();
          setUser(null);
          return;
        }

        setUser(session.user);
      } catch (error) {
        console.error('Error initializing auth:', error);
        // On any error, sign out to ensure a clean state
        await supabase.auth.signOut();
        setUser(null);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const renderTabContent = () => {
    if (!user) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to TrackMyRun
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Please log in or sign up to start tracking your runs
          </p>
          <div>
            <a href="https://bolt.new/" target="_blank">
              <img className="inline mx-auto" src={`/images/boltdotnew-black.png`} alt="Powered by Bolt.new" width={150} />
            </a>
          </div>
        </div>
      );
    }

    if (showImport) {
      return <FileImport onClose={() => setShowImport(false)} />;
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

  const getTabConfig = () => {
    if (!user) {
      return {
        title: 'Welcome to TrackMyRun',
        action: null
      };
    }

    if (showImport) {
      return {
        title: 'Import Running Data',
        action: null
      };
    }

    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          action: (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                icon={<Upload size={16} />}
                onClick={() => setShowImport(true)}
              >
                Import
              </Button>
              <Button
                icon={<PlusCircle size={16} />}
                onClick={() => {
                  setActiveTab('runs');
                  setShowRunForm(true);
                }}
              >
                Log Run
              </Button>
            </div>
          )
        };

      case 'runs':
        return {
          title: 'My Runs',
          action: !showRunForm && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                icon={<Upload size={16} />}
                onClick={() => setShowImport(true)}
              >
                Import
              </Button>
              <Button
                icon={<PlusCircle size={16} />}
                onClick={() => setShowRunForm(true)}
              >
                Log Run
              </Button>
            </div>
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
    <ThemeProvider>
      <AppProvider currentUserId={user?.id || null}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <Header
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setShowImport(false);
              setShowRunForm(false);
              setShowGoalForm(false);
            }}
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
    </ThemeProvider>
  );
}

export default App;