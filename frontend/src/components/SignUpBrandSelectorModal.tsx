import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import SignUpColorAnalysisModal from "./SignUpColorAnalysisModal";


const BRANDS = [
  { name: "Amazon", logo: "" },
  { name: "Nykaa", logo: "" },
  { name: "Myntra", logo: "" },
  { name: "Flipkart", logo: "" },
  { name: "Zara", logo: "" },
  { name: "H&M", logo: "" },
  { name: "Levis", logo: "" },
  { name: "Lifestyle", logo: "" },
  { name: "Max Fashion", logo: "" },
  { name: "Urbanic", logo: "" }
];

export default function SignUpBrandSelectorModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState<"brands"|"gender"|"body">("brands");
  const [showColorModal, setShowColorModal] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [selectedBodyType, setSelectedBodyType] = useState<string>("");

  function toggleBrand(brand: string) {
    setSelected(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-0">
            <div className="p-6 pb-2">
              {step === "brands" && (
                <>
                  <div className="text-xs text-rose-500 font-semibold mb-2">Step 4 of 5</div>
                  <DialogHeader className="text-left">
                    <DialogTitle className="text-lg font-bold mb-1">Select your favorite brands</DialogTitle>
                    <DialogDescription className="text-neutral-600 mb-2">
                      Choose one or more brands you love shopping from
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 my-4">
                    {BRANDS.map(b => (
                      <button
                        key={b.name}
                        className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-base font-medium transition-all ${selected.includes(b.name) ? 'bg-blue-100 border-blue-600 text-blue-800' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}
                        onClick={() => toggleBrand(b.name)}
                      >
                        <span className="text-xl">{b.logo}</span> {b.name}
                      </button>
                    ))}
                  </div>
                  <Button className="w-full mt-6 mb-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2" onClick={() => setStep("gender")}>Continue</Button>
                </>
              )}
              {step === "gender" && (
                <>
                  <div className="text-xs text-rose-500 font-semibold mb-2">Step 5 of 5</div>
                  <DialogHeader className="text-left">
                    <DialogTitle className="text-lg font-bold mb-1">What's your gender?</DialogTitle>
                    <DialogDescription className="text-neutral-600 mb-2">
                      Please select your gender to personalize your experience.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-4 my-4">
                    {['male','female','other'].map(g => (
                      <button
                        key={g}
                        className={`flex-1 border rounded-lg px-3 py-2 text-base font-medium transition-all ${selectedGender === g ? 'bg-blue-100 border-blue-600 text-blue-800' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}
                        onClick={() => setSelectedGender(g)}
                      >
                        {g.charAt(0).toUpperCase()+g.slice(1)}
                      </button>
                    ))}
                  </div>
                  <Button className="w-full mt-6 mb-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2" disabled={!selectedGender} onClick={() => setStep("body")}>Continue</Button>
                </>
              )}
              {step === "body" && (
                <>
                  <div className="text-xs text-rose-500 font-semibold mb-2">Step 5 of 5</div>
                  <DialogHeader className="text-left">
                    <DialogTitle className="text-lg font-bold mb-1">Select your body type</DialogTitle>
                    <DialogDescription className="text-neutral-600 mb-2">
                      Please select the body type that best describes you.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 my-4">
                    {(selectedGender === 'male' ? [
                      { label: "Ectomorph (Lean)", value: "ectomorph" },
                      { label: "Mesomorph (Athletic)", value: "mesomorph" },
                      { label: "Endomorph (Broad)", value: "endomorph" }
                    ] : selectedGender === 'female' ? [
                      { label: "Hourglass", value: "hourglass" },
                      { label: "Pear", value: "pear" },
                      { label: "Apple", value: "apple" },
                      { label: "Rectangle", value: "rectangle" }
                    ] : [
                      { label: "Lean", value: "lean" },
                      { label: "Athletic", value: "athletic" },
                      { label: "Broad", value: "broad" }
                    ]).map(t => (
                      <button
                        key={t.value}
                        className={`w-full border rounded-lg px-3 py-2 text-base font-medium transition-all ${selectedBodyType === t.value ? 'bg-blue-100 border-blue-600 text-blue-800' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}
                        onClick={() => setSelectedBodyType(t.value)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <Button className="w-full mt-6 mb-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2" disabled={!selectedBodyType} onClick={() => setShowColorModal(true)}>
                    Continue
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <SignUpColorAnalysisModal
        open={showColorModal}
        onOpenChange={(open) => {
          setShowColorModal(open);
          // Onboarding data travels via SignUpUserContext and navigation state.
          if (!open) onOpenChange(false);
        }}
        brands={selected}
        gender={selectedGender}
        bodyType={selectedBodyType}
      />
    </>
  );
}
