import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { exchangeCodeForTokens } from '../../lib/garminAuth';
import Card from '../common/Card';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const GarminCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Garmin authorization...');
  const navigate = useNavigate();

  useEffect(() => {
    handleGarminCallback();
  }, []);

  const handleGarminCallback = async () => {
    try {
      // Get OAuth parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const oauthToken = urlParams.get('oauth_token');
      const oauthVerifier = urlParams.get('oauth_verifier');

      if (!oauthToken || !oauthVerifier) {
        throw new Error('Missing OAuth parameters');
      }

      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      // Exchange tokens with our backend
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/garmin-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oauth_token: oauthToken,
          oauth_verifier: oauthVerifier
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to Garmin');
      }

      const data = await response.json();
      
      setStatus('success');
      setMessage(`Successfully connected to Garmin Connect as ${data.profile.userName || 'user'}!`);

      // Redirect back to the app after a short delay
      setTimeout(() => {
        // Close the popup if this is running in a popup
        if (window.opener) {
          window.opener.postMessage({ type: 'GARMIN_AUTH_SUCCESS', data }, window.location.origin);
          window.close();
        } else {
          // Navigate back to the main app
          navigate('/');
        }
      }, 2000);

    } catch (error) {
      console.error('Garmin callback error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to connect to Garmin Connect');

      // Redirect back after error
      setTimeout(() => {
        if (window.opener) {
          window.opener.postMessage({ type: 'GARMIN_AUTH_ERROR', error: error.message }, window.location.origin);
          window.close();
        } else {
          navigate('/');
        }
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <div className="py-8">
          {status === 'loading' && (
            <>
              <RefreshCw className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Connecting to Garmin
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
                Connection Successful!
              </h2>
              <p className="text-green-700 dark:text-green-300">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Redirecting you back to the app...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
              <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
                Connection Failed
              </h2>
              <p className="text-red-700 dark:text-red-300">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                You will be redirected back to the app shortly.
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default GarminCallback;