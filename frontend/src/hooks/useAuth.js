import { useAuthStore } from '../store/useAuthStore';

export const useAuth = () => {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);

  return {
    token,
    role,
    user,
    setSession,
    logout,
    isAuthenticated: Boolean(token),
  };
};
