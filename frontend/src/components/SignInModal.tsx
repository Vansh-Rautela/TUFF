import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone } from "lucide-react";
import { useState } from "react";
import SignUpDOBModal from "./SignUpDOBModal";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SignInModal = ({ open, onOpenChange }: SignInModalProps) => {
  const [showDOBModal, setShowDOBModal] = useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-playfair">Welcome Back</DialogTitle>
            <DialogDescription>
              Sign in to your TUFF account to continue your style journey
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <Button 
              variant="outline" 
              className="w-full h-12 text-base"
              onClick={() => setShowDOBModal(true)}
            >
              <Mail className="w-5 h-5 mr-3" />
              Continue with Gmail
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12 text-base"
              onClick={() => setShowDOBModal(true)}
            >
              <Phone className="w-5 h-5 mr-3" />
              Continue with Phone
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button className="text-primary hover:underline font-medium" onClick={() => setShowDOBModal(true)}>
                Create one here
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <SignUpDOBModal open={showDOBModal} onOpenChange={setShowDOBModal} />
    </>
  );
};

export default SignInModal;