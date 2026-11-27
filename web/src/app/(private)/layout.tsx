import type { ReactNode } from 'react';
import { PrivateShell } from '../../features/session/private-shell';
import { requireProfile } from '../../lib/session';

export default async function Layout({ children }: { children: ReactNode }) {
  const profile = await requireProfile();
  return <PrivateShell profile={profile}>{children}</PrivateShell>;
}
