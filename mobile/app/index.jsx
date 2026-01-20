import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (user?.role === 'BOSS') {
    return <Redirect href="/(boss)" />;
  }

  if (user?.role === 'MANAGER') {
    return <Redirect href="/(manager)" />;
  }

  if (user?.role === 'WORKER') {
    return <Redirect href="/(worker)" />;
  }

  return null;
}
