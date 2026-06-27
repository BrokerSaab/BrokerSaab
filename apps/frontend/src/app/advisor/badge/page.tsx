'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BadgeRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/advisor/subscription'); }, [router]);
  return null;
}
