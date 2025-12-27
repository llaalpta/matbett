import React from 'react';

import { cn } from '@/lib/utils';

/**
 * Typography components basados en shadcn/ui
 * https://ui.shadcn.com/docs/components/typography
 * 
 * Proporciona componentes semánticos para texto con estilos consistentes
 */

export interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

// Heading components
export const TypographyH1 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = 'h1', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
TypographyH1.displayName = 'TypographyH1';

export const TypographyH2 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = 'h2', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
TypographyH2.displayName = 'TypographyH2';

export const TypographyH3 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
TypographyH3.displayName = 'TypographyH3';

export const TypographyH4 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = 'h4', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
TypographyH4.displayName = 'TypographyH4';

// Paragraph variants
export const TypographyP = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ children, className, as: Component = 'p', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "leading-7 not-first:mt-6",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
TypographyP.displayName = 'TypographyP';

export const TypographyLead = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ children, className, as: Component = 'p', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-xl text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
TypographyLead.displayName = 'TypographyLead';

export const TypographyLarge = React.forwardRef<HTMLDivElement, TypographyProps>(
  ({ children, className, as: Component = 'div', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-lg font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
TypographyLarge.displayName = 'TypographyLarge';

export const TypographySmall = React.forwardRef<HTMLElement, TypographyProps>(
  ({ children, className, as: Component = 'small', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
TypographySmall.displayName = 'TypographySmall';

export const TypographyMuted = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ children, className, as: Component = 'p', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
TypographyMuted.displayName = 'TypographyMuted';

// Blockquote
export const TypographyBlockquote = React.forwardRef<HTMLQuoteElement, TypographyProps>(
  ({ children, className, as: Component = 'blockquote', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "mt-6 border-l-2 pl-6 italic",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
TypographyBlockquote.displayName = 'TypographyBlockquote';

// Inline code
export const TypographyInlineCode = React.forwardRef<HTMLElement, TypographyProps>(
  ({ children, className, as: Component = 'code', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
TypographyInlineCode.displayName = 'TypographyInlineCode';

// List components
export const TypographyList = React.forwardRef<HTMLUListElement, TypographyProps>(
  ({ children, className, as: Component = 'ul', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "my-6 ml-6 list-disc [&>li]:mt-2",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
TypographyList.displayName = 'TypographyList';

// Table wrapper for better typography
export const TypographyTable = React.forwardRef<HTMLTableElement, TypographyProps>(
  ({ children, className, as: Component = 'table', ...props }, ref) => (
    <div className="w-full overflow-y-auto space-y-6">
      <Component
        ref={ref}
        className={cn(
          "w-full border-collapse overflow-hidden",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    </div>
  )
);
TypographyTable.displayName = 'TypographyTable';

// Export all components as a convenient object
export const Typography = {
  H1: TypographyH1,
  H2: TypographyH2,
  H3: TypographyH3,
  H4: TypographyH4,
  P: TypographyP,
  Lead: TypographyLead,
  Large: TypographyLarge,
  Small: TypographySmall,
  Muted: TypographyMuted,
  Blockquote: TypographyBlockquote,
  InlineCode: TypographyInlineCode,
  List: TypographyList,
  Table: TypographyTable,
};
