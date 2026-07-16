// Landing route: resolves "/" to the right place. Signed-in leaders go to their
// trips; everyone else to login. The root Stack's Protected guards own the actual
// gating — this only gives "/" a destination so it never falls through to NotFound.
import { Redirect } from 'expo-router';

import { useSession } from '@/features/auth/SessionProvider';

export default function Index() {
  const { session } = useSession();
  return <Redirect href={session ? '/trips' : '/login'} />;
}
