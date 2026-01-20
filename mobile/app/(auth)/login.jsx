import { View, Button } from 'react-native';
import { useAuthStore } from '../../src/store/auth.store';
import { router } from 'expo-router';

export default function Login() {
  const login = useAuthStore((s) => s.login);

  return (
    <View>
      <Button
        title="Login as Boss"
        onPress={() => {
          login({ role: 'BOSS' });
          router.replace('/');
        }}
      />
      <Button
        title="Login as Manager"
        onPress={() => {
          login({ role: 'MANAGER' });
          router.replace('/');
        }}
      />
      <Button
        title="Login as Worker"
        onPress={() => {
          login({ role: 'WORKER' });
          router.replace('/');
        }}
      />
    </View>
  );
}
