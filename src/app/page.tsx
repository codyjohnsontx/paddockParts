import HomeClient from "@/components/home-client";
import { getInitialPayload } from "@/lib/data/server";

// Server Component: fetches the initial snapshot (Supabase or demo fallback)
// and hands a stable JSON payload to the client orchestrator. Keeps all
// interactivity client-side without paying for a blank first paint.
export default async function Page() {
  const payload = await getInitialPayload();
  return (
    <HomeClient
      initial={{
        event: payload.event,
        bikes: payload.bikes,
        installed: payload.installed,
        spares: payload.spares,
        checkIns: payload.checkIns,
        requests: payload.requests,
        responses: payload.responses,
      }}
    />
  );
}
