"use client";
import { useAccountData } from "@/lib/accountData";
import { emptyProfile, isProfile, type Profile } from "@/lib/profile";
import StudentProfile from "@/components/StudentProfile";

export default function MyProfilePage() {
  const account = useAccountData<Profile>("profile", emptyProfile, isProfile);
  return (
    <StudentProfile key={account.ownerId ?? "signed-out"} account={account} />
  );
}
