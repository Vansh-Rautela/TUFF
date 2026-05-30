import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const BODY_TYPES: Record<string, { label: string; value: string }[]> = {
  male: [
    { label: "Ectomorph (Lean)", value: "ectomorph" },
    { label: "Mesomorph (Athletic)", value: "mesomorph" },
    { label: "Endomorph (Broad)", value: "endomorph" }
  ],
  female: [
    { label: "Hourglass", value: "hourglass" },
    { label: "Pear", value: "pear" },
    { label: "Apple", value: "apple" },
    { label: "Rectangle", value: "rectangle" }
  ],
  other: [
    { label: "Lean", value: "lean" },
    { label: "Athletic", value: "athletic" },
    { label: "Broad", value: "broad" }
  ]
};

export default function SignUpBodyTypeModal({ open, onOpenChange, gender }: { open: boolean, onOpenChange: (open: boolean) => void, gender: string }) {
  const [selected, setSelected] = useState<string>("");
  const types = BODY_TYPES[gender] || BODY_TYPES.other;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl p-0 overflow-visible">
        <div className="bg-white rounded-xl shadow-lg p-0">
          <div className="p-6 pb-2">
            <div className="text-xs text-rose-500 font-semibold mb-2">Step 5 of 5</div>
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-bold mb-1">Select your body type</DialogTitle>
              <DialogDescription className="text-neutral-600 mb-2">
                Please select the body type that best describes you.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 my-4">
              {types.map(t => (
                <button
                  key={t.value}
                  className={`w-full border rounded-lg px-3 py-2 text-base font-medium transition-all ${selected === t.value ? 'bg-blue-100 border-blue-600 text-blue-800' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}
                  onClick={() => setSelected(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Button className="w-full mt-6 mb-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2" disabled={!selected} onClick={() => onOpenChange(false)}>
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
