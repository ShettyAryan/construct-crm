import { requireAdmin, getCurrentProfile } from "@/lib/auth";
import { listProfiles } from "@/lib/actions/profiles";
import { ProfilesView } from "@/components/profiles/profiles-view";

export default async function ProfilesPage() {
  await requireAdmin();
  const [profiles, me] = await Promise.all([
    listProfiles(),
    getCurrentProfile(),
  ]);

  return <ProfilesView profiles={profiles} currentId={me?.id ?? ""} />;
}
