import Link from "next/link";
import { AccountMenuClient } from "@/components/layout/account-menu-client";
import { getCurrentUser } from "@/lib/auth/current-user";

function UserIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="M19 21a7 7 0 0 0-14 0m11-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function AccountMenuFallback() {
  return (
    <Link className="focus-ring grid size-10 place-items-center rounded-full transition-colors hover:bg-black/5" href="/login" aria-label="Minha conta">
      <UserIcon />
    </Link>
  );
}

export async function AccountMenu() {
  const user = await getCurrentUser();

  if (!user) return <AccountMenuFallback />;

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const firstName = user.name.split(/\s+/)[0];

  return <AccountMenuClient firstName={firstName} initials={initials} user={user} />;
}
