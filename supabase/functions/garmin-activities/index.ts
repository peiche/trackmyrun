import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get user's Garmin connection
    const { data: connection, error: connectionError } = await supabaseClient
      .from('garmin_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connectionError || !connection) {
      throw new Error('Garmin connection not found')
    }

    // Check if token needs refresh
    const tokenExpiry = new Date(connection.token_expires_at)
    const now = new Date()
    
    let accessToken = connection.access_token

    if (tokenExpiry <= now) {
      // Refresh the token
      const refreshedTokens = await refreshGarminToken(connection.refresh_token)
      accessToken = refreshedTokens.access_token

      // Update the connection with new tokens
      await supabaseClient
        .from('garmin_connections')
        .update({
          access_token: refreshedTokens.access_token,
          refresh_token: refreshedTokens.refresh_token,
          token_expires_at: new Date(Date.now() + (refreshedTokens.expires_in * 1000)).toISOString()
        })
        .eq('user_id', user.id)
    }

    // Get query parameters
    const url = new URL(req.url)
    const start = parseInt(url.searchParams.get('start') || '0')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    // Fetch activities from Garmin Connect
    const activities = await getGarminActivities(accessToken, start, limit)

    // Filter for running activities and format the data
    const runningActivities = activities
      .filter(activity => 
        activity.activityType?.typeKey === 'running' || 
        activity.activityType?.typeKey === 'trail_running' ||
        activity.activityType?.typeKey === 'treadmill_running'
      )
      .map(activity => ({
        activityId: activity.activityId.toString(),
        activityName: activity.activityName || 'Untitled Run',
        startTimeLocal: activity.startTimeLocal,
        distance: activity.distance ? (activity.distance / 1609.34) : 0, // Convert meters to miles
        duration: activity.duration ? (activity.duration / 60) : 0, // Convert seconds to minutes
        activityType: activity.activityType?.typeKey || 'running',
        averageSpeed: activity.averageSpeed,
        maxSpeed: activity.maxSpeed,
        calories: activity.calories,
        averageHR: activity.averageHR,
        maxHR: activity.maxHR,
        imported: false
      }))

    // Update last sync time
    await supabaseClient
      .from('garmin_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('user_id', user.id)

    return new Response(
      JSON.stringify(runningActivities),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function getGarminActivities(accessToken: string, start: number, limit: number) {
  const response = await fetch(
    `https://connectapi.garmin.com/activitylist-service/activities/search/activities?start=${start}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch Garmin activities: ${response.statusText}`)
  }

  return response.json()
}

async function refreshGarminToken(refreshToken: string) {
  const clientId = Deno.env.get('GARMIN_CLIENT_ID')
  const clientSecret = Deno.env.get('GARMIN_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('Garmin credentials not configured')
  }

  // Implement token refresh logic here
  // This would follow Garmin's OAuth refresh flow
  
  // For now, return the existing token (in production, implement proper refresh)
  return {
    access_token: refreshToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    token_type: 'Bearer'
  }
}