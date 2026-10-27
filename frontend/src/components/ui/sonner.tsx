import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = (props: ToasterProps) => (
  <Sonner
    position="bottom-center"
    className="toaster group"
    toastOptions={{
      classNames: {
        toast:
          "group toast !rounded-none !border-ink/10 !bg-ink !text-ivory !font-sans !shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]",
        title: "!text-[0.72rem] !uppercase !tracking-[0.2em] !font-medium",
        description: "!text-ivory/60 !text-xs !normal-case !tracking-normal",
        actionButton: "!bg-champagne !text-ink",
      },
    }}
    {...props}
  />
);

export { Toaster };
