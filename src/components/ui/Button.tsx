import React from 'react';

export const Button = React.forwardRef<
  HTMLButtonElement | HTMLLabelElement,
  {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  } & (
    | ({ as?: 'button' } & React.ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ as: 'label' } & React.LabelHTMLAttributes<HTMLLabelElement>)
  )
>(({ className, variant = 'default', size = 'default', as: Component = 'button' as any, ...props }, ref) => {
  // Tailwind classes share specificity, so a caller's `bg-indigo-600` does NOT reliably beat the
  // variant's `bg-primary` — stylesheet order decides. In dark mode `--primary` is near-white, which
  // produced white-on-white buttons. Drop the conflicting variant tokens when the caller overrides them.
  const dedupeVariant = (variantCls: string, custom?: string) => {
    if (!custom) return variantCls;
    const hasBg = /(^|\s|:)bg-/.test(custom);
    const hasBorderColor = /(^|\s)border-(?!\d)[a-z]/.test(custom);
    const hasTextColor = /(^|\s|:)text-(white|black|transparent|current|inherit|primary|secondary|accent|destructive|muted|[a-z]+-\d{2,3})/.test(custom);
    return variantCls
      .split(' ')
      .filter(c => {
        const base = c.replace(/^[a-z-]+:/, ''); // strip variants like hover:/dark:
        if (hasBg && base.startsWith('bg-')) return false;
        if (hasTextColor && base.startsWith('text-')) return false;
        if (hasBorderColor && base.startsWith('border-')) return false;
        return true;
      })
      .join(' ');
  };

  const variants = {
    default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
    outline: 'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
  };
  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-10 rounded-md px-8',
    icon: 'h-9 w-9',
  };
  return <Component className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-fast ease-nexus active:scale-95 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${dedupeVariant(variants[variant], className)} ${sizes[size]} ${className || ''}`} ref={ref as any} {...(props as any)} />;
});
