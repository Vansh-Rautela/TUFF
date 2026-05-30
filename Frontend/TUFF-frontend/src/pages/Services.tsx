import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Palette, Shirt, Upload, Zap, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Services = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle pt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
            Your Style, <span className="text-primary">Perfected</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose your path to discovering your perfect style with our AI-powered analysis tools
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1: Color Analysis */}
          <Card id="color-analysis" className="relative overflow-hidden group hover:shadow-premium transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Palette className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-playfair">Color Analysis</CardTitle>
              <CardDescription className="text-base">
                Discover your perfect color palette based on your skin undertone and natural features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-primary" />
                  <span className="text-sm">Upload your photo</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-sm">AI analyzes your undertones</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="text-sm">Get your personalized palette</span>
                </div>
              </div>
              <Button className="w-full" asChild>
                <Link to="/color-analysis">Start Color Analysis</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Virtual Try-On */}
          <Card className="relative overflow-hidden group hover:shadow-premium transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-playfair">Virtual Try-On</CardTitle>
              <CardDescription className="text-base">
                See how different styles and colors look on you before you buy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-primary" />
                  <span className="text-sm">Upload your photo</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-sm">Try on virtual outfits</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="text-sm">Save your favorites</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Card 3: Outfit Analyzer */}
          <Card className="relative overflow-hidden group hover:shadow-premium transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shirt className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-playfair">Outfit Analyzer</CardTitle>
              <CardDescription className="text-base">
                Get instant feedback on your outfit combinations and styling choices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-primary" />
                  <span className="text-sm">Upload outfit photos</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-sm">AI analyzes your style</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="text-sm">Get improvement tips</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Button variant="ghost" asChild>
            <Link to="/">
              ← Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Services;