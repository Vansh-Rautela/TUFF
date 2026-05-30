import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const GENDERS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

export default function SignUpGenderModal({ open, onOpenChange, onGenderSelect }: { open: boolean, onOpenChange: (open: boolean) => void, onGenderSelect: (gender: string) => void }) {
  const [selected, setSelected] = useState<string>("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl p-0 overflow-visible">
        <div className="bg-white rounded-xl shadow-lg p-0">
          <div className="p-6 pb-2">
            <div className="text-xs text-rose-500 font-semibold mb-2">Step 5 of 5</div>
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-bold mb-1">What's your gender?</DialogTitle>
              <DialogDescription className="text-neutral-600 mb-2">
                Please select your gender to personalize your experience.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 my-4">
              {GENDERS.map(g => (
                <button
                  key={g.value}
                  className={`flex-1 border rounded-lg px-3 py-2 text-base font-medium transition-all ${selected === g.value ? 'bg-blue-100 border-blue-600 text-blue-800' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}
                  onClick={() => setSelected(g.value)}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <Button className="w-full mt-6 mb-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2" disabled={!selected} onClick={() => { onGenderSelect(selected); onOpenChange(false); }}>
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
