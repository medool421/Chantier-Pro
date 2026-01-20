import { View, Text, Button } from 'react-native';
import { router } from 'expo-router';

export default function Onboarding() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to ChantierPro 🏗️</Text>

      <Button title="Login" onPress={() => router.push('/(auth)/login')} />
      <Button title="Register" onPress={() => router.push('/(auth)/register')} />
    </View>
  );
}
