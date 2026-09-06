'use client';
import { useEnv } from '@/lib/useEnv';
import EnvSwitcher from '@/components/shared/EnvSwitcher';
import CredentialInfo from '@/components/shared/CredentialInfo';

export default function DashboardEnvSection() {
  const [env, setEnv, isMounted] = useEnv('development');

  if (!isMounted) return null;

  return (
    <>
      <EnvSwitcher env={env} setEnv={setEnv} />
      <CredentialInfo env={env} />
    </>
  );
}
