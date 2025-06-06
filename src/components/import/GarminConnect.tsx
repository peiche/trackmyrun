import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, CheckCircle, AlertCircle, X, Settings } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { generateAuthUrl } from '../../lib/garminAuth';

interface GarminConnectProps {
  onClose: () => void;
}

interface GarminActivity {
  activityId: string;
  activityName: string;
  startTimeLocal: string;
  distance: number;
  duration: number;
  activityType: string;
  imported: boolean;
}

interface GarminConnection {
  connected: boolean;
  username?: string;
  lastSync?: string;
  accessToken?: string;
}

const GarminConnect: React.FC<GarminConnectProps> = ({ onClose }) => {
  const { addRun } = useAppContext();
  const [connection, setConnection] = useState<GarminConnection>({ connected: false });
  const [activities, setActivities] = useState<GarminActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkGarminConnection();
    
    // Listen for OAuth callback messages
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GARMIN_AUTH_SUCCESS') {
        setConnection({
          connected: true,
          username: event.data.data.profile.userName,
          lastSync: new Date().toISOString(),
          accessToken: event.data.data.tokens.access_token
        });
        setSuccess('Successfully connected to Garmin Connect!');
        setIsLoading(false);
        loadRecentActivities();
      } else if (event.data.type === 'GARMIN_AUTH_ERROR') {
        setError('Failed to connect to Garmin Connect: ' + event.data.error);
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkGarminConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has connected Garmin account
      const { data, error } = await supabase
        .from('garmin_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setConnection({
          connected: true,
          username: data.garmin_username,
          lastSync: data.last_sync,
          accessToken: data.access_token
        });
        
        // Load recent activities if connected
        await loadRecentActivities();
      }
    } catch (err) {
      console.error('Error checking Garmin connection:', err);
    }
  };

  const connectToGarmin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate the OAuth URL
      const authUrl = generateAuthUrl();
      
      // Open Garmin Connect OAuth in a popup
      const popup = window.open(
        authUrl,
        'garmin-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Check if popup was blocked
      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site and try again.');
      }

      // Monitor popup closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          if (!connection.connected) {
            setError('Authorization was cancelled or failed.');
            setIsLoading(false);
          }
        }
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Garmin Connect. Please try again.');
      setIsLoading(false);
    }
  };

  const loadRecentActivities = async () => {
    setIsSyncing(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/garmin-activities?start=0&limit=20`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load activities');
      }

      const activitiesData = await response.json();
      setActivities(activitiesData);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activities from Garmin Connect.');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleActivitySelection = (activityId: string) => {
    const newSelected = new Set(selectedActivities);
    if (newSelected.has(activityId)) {
      newSelected.delete(activityId);
    } else {
      newSelected.add(activityId);
    }
    setSelectedActivities(newSelected);
  };

  const importSelectedActivities = async () => {
    if (selectedActivities.size === 0) return;

    setIsSyncing(true);
    setError(null);

    try {
      let importedCount = 0;

      for (const activityId of selectedActivities) {
        const activity = activities.find(a => a.activityId === activityId);
        if (!activity) continue;

        const runData = {
          date: new Date(activity.startTimeLocal).toISOString().split('T')[0],
          distance: Math.round(activity.distance * 100) / 100,
          duration: Math.round(activity.duration * 100) / 100,
          pace: activity.duration / activity.distance,
          route: activity.activityName,
          notes: `Imported from Garmin Connect - Activity Type: ${activity.activityType}`,
          feeling_rating: 3
        };

        await addRun(runData);
        importedCount++;

        // Mark as imported
        setActivities(prev => 
          prev.map(a => 
            a.activityId === activityId ? { ...a, imported: true } : a
          )
        );
      }

      setSelectedActivities(new Set());
      setSuccess(`Successfully imported ${importedCount} activities!`);
    } catch (err) {
      setError('Failed to import some activities. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnectGarmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete the connection from the database
      await supabase
        .from('garmin_connections')
        .delete()
        .eq('user_id', user.id);

      setConnection({ connected: false });
      setActivities([]);
      setSelectedActivities(new Set());
      setSuccess('Disconnected from Garmin Connect.');
    } catch (err) {
      setError('Failed to disconnect from Garmin Connect.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Garmin Connect Integration</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        </div>
      )}

      {!connection.connected ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <ExternalLink className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Connect to Garmin Connect
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Automatically sync your running activities from Garmin Connect. 
            Your data will be imported securely and you can choose which activities to add.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-6 max-w-md mx-auto">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Setup Required:</strong> You'll need to configure your Garmin Connect IQ app credentials in the environment variables.
            </p>
          </div>

          <Button
            onClick={connectToGarmin}
            disabled={isLoading}
            icon={isLoading ? <RefreshCw className="animate-spin" size={16} /> : <ExternalLink size={16} />}
          >
            {isLoading ? 'Connecting...' : 'Connect to Garmin Connect'}
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Connected to Garmin Connect
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {connection.username}
                  {connection.lastSync && (
                    <span className="ml-2">
                      • Last sync: {formatDate(connection.lastSync)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadRecentActivities}
                disabled={isSyncing}
                icon={isSyncing ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              >
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnectGarmin}
                icon={<Settings size={16} />}
              >
                Disconnect
              </Button>
            </div>
          </div>

          {activities.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Recent Activities</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedActivities.size} selected
                  </span>
                  <Button
                    onClick={importSelectedActivities}
                    disabled={selectedActivities.size === 0 || isSyncing}
                    size="sm"
                    icon={isSyncing ? <RefreshCw className="animate-spin" size={16} /> : undefined}
                  >
                    {isSyncing ? 'Importing...' : `Import Selected (${selectedActivities.size})`}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.map((activity) => (
                  <div
                    key={activity.activityId}
                    className={`
                      flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                      ${activity.imported 
                        ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60' 
                        : selectedActivities.has(activity.activityId)
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                    onClick={() => !activity.imported && toggleActivitySelection(activity.activityId)}
                  >
                    <div className="flex-shrink-0 mr-4">
                      <input
                        type="checkbox"
                        checked={selectedActivities.has(activity.activityId)}
                        disabled={activity.imported}
                        onChange={() => {}}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {activity.activityName}
                          {activity.imported && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              Imported
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(activity.startTimeLocal)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{activity.distance.toFixed(1)} miles</span>
                        <span>{formatDuration(activity.duration)}</span>
                        <span>{(activity.duration / activity.distance).toFixed(1)} min/mile</span>
                        <span className="capitalize">{activity.activityType}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activities.length === 0 && !isSyncing && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No recent activities found. Try refreshing or check your Garmin Connect account.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </Card>
  );
};

export default GarminConnect;