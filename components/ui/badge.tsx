import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

// DESIGN.md §8.10 — semantic variants follow bg = semantic-100 / text = semantic-700 (light)
// and bg = semantic-900/40 / text = semantic-300 (dark). Sizes are 20/24/28px per spec.
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border border-transparent font-medium transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        // Semantic — §8.10
        success:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
        danger:
          "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
        warning:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        info: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
        neutral:
          "bg-neutral-200/70 text-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-300",
      },
      size: {
        xs: "h-5 px-2 py-0 text-[10px] tracking-wide",
        sm: "h-6 px-2.5 py-0 text-xs",
        md: "h-7 px-3 py-0 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  },
);

function Badge({
  className,
  variant = "default",
  size = "sm",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
      size,
    },
  });
}

export { Badge, badgeVariants };
