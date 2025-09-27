import { Suspense } from 'react';
import { ReferralLanding } from '@/components/referral/ReferralLanding';

interface ReferralPageProps {
  params: {
    code: string;
  };
  searchParams: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
}

export default function ReferralPage({ params, searchParams }: ReferralPageProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ReferralLanding
        code={params.code}
        utmParams={searchParams}
      />
    </Suspense>
  );
}