'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewQuotationRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/quotations?action=new');
  }, [router]);

  return (
    <div className="p-12 text-center text-slate-400 font-bold text-sm">
      Opening New Quotation...
    </div>
  );
}
