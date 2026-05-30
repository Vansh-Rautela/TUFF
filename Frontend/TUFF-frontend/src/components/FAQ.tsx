import { useState } from "react";
import { ChevronDown } from "lucide-react";
import promptPhoto from "@/assets/promptphoto.png";
import pic1 from "@/assets/favoutfitimg/pic1.png";
import pic2 from "@/assets/favoutfitimg/pic2.png";
import pic3 from "@/assets/favoutfitimg/pic3.png";
import pic4 from "@/assets/favoutfitimg/pic4.png";
import pic5 from "@/assets/favoutfitimg/pic5.png";
import pic6 from "@/assets/favoutfitimg/pic6.png";
import pic7 from "@/assets/favoutfitimg/pic7.png";
import pic8 from "@/assets/favoutfitimg/pic8.png";
import pricingbg from "@/assets/pricingbg.png";

const SmartOutfitAnalyzer = () => {
  return (
    <section className="py-16 min-h-[70vh] relative overflow-hidden" style={{ backgroundImage: `url(${pricingbg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 z-0" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-start gap-10 md:gap-20">
          <div className="flex-1 pt-6 md:pt-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-black">Smart Outfit Analyzer</h2>
            <p className="text-base md:text-lg mb-6 text-black max-w-xl">Wondering if it suits you? <b>TUFF</b> gives you instant, AI-powered outfit feedback—styled just for you.<br/><br/>Want a more playful or premium version too?</p>
          </div>
          <div className="flex-1 flex justify-center items-start pt-2">
            <img src={promptPhoto} alt="Prompt Example" className="rounded-2xl shadow-xl w-40 md:w-56 object-cover" />
          </div>
        </div>
        {/* LLM reply */}
        <div className="mt-12 mb-4 flex justify-end">
          <div className="bg-neutral-100 text-black rounded-xl shadow px-6 py-4 max-w-2xl">
            <span className="font-semibold">TUFF AI:</span> This outfit is a great match for your style! The color palette complements your skin tone, and the silhouette is modern yet flattering. If you want to add a playful twist, try a bold accessory or a pop of color in your shoes. For a premium look, layer with a tailored jacket or statement bag.
          </div>
        </div>
        {/* Image scroll */}
        <div className="overflow-x-auto mt-6 pb-2">
          <div className="flex gap-6 min-w-max">
            {[pic1, pic2, pic3, pic4, pic5, pic6, pic7, pic8].map((img, idx) => (
              <img key={idx} src={img} alt={`outfit ${idx+1}`} className="w-36 h-44 object-cover rounded-xl shadow-lg" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SmartOutfitAnalyzer;