import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { useSignUpUser } from "@/context/SignUpUserContext";
import { ColorCircle } from "./../components/ColorCircle";

import { useNavigate } from 'react-router-dom';

export default function SignUpColorAnalysisModal({
  open,
  onOpenChange,
  brands = [],
  gender = '',
  bodyType = ''
}: {
  open: boolean,
  onOpenChange: (open: boolean, colorAnalysis?: any, photoFile?: File | null) => void,
  brands?: string[],
  gender?: string,
  bodyType?: string
}) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoURL, setPhotoURL] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const { setUserData } = useSignUpUser();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoURL(URL.createObjectURL(file));
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl p-0 overflow-visible">
        <div className="bg-white rounded-xl shadow-lg p-0">
          <div className="p-6 pb-2">
            <div className="text-xs text-rose-500 font-semibold mb-2">Color Analysis</div>
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-bold mb-1">Upload a photo for color analysis</DialogTitle>
              <DialogDescription className="text-neutral-600 mb-2">
                This helps us analyze your skin tone and suggest the best colors for your style.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center my-4 gap-2">
              {photoURL ? (
                <img src={photoURL} alt="Uploaded" className="w-32 h-32 object-cover rounded-full border" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center rounded-full border bg-neutral-100 text-neutral-400">No photo</div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-2" onClick={() => fileInputRef.current?.click()}>
                {photo ? "Change Photo" : "Upload Photo"}
              </Button>
            </div>
            <Button
              className="w-full mt-6 mb-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2 disabled:opacity-70"
              disabled={!photo || loading}
              onClick={async () => {
                if (!photo) return;
                try {
                  setLoading(true);
                  // Read file as Data URL (base64)
                  const fileAsDataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(photo);
                  });

                  const resp = await fetch('http://localhost:5000/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: fileAsDataUrl })
                  });
                  const json = await resp.json();
                  if (!resp.ok || json.error) {
                    throw new Error(json.error || 'Analysis failed');
                  }

                  setAnalysisResult(json);
                  setShowResult(true);

                  // Save into signup user context for prompt generation later
                  setUserData({ colorAnalysisResult: json, photo });
                } catch (e) {
                  console.error(e);
                  alert('Could not analyze your photo. Please try another image with good lighting.');
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? 'Analyzing…' : 'Analyze & Continue'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    { /* Result Preview Modal */ }
    <Dialog open={showResult} onOpenChange={(isOpen) => setShowResult(isOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Your Color Analysis</DialogTitle>
          <DialogDescription>These results will be used to personalize product suggestions.</DialogDescription>
        </DialogHeader>
        {analysisResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-sm text-neutral-600">Skin Tone:</div>
              <div className="text-sm font-medium">{analysisResult.skintone?.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between"><span className="text-neutral-600">Undertone</span><span className="font-medium">{analysisResult.skintone?.undertone}</span></div>
              <div className="flex justify-between"><span className="text-neutral-600">Season</span><span className="font-medium">{analysisResult.skintone?.season}</span></div>
              <div className="flex justify-between"><span className="text-neutral-600">Brightness</span><span className="font-medium">{analysisResult.skintone?.brightness}</span></div>
              <div className="flex justify-between"><span className="text-neutral-600">Contrast</span><span className="font-medium">{analysisResult.skintone?.contrast}</span></div>
            </div>
            {Array.isArray(analysisResult.complementaryColors) && analysisResult.complementaryColors.length > 0 && (
              <div>
                <div className="text-sm text-neutral-600 mb-2">Suggested Colors</div>
                <div className="flex flex-wrap gap-3">
                  {analysisResult.complementaryColors.slice(0, 6).map((c: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="rounded-full w-6 h-6 border" style={{ backgroundColor: c.hex || c.color }} />
                      <span className="text-xs text-neutral-700">{c.name || c.hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {photoURL && (
              <div className="flex items-center gap-3">
                <img src={photoURL} alt="Uploaded" className="w-12 h-12 object-cover rounded-full border" />
                <span className="text-xs text-neutral-600">Photo saved for reference</span>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowResult(false)}>Back</Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  navigate('/product-suggestions', {
                    state: {
                      brands,
                      gender,
                      bodyType,
                      colorAnalysis: analysisResult,
                      photo: photoURL
                    }
                  });
                  if (onOpenChange) onOpenChange(false, analysisResult, photo);
                }}
              >
                See Products
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
