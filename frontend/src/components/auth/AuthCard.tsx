import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-[22px] border border-border bg-surface p-6 sm:p-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SkillShift home">
          <BrandMark className="shrink-0" />
          <span className="text-[17px] font-bold tracking-tight">SkillShift</span>
        </Link>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 text-[15px] leading-7 text-text-muted">{subtitle}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
      {footer && (
        <p className="mt-4 text-center text-sm text-text-muted">{footer}</p>
      )}
    </div>
  );
}
