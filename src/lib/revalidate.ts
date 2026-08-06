import { revalidatePath } from "next/cache";

/** Refresh every surface that can show lead / deal data. */
export function revalidateCrm(leadId?: string | null) {
  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/tracks");
  revalidatePath("/clients");
  revalidatePath("/follow-ups");
  revalidatePath("/calls");
  revalidatePath("/meetings");
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export function revalidateTasks() {
  revalidatePath("/tasks");
  revalidatePath("/");
}
