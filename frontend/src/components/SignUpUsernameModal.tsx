import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { X, Check } from "lucide-react";
import SignUpBrandSelectorModal from "./SignUpBrandSelectorModal";

const suggestedUsernames = [
  "ashwinsajin200505",
  "45hwin54jin2005"
];

export default function SignUpUsernameModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [username, setUsername] = useState("ashwinsajin2005");
  const [showBrandModal, setShowBrandModal] = useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-xl p-0 overflow-visible">
          <div className="bg-white rounded-xl shadow-lg p-0">
            <div className="p-6 pb-2">
              <div className="text-xs text-rose-500 font-semibold mb-2">Step 3 of 5</div>
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg font-bold mb-1">Choose your username</DialogTitle>
                <DialogDescription className="text-neutral-600 mb-2">
                  You can change this in your TUFF settings
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 mb-2 text-sm font-medium">Username</div>
              <div className="flex items-center border-b-2 border-neutral-300 mb-3">
                <input
                  className="flex-1 px-2 py-2 text-lg outline-none bg-transparent"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
                <button className="p-1" onClick={() => setUsername("")}> <X className="w-5 h-5 text-neutral-400" /> </button>
                <button className="p-1"> <Check className="w-5 h-5 text-blue-600" /> </button>
              </div>
              <div className="flex gap-2 mb-4">
                {suggestedUsernames.map(s => (
                  <button
                    key={s}
                    className={`px-3 py-1 rounded-full border ${username === s ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-neutral-100 border-neutral-200 text-neutral-600'}`}
                    onClick={() => setUsername(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Button className="w-full mt-6 mb-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2" onClick={() => setShowBrandModal(true)}>
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <SignUpBrandSelectorModal open={showBrandModal} onOpenChange={setShowBrandModal} />
    </>
  );
}
