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
    const { oauth_token, oauth_verifier } = await req.json()

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

    // Exchange OAuth token for access token with Garmin
    const tokenResponse = await exchangeGarminToken(oauth_token, oauth_verifier)
    
    // Get user profile from Garmin
    const profileResponse = await getGarminProfile(tokenResponse.access_token)

    // Store the connection in the database
    const { error } = await supabaseClient
      .from('garmin_connections')
      .upsert({
        user_id: user.id,
        garmin_username: profileResponse.userName || profileResponse.userId,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_expires_at: new Date(Date.now() + (tokenResponse.expires_in * 1000)).toISOString(),
        last_sync: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: profileResponse,
        tokens: {
          access_token: tokenResponse.access_token,
          expires_in: tokenResponse.expires_in
        }
      }),
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

async function exchangeGarminToken(oauthToken: string, oauthVerifier: string) {
  const clientId = Deno.env.get('GARMIN_CLIENT_ID')
  const clientSecret = Deno.env.get('GARMIN_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('Garmin credentials not configured')
  }

  // Create OAuth 1.0 signature for token exchange
  const params = {
    oauth_consumer_key: clientId,
    oauth_token: oauthToken,
    oauth_verifier: oauthVerifier,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: generateNonce(),
    oauth_version: '1.0'
  }

  // Generate signature (simplified - in production use a proper OAuth library)
  const signature = await generateOAuthSignature('POST', 'https://connectapi.garmin.com/oauth-service/oauth/access_token', params, clientSecret)
  params.oauth_signature = signature

  const formData = new URLSearchParams(params)

  const response = await fetch('https://connectapi.garmin.com/oauth-service/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData
  })

  if (!response.ok) {
    throw new Error(`Garmin token exchange failed: ${response.statusText}`)
  }

  const responseText = await response.text()
  const tokenData = new URLSearchParams(responseText)

  return {
    access_token: tokenData.get('oauth_token') || '',
    refresh_token: tokenData.get('oauth_token_secret') || '',
    expires_in: 3600, // Garmin tokens typically expire in 1 hour
    token_type: 'Bearer'
  }
}

async function getGarminProfile(accessToken: string) {
  const response = await fetch('https://connectapi.garmin.com/userprofile-service/userprofile', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to get Garmin profile: ${response.statusText}`)
  }

  return response.json()
}

function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

async function generateOAuthSignature(
  method: string, 
  url: string, 
  params: Record<string, string>, 
  consumerSecret: string,
  tokenSecret: string = ''
): Promise<string> {
  // This is a simplified OAuth signature generation
  // In production, use a proper OAuth 1.0 library
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')

  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`

  // Use Web Crypto API to generate HMAC-SHA1 signature
  const encoder = new TextEncoder()
  const keyData = encoder.encode(signingKey)
  const messageData = encoder.encode(baseString)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const signatureArray = new Uint8Array(signature)
  
  // Convert to base64
  return btoa(String.fromCharCode(...signatureArray))
}