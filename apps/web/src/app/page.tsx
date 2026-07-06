import { TravelerFormPage } from '@/features/traveler-form/components/TravelerFormPage';
import { DEFAULT_TRIP_CODE } from '@/lib/config';

// The root serves the form for the default trip (Viagem Missionária Guaiú), so travelers never
// need a code. Other trips are still reachable via /viagem/{codigo}.
export default function Home() {
  return <TravelerFormPage code={DEFAULT_TRIP_CODE} />;
}
