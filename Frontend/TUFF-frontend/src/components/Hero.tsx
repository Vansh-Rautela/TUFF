import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import homepageVideo from "@/assets/homepage.mp4";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-black relative overflow-hidden">
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          <div className="text-center lg:text-left space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-playfair font-bold text-white leading-tight">
              Finally, fashion that{" "}
              <span className="text-white">actually works</span>{" "}
              for you
            </h1>
            <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
              Tired of buying clothes that look amazing on the rack but terrible on you?
              We get it. Let our AI figure out your perfect fashion so you can feel confident
              in everything you wear.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                variant="accent"
                size="lg"
                className="text-lg px-8 py-4"
                onClick={() => navigate('/swipe')}
              >
                Find My Style
              </Button>
              {/* <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => navigate('/how-it-works')}
              >
                See How It Works
              </Button> */}
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-premium">
              <video
                src={homepageVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover"
                aria-label="Fashion styling showcase"
              />
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-neutral-800 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;