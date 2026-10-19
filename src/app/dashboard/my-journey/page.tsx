"use client";
import MyJourney from '@/components/MyJourney';
import { useAccountData } from '@/lib/accountData';
import { emptyJourney, isJourneyProgress, type JourneyProgress } from '@/lib/journey';

export default function MyJourneyPage() {
  const account = useAccountData<JourneyProgress>('journey', emptyJourney, isJourneyProgress);
  return <MyJourney key={account.ownerId ?? 'signed-out'} account={account} />;
}
