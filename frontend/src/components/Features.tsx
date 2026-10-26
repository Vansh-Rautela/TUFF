
import curatedImage from "@/assets/feature-curated.jpg";
import paletteImage from "@/assets/feature-palette.jpg";
import analysisImage from "@/assets/feature-analysis.jpg";

const Features = () => {
  const features = [
    {
      title: "No More Shopping Mistakes",
      description: "Stop buying clothes that end up unworn in your closet. Get pieces that actually work with your skin tone and body.",
      image: curatedImage,
    },
    {
      title: "Your Personal Color Story", 
      description: "Discover the colors that make you glow. Our AI analyzes your unique features to find your perfect palette.",
      image: paletteImage,
    },
    {
      title: "Instant Style Confidence",
      description: "Upload a selfie, get your results in minutes. No appointments, no guessing—just clarity about what works for you.",
      image: analysisImage,
    },
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-black mb-6">
            We've all been there...
          </h2>
          <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
            Standing in your closet full of clothes with "nothing to wear." Let's fix that together.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
            
              key={index}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-premium transition-smooth border border-neutral-200"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-playfair font-semibold text-black mb-3">
                  {feature.title}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {feature.description}
                </p>
              </div>
              <div className="absolute top-6 left-6 bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;