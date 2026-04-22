import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// Utility function to clean up auth state
const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Safety timeout to prevent infinite white screen
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Auth initialization taking longer than 10s. Forcing app to load.");
        setLoading(false);
      }
    }, 10000);

    let subscription;

    try {
      // Set up Supabase auth state listener
      const result = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        
        if (session) {
          try {
            // First check if profile exists
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (error) {
              console.error("Error fetching user profile:", error);
              setCurrentUser(session.user);
              return;
            }

            if (profile) {
              setCurrentUser({
                ...session.user,
                ...profile
              });
            } else {
              // If no profile exists, create one
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([
                  {
                    id: session.user.id,
                    role: 'student',
                    name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                    roll_number: session.user.user_metadata?.rollNumber
                  }
                ])
                .select()
                .single();

              if (insertError) {
                console.error("Error creating user profile:", insertError);
                setCurrentUser(session.user);
              } else {
                setCurrentUser({
                  ...session.user,
                  ...newProfile
                });
              }
            }
          } catch (error) {
            console.error("Error in profile handling:", error);
            setCurrentUser(session.user);
          } finally {
            setLoading(false);
            clearTimeout(timeoutId);
          }
        } else {
          setCurrentUser(null);
          setLoading(false);
          clearTimeout(timeoutId);
        }
      });
      subscription = result.data.subscription;

      // Check current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        
        if (session) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
            .then(({ data: profile, error }) => {
              if (error) {
                console.error("Error fetching user profile:", error);
                setCurrentUser(session.user);
                return;
              }

              if (profile) {
                setCurrentUser({
                  ...session.user,
                  ...profile
                });
              } else {
                // If no profile exists, create one
                supabase
                  .from('profiles')
                  .insert([
                    {
                      id: session.user.id,
                      role: 'student',
                      name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                      roll_number: session.user.user_metadata?.rollNumber
                    }
                  ])
                  .select()
                  .single()
                  .then(({ data: newProfile, error: insertError }) => {
                    if (insertError) {
                      console.error("Error creating user profile:", insertError);
                      setCurrentUser(session.user);
                    } else {
                      setCurrentUser({
                        ...session.user,
                        ...newProfile
                      });
                    }
                  });
              }
              setLoading(false);
              clearTimeout(timeoutId);
            })
            .catch((error) => {
              console.error("Session error:", error);
              setCurrentUser(null);
              setLoading(false);
              clearTimeout(timeoutId);
            });
        } else {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }).catch(err => {
        console.error("GetSession error:", err);
        setLoading(false);
        clearTimeout(timeoutId);
      });
    } catch (err) {
      console.error("Critical Auth initialization error:", err);
      setLoading(false);
      clearTimeout(timeoutId);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const login = async (email, password) => {
    try {
      // Clean up existing auth state
      cleanupAuthState();
      
      // Try global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log("Pre-signout failed, continuing with login");
      }

      // Handle special accounts
      if (email === 'admin@gmail.com' && password === 'password123') {
        // For admin, create a mock session
        const mockUser = {
          id: 'admin-user',
          email: 'admin@gmail.com',
          role: 'admin',
          name: 'Admin User'
        };

        setCurrentUser(mockUser);
        return mockUser;
      } else if (email === 'xerox@gmail.com' && password === 'password123') {
        // For xerox, create a mock session
        const mockUser = {
          id: 'xerox-user',
          email: 'xerox@gmail.com',
          role: 'xerox',
          name: 'Xerox User'
        };

        setCurrentUser(mockUser);
        return mockUser;
      } else {
        // Regular login for other accounts
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (error) throw error;

          const user = {
            ...data.user,
            ...profile
          };

          setCurrentUser(user);
          setSession(data.session);
          return user;
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(error.message || "Failed to log in");
    }
  };

  const signup = async (name, rollNumber, email, password) => {
    try {
      // Clean up existing auth state
      cleanupAuthState();
      
      // We can't check by email because the profiles table doesn't have an email column.
      // Supabase auth.signUp will handle duplicate emails if needed.
      const existingUser = null;

      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            rollNumber,
            role: 'student'
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Profile creation is handled by onAuthStateChange listener upon successful authentication
        toast.success("Account created successfully! Please check your email for verification.");
        return data.user;
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw new Error(error.message || "Failed to create account");
    }
  };

  const logout = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      setCurrentUser(null);
      setSession(null);
      
      // Force full page refresh for clean state
      window.location.href = '/login';
    } catch (error) {
      toast.error("Error logging out");
      console.error("Logout error:", error);
    }
  };

  const value = {
    currentUser,
    session,
    login,
    signup,
    logout,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading PrintHub...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;