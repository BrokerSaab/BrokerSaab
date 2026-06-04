'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AdvisorsRedirectComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      router.replace(`/?category=${category}`);
    } else {
      router.replace('/');
    }
  }, [router, searchParams]);

  return null;
}

export default function AdvisorsRedirectPage() {
  return (
    <Suspense fallback={null}>
      <AdvisorsRedirectComponent />
    </Suspense>
  );
}
