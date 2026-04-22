"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface TournamentSettings {
  id: number;
  tournament_name: string;
  max_pp_for_registration: number;
  min_pp_for_registration: number;
  current_season: string;
  current_season_stage: string;
  registration_enabled: boolean;
  mappool_visible: boolean;
  created_at: string;
}

interface ConfigContextType {
  tournamentSettings: TournamentSettings | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}

// 检查用户是否为管理员的Hook
export function useIsAdmin(): boolean {
  const { tournamentSettings } = useConfig();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);

        // 从session API获取当前用户信息
        const sessionResponse = await fetch("/api/session/get");
        const sessionData = await sessionResponse.json();

        const userSession = sessionData.data?.session;
        if (!sessionData.success || !userSession?.osuId) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        const currentUserId = userSession.osuId;

        const permissionsResponse = await fetch(
          `/api/user-permissions?osuId=${currentUserId}`,
        );

        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json();
          setIsAdmin(permissionsData.permissions?.isadmin || false);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [tournamentSettings]);

  // 在加载期间返回false，避免权限检查闪烁
  if (isLoading) {
    return false;
  }

  return isAdmin;
}

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [tournamentSettings, setTournamentSettings] =
    useState<TournamentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournamentSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/tournament-settings");
      if (!response.ok) {
        throw new Error("Failed to fetch tournament settings");
      }

      const data = await response.json();
      if (data.success) {
        setTournamentSettings(data.settings);
      } else {
        throw new Error(data.error || "Failed to load settings");
      }
    } catch (err) {
      console.error("Error fetching tournament settings:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentSettings();
  }, []);

  const refetch = async () => {
    await fetchTournamentSettings();
  };

  const value: ConfigContextType = {
    tournamentSettings,
    isLoading,
    error,
    refetch,
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}
