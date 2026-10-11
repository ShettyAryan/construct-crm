import type { AccessMap } from "@/lib/access";

export type SessionUser = {
  id: string;
  name: string;
  loginId: string;
  isAdmin: boolean;
  access: AccessMap;
};
