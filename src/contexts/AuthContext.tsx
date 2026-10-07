import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Using a simplified User type for now
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'teacher';
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    // Robustly extract token from href or query string (handles ?token=, &token=, and malformed double queries)
    const href = window.location.href;
    const match = href.match(/[?&#]token=([^&#]+)/);
    if (match && match[1]) {
      const tokenFromUrl = decodeURIComponent(match[1]);
      localStorage.setItem('auth_token', tokenFromUrl);
      
      // Clean token from the URL without triggering a reload
      const cleanHref = href.replace(/[?&]token=[^&#]*/, '').replace(/(\?|&)$/, '');
      window.history.replaceState({}, document.title, cleanHref);
      return tokenFromUrl;
    }
    return localStorage.getItem('auth_token');
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 2. Fetch user profile if we have a token
    const fetchUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5001'}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token is invalid or expired
          console.error("Failed to fetch user profile, clearing token.");
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5001'}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error logging out on backend', error);
      }
    }
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
