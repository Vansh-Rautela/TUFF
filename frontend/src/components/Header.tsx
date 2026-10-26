import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SignInModal from "./SignInModal";
import whitebglogo from "@/assets/whitebglogo.jpg";

const Header = () => {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpen = params.get("signin") === "1";
    if (shouldOpen) {
      setIsSignInOpen(true);
    }
  }, [location.search]);

  const handleSignInOpenChange = (open: boolean) => {
    setIsSignInOpen(open);
    if (!open) {
      const params = new URLSearchParams(location.search);
      if (params.has("signin")) {
        params.delete("signin");
        navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
      }
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center text-2xl font-playfair font-bold text-black">
                {/* <img src={whitebglogo} alt="TUFF Logo" className="h-8 w-auto mr-2" /> */}
                TUFF
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-sm font-medium text-black hover:text-neutral-500 transition-smooth">
                  Features
                </a>
                <a href="#pricing" className="text-sm font-medium text-black hover:text-neutral-500 transition-smooth">
                  Pricing
                </a>
                <a href="#faq" className="text-sm font-medium text-black hover:text-neutral-500 transition-smooth">
                  FAQ
                </a>
                <button
                  onClick={() => navigate('/how-it-works')}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-smooth"
                >
                  How It Works
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-black bg-white hover:bg-neutral-100 border border-neutral-300" onClick={() => navigate('/swipe')}>
                Sign In
              </Button>
              <Button variant="default" size="sm" className="bg-black text-white hover:bg-neutral-900" onClick={() => navigate('/swipe')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>
      <SignInModal open={isSignInOpen} onOpenChange={handleSignInOpenChange} />
    </>
  );
};

export default Header;