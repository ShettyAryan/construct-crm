export type PocLike = {
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isPrimary?: boolean;
};

export function getPrimaryPoc<T extends PocLike>(pocs: T[] | undefined | null): T | undefined {
  if (!pocs?.length) return undefined;
  return pocs.find((p) => p.isPrimary) ?? pocs[0];
}

export function formatPocName(pocs: PocLike[] | undefined | null): string {
  return getPrimaryPoc(pocs)?.name ?? "No POC";
}
