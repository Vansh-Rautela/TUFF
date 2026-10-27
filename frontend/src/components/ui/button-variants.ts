import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap font-sans text-[0.72rem] font-medium uppercase tracking-[0.22em] transition-all duration-500 ease-couture disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-ink text-ivory hover:bg-graphite",
        outline: "border border-ink/80 bg-transparent text-ink hover:bg-ink hover:text-ivory",
        ghost: "text-ink hover:bg-ink/5",
        light: "bg-ivory text-ink hover:bg-champagne-soft",
        "outline-light": "border border-ivory/70 text-ivory hover:bg-ivory hover:text-ink",
        link: "h-auto px-0 text-ink link-underline",
        destructive: "bg-bordeaux text-ivory hover:bg-bordeaux/90",
      },
      size: {
        default: "h-12 px-8",
        sm: "h-10 px-5 text-[0.66rem]",
        lg: "h-14 px-10",
        icon: "h-11 w-11 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
