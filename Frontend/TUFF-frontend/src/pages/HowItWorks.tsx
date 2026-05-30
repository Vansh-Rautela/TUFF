import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Zap, Palette, ShoppingBag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Upload,
      title: "Upload Your Photo",
      description: "Take a quick selfie or upload a photo in natural lighting. Our AI works best with clear, well-lit images of your face.",
      details: ["Natural daylight preferred", "Face the camera directly", "Remove makeup for accuracy"]
    },
    {
      icon: Zap,
      title: "AI Analysis",
      description: "Our advanced AI analyzes your skin undertones, facial features, and natural coloring to determine your unique style profile.",
      details: ["Skin undertone detection", "Face shape analysis", "Color harmony calculation"]
    },
    {
      icon: Palette,
      title: "Get Your Palette",
      description: "Receive your personalized color palette with specific shades that enhance your natural beauty and make you look radiant.",
      details: ["Colors that enhance you", "Colors to avoid", "Seasonal color type"]
    },
    {
      icon: ShoppingBag,
      title: "Shop With Confidence",
      description: "Browse curated clothing and accessories in your perfect colors. Never wonder if something will look good on you again.",
      details: ["Personalized recommendations", "Color-filtered shopping", "Style confidence boost"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle pt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
            How <span className="text-primary">TUFF</span> Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover your perfect style in 4 simple steps using our AI-powered color analysis technology
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {steps.map((step, index) => (
            <Card key={index} className="relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center p-6">
                <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-sm font-semibold text-primary">
                      Step {index + 1}
                    </span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-playfair font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-lg">
                    {step.description}
                  </p>
                  <ul className="space-y-1">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="text-sm text-muted-foreground flex items-center justify-center md:justify-start">
                        <ArrowRight className="w-3 h-3 text-primary mr-2" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button size="lg" onClick={() => navigate('/services')}>
            Ready to Start? Find My Colors
          </Button>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;