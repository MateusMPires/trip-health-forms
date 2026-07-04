import { TravelerFormPage } from '@/features/traveler-form/components/TravelerFormPage';

// Public, no-auth route: /viagem/{codigo}. The code gates the whole submission server-side; the
// landing screen only validates it (via get_trip_public) to show the trip name.
export default async function Page({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  return <TravelerFormPage code={codigo} />;
}
