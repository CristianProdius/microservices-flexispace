import Image from "next/image";
import type { ReactNode } from "react";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="auth-shell flex min-h-dvh flex-col bg-[var(--auth-subtle)]">
      <header className="flex items-center justify-center px-6 py-6">
        <Image
          src="/brand/wordmark_transparent.png"
          alt="Spacefly.ai"
          width={160}
          height={52}
          priority
          className="h-8 w-auto object-contain"
        />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="auth-card w-full max-w-lg rounded-[28px] bg-white p-8 text-[var(--auth-foreground)] sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
