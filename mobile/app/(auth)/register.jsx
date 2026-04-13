/**
 * This file is intentionally a redirect.
 *
 * - BOSS users → app/(auth)/register-boss.jsx
 * - Invited users (MANAGER/WORKER) → app/(auth)/invite-register.jsx
 *   (they arrive via the deep link chantierpro://invite/:token)
 *
 * We keep this file so any stale link to /(auth)/register still works.
 */
import { Redirect } from 'expo-router';

export default function Register() {
  return <Redirect href="/(auth)/register-boss" />;
}
