import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUp, Sparkles } from "lucide-react";

import { ProductCard } from "@/components/product/ProductCard";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useSaved } from "@/hooks/useSaved";
import { useUser } from "@/hooks/useUser";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/api";

interface Message {
  role: "user" | "stylist";
  text: string;
  products?: Product[];
}

const SUGGESTIONS = ["Which colours suit me?", "Outfit for a wedding", "Show me linen shirts", "What to wear to an interview"];

export function StylistLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-3 rounded-full bg-ink pl-5 pr-6 text-ivory shadow-[0_18px_50px_-15px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-couture hover:-translate-y-0.5"
        aria-label="Ask the TUFF Stylist"
      >
        <Sparkles className="h-4 w-4 text-champagne" strokeWidth={1.5} />
        <span className="text-[0.68rem] font-medium uppercase tracking-[0.24em]">Stylist</span>
      </button>
      <StylistDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}

export function StylistDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { userId, profile } = useUser();
  const saved = useSaved();
  const health = useQuery({ queryKey: ["health"], queryFn: api.health, enabled: open, staleTime: 300_000 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const chat = useMutation({
    mutationFn: (text: string) => api.chat(userId, text),
    onSuccess: (reply) => setMessages((m) => [...m, { role: "stylist", text: reply.reply, products: reply.products }]),
    onError: (error) => setMessages((m) => [...m, { role: "stylist", text: errorMessage(error) }]),
  });

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, chat.isPending]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chat.isPending) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    chat.mutate(trimmed);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 border-l-0 bg-ivory p-0 sm:max-w-[30rem]">
        <div className="border-b border-hairline px-8 pb-6 pt-10">
          <p className="eyebrow">{health.data?.stylist === "gemini" ? "Powered by Gemini" : "Concierge"}</p>
          <SheetTitle className="mt-2 font-display text-4xl font-light">The Stylist</SheetTitle>
          <SheetDescription className="mt-2 text-sm text-stone">
            {profile?.season ? `Advising for your ${profile.season} palette.` : "Ask about colours, occasions or pieces to find."}
          </SheetDescription>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-8 py-8">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="font-display text-2xl font-light italic text-graphite">How may I help you dress today?</p>
              <div className="flex flex-wrap gap-2 pt-4">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="rounded-full border border-hairline px-4 py-2 text-xs text-graphite transition-colors hover:border-ink">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message, i) => (
            <div key={i} className={cn("flex flex-col", message.role === "user" ? "items-end" : "items-start")}>
              <p className={cn("max-w-[88%] text-sm leading-relaxed",
                message.role === "user" ? "bg-ink px-4 py-3 text-ivory" : "border-l border-champagne pl-4 text-graphite")}>
                {message.text}
              </p>
              {message.products && message.products.length > 0 && (
                <div className="-mx-8 mt-5 flex w-[calc(100%+4rem)] snap-x gap-4 overflow-x-auto px-8 pb-2">
                  {message.products.map((p) => (
                    <div key={p.id} className="w-40 shrink-0 snap-start">
                      <ProductCard product={p} compact saved={saved.isSaved(p.id)} onToggleSave={saved.toggle} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {chat.isPending && <p className="eyebrow animate-pulse">The stylist is considering…</p>}
          <div ref={endRef} />
        </div>

        <form className="flex items-center gap-3 border-t border-hairline px-6 py-4"
          onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000}
            placeholder="Ask anything about your style…" aria-label="Message the stylist"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-stone" />
          <button type="submit" disabled={!input.trim() || chat.isPending} aria-label="Send"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-ivory disabled:opacity-30">
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
