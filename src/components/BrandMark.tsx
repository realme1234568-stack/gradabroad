import Image from "next/image";

// The adjacent wordmark provides the accessible name; the mark is decorative.
export default function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return <Image src="/brand/gradabroad-mark-128.png" width={size} height={size} alt="" aria-hidden="true" className={`shrink-0 rounded-full ${className}`} />;
}
