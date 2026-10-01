import Image from "next/image";

export default function TrLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`tr-logo tr-logo--float ${className}`} aria-hidden="true">
      <Image
        src="/assets/tr-logo.png"
        alt=""
        fill
        sizes="150px"
        className="object-contain"
      />
    </div>
  );
}
