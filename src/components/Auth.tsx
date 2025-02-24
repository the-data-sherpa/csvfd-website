import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../lib/supabase';
import type { SiteUser } from '../types/database';

export function Auth() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createSiteUser = async (email: string) => {
    try {
      const { data: existingUser, error: queryError } = await supabaseAdmin
        .from('site_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (queryError) throw queryError;

      if (!existingUser) {
        const newUser: Partial<SiteUser> = {
          email,
          name: email.split('@')[0],
          role: 'member'
        };

        const { error: insertError } = await supabaseAdmin
          .from('site_users')
          .insert([newUser]);

        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('Error managing site user:', err);
      throw err;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await createSiteUser(session.user.email!);
          navigate('/members');
        } catch (err) {
          console.error('Error managing site user:', err);
          setError('Failed to create user account. Please try again.');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      // Define redirectUrl based on environment
      const redirectUrl = window.location.hostname.includes('local-credentialless')
        ? 'https://celadon-mousse-1b20aa.netlify.app/members'
        : `${window.location.origin}/members`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: 'coolspringsvfd.org'
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            src="https://csvfd-website.nyc3.digitaloceanspaces.com/photos/1740198321138-blob"
            alt="Cool Springs VFD Logo"
            className="mx-auto h-24 w-auto"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Members Area
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your Cool Springs VFD Google account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign in with Google'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}