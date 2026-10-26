import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

import pricingBg from "@/assets/pricingbg.png";
import bottomMid from "@/assets/bottom mid.png";
import bottomRight from "@/assets/bottom right.png";
import bottomLeft from "@/assets/bottomleft.png";
import middleGirl from "@/assets/middlegirl.png";
import topGirl from "@/assets/top girl.png";
import topRight from "@/assets/top right.png";
import topLeft from "@/assets/topleft.png";

import pic1 from "@/assets/favoutfitimg/pic1.png";
import pic2 from "@/assets/favoutfitimg/pic2.png";
import pic3 from "@/assets/favoutfitimg/pic3.png";
import pic4 from "@/assets/favoutfitimg/pic4.png";
import pic5 from "@/assets/favoutfitimg/pic5.png";
import pic6 from "@/assets/favoutfitimg/pic6.png";
import pic7 from "@/assets/favoutfitimg/pic7.png";
import pic8 from "@/assets/favoutfitimg/pic8.png";

const Pricing = () => {
  const plans = [
    {
      name: "Just Getting Started",
      price: "$4",
      period: "one-time",
      description: "Perfect if you just want to try it out.",
      features: [
        "Your complete color analysis",
        "Personal color palette", 
        "Shopping guide with your colors",
        "Downloadable style card",
        "Basic outfit suggestions"
      ],
      buttonText: "Get My Color Analysis",
      popular: false
    },
    {
      name: "All-In Style Transformation", 
      price: "$12",
      period: "per month",
      description: "For when you're ready to completely upgrade your style.",
      features: [
        "Everything in basic, plus:",
        "Monthly personalized lookbooks",
        "Access to our stylist community", 
        "Video styling tutorials",
        "Priority support from real stylists",
        "Seasonal wardrobe updates"
      ],
      buttonText: "Transform My Style",
      popular: true
    }
  ];

  return (
    <div>
      <section id="pricing" className="py-24 relative" style={{ backgroundImage: `url(${pricingBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center md:items-stretch justify-between gap-10 min-h-[500px]">
            {/* Left: Text */}
            <div className="flex flex-col justify-center md:w-1/2 text-left">
              <h2 className="text-4xl md:text-5xl font-playfair font-bold text-black mb-2 mt-8">
                Personalized Outfits & Style Inspiration
              </h2>
              <p className="text-sm md:text-base text-black mb-6 max-w-lg">
                Not sure how to style it? TUFF’s got you. From full outfit ideas to the latest trends, get personalized looks that match your vibe and elevate your style effortlessly.
              </p>
            </div>

            {/* Right: Collage of Outfits */}
            <div className="relative md:w-1/2 flex items-center justify-center min-h-[600px] ml-8">
              {/* Top left */}
              <img src={topLeft} alt="Top Left" className="absolute left-0 top-0 w-32 md:w-40 rounded-xl shadow-lg z-10" style={{top: '10px', left: '10px'}} />
              {/* Top middle */}
              <img src={topGirl} alt="Top Girl" className="absolute left-1/2 top-0 w-36 md:w-44 rounded-xl shadow-lg z-10" style={{transform: 'translateX(-50%)', top: '0px'}} />
              {/* Top right */}
              <img src={topRight} alt="Top Right" className="absolute right-0 top-6 w-28 md:w-36 rounded-xl shadow-lg z-10" style={{right: '0px', top: '40px'}} />

              {/* Center right */}
              <img src={bottomRight} alt="Bottom Right" className="absolute right-0 top-1/2 w-32 md:w-40 rounded-xl shadow-lg z-10" style={{right: '0px', top: '220px'}} />

              {/* Center left */}
              <img src={bottomLeft} alt="Bottom Left" className="absolute left-0 top-1/2 w-32 md:w-40 rounded-xl shadow-lg z-10" style={{left: '0px', top: '260px'}} />

              {/* Bottom left */}
              <img src={bottomMid} alt="Bottom Mid" className="absolute left-1/4 bottom-0 w-32 md:w-40 rounded-xl shadow-lg z-30" style={{left: '70px', bottom: '10px'}} />

              {/* Bottom right */}
              <img src={topLeft} alt="Top Left" className="absolute right-0 bottom-0 w-32 md:w-40 rounded-xl shadow-lg z-10" style={{right: '10px', bottom: '10px'}} />

              {/* Center: Middle Girl (largest, top z) */}
              <img src={middleGirl} alt="Middle Girl" className="absolute left-1/2 top-1/2 w-60 md:w-96 rounded-2xl shadow-2xl z-20" style={{transform: 'translate(-50%, -50%)', top: '50%', left: '50%'}} />
            </div>

          </div>
        </div>
      </section>

      <section className="bg-black relative overflow-hidden">
        <div className="container mx-auto px-6 py-80 flex flex-col items-center justify-center text-center relative z-20">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">Your Next Favorite Outfit Is Just a Click Away</h2>
          <p className="text-lg md:text-2xl text-white/80 max-w-2xl">Get style inspiration, smart shopping, and personalized outfit suggestions—all in one place.</p>
        </div>
        {/* Top row images */}
        <img src={pic1} alt="fav1" className="absolute top-8 left-1/4 w-24 md:w-32 rounded-xl shadow-lg z-10 animate-x-move-slow" />
        <img src={pic2} alt="fav2" className="absolute top-24 left-1/2 w-24 md:w-32 rounded-xl shadow-lg z-10 animate-x-move" style={{transform: 'translateX(-50%)'}} />
        <img src={pic3} alt="fav3" className="absolute top-8 right-1/4 w-24 md:w-32 rounded-xl shadow-lg z-10 animate-x-move-slower" />
        {/* Side images */}
        <img src={pic4} alt="fav4" className="absolute top-1/2 left-8 w-24 md:w-32 rounded-xl shadow-lg z-10 animate-x-move" style={{transform: 'translateY(-50%)'}} />
        <img src={pic5} alt="fav5" className="absolute top-1/2 right-8 w-24 md:w-32 rounded-xl shadow-lg z-10 animate-x-move-slow" style={{transform: 'translateY(-50%)'}} />
        {/* Bottom row images */}
        <img src={pic6} alt="fav6" className="absolute bottom-8 left-1/4 w-24 md:w-32 rounded-xl shadow-lg z-10 animate-x-move-slower" />
        <img src={pic7} alt="fav7" className="absolute bottom-0 left-1/2 w-24 md:w-32 rounded-xl shadow-lg z-10 animate-x-move" style={{transform: 'translateX(-50%)'}} />
        <img src={pic8} alt="fav8" className="absolute bottom-8 right-1/4 w-24 md:w-32 rounded-xl shadow-lg z-10 animate-x-move-slow" />
      </section>
    </div>
  );
};

export default Pricing;