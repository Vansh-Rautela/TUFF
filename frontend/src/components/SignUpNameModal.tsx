import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SignUpNameModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl p-0 overflow-visible">
        <div className="bg-white rounded-xl shadow-lg p-0">
          <div className="p-6 pb-2">
            <div className="text-xs text-rose-500 font-semibold mb-2">Step 3 of 5</div>
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-bold mb-1">What's your name?</DialogTitle>
              <DialogDescription className="text-neutral-600 mb-2">
                Let us know how to address you on TUFF.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 mb-2 text-sm font-medium">Your name</div>
            <input
              className="w-full border-b-2 border-neutral-300 px-2 py-2 text-lg outline-none focus:border-blue-500 bg-transparent mb-5"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Button className="w-full mt-6 mb-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2" onClick={() => onOpenChange(false)}>
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
