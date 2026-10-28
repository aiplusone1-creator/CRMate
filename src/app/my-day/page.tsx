'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyDayPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/my-week');
  }, [router]);

  return null;
}
