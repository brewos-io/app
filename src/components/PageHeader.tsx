import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMobileLandscape } from "@/lib/useMobileLandscape";
import { isDemoMode } from "@/lib/demo-mode";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: PageHeaderProps) {
  const isMobileLandscape = useMobileLandscape();
  const isDemo = isDemoMode();

  // In landscape mode, title is shown in the Layout header, so only show action
  if (isMobileLandscape) {
    return action ? (
      <div className={cn("flex justify-end", className)}>{action}</div>
    ) : null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        // In demo mode, reduce top margin to bring title closer to nav
        isDemo ? "mt-0" : "mt-1 sm:mt-0",
        className
      )}
      style={{
        // In demo mode, add scroll-margin-top to prevent sticky header from covering the title
        // Banner (56px) + Header (64px) + Nav (~48px) + small buffer
        scrollMarginTop: isDemo ? "calc(56px + 4rem + 3rem + 0.5rem)" : undefined,
      }}
    >
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-theme">{title}</h1>
        {subtitle && <p className="text-theme-muted mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
