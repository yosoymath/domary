import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}
