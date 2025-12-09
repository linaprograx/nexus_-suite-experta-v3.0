// src/components/layout/GradientShell.tsx
import React from "react";

type CerebrityVariant = "creativity" | "lab";

interface GradientShellProps {
  /** "creativity" → Cerebrity, "lab" → The Lab */
  variant: CerebrityVariant;
  /** Contenido interno: normalmente las 3 columnas */
  children: React.ReactNode;
  /** Clases extra opcionales para tunear sin romper el layout base */
  className?: string;
  innerClassName?: string;
}

/**
 * Panel con gradiente vertical estilo Cerebrity (pixel-perfect):
 * - bg-gradient-to-b + from/to EXACTAMENTE como en CerebrityView.tsx.
 * - Grid de 3 columnas con las mismas medidas.
 * - rounded-3xl, overflow-hidden, p-6.
 */
export const GradientShell: React.FC<GradientShellProps> = ({
  variant,
  children,
  className,
  innerClassName,
}) => {
  const cx = (...values: Array<string | undefined | false>) =>
    values.filter(Boolean).join(" ");

  const backgroundClass =
    variant === "creativity"
      ? "from-[#7C3AED] via-[#7C3AED]/45 to-transparent dark:from-[#4C1D95] dark:via-[#4C1D95]/40 dark:to-transparent"
      : "from-[#06B6D4] via-[#06B6D4]/45 to-transparent dark:from-[#155E75] dark:via-[#155E75]/40 dark:to-transparent";

  return (
    <div
      className={cx(
        "flex-1 overflow-hidden rounded-3xl bg-gradient-to-b p-6",
        backgroundClass,
        className
      )}
    >
      <div
        className={cx(
          "grid grid-cols-1 lg:grid-cols-[310px,minmax(0,1fr),320px] gap-4 lg:gap-6 h-full min-h-0",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};
