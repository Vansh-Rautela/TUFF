import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ColorCircle } from "@/components/ColorCircle";
import { Palette, Upload, Image as ImageIcon, Eye, Droplet, SlidersHorizontal, Info, ShoppingBag, Camera, ArrowLeft } from "lucide-react";
import Webcam from "react-webcam";
import { Link } from "react-router-dom";
import { api, errorMessage } from "@/lib/api";
import { ImageInputError, downscaleDataUrl, prepareImageForUpload } from "@/lib/image";
import { STORAGE_KEYS, getOrCreateUserId, writeJSON } from "@/lib/session";
import type { ColorAnalysisResult, SeasonPalette } from "@/types/fashion";
import { Badge } from "@/components/ui/badge";
import { SkintoneMatch } from "@/components/SkintoneMatch";
import { StyleLabel } from "@/components/StyleLabel";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

// Undertone classification
const undertones = ["Warm", "Cool", "Neutral"];

// Brightness and contrast levels
const brightnessLevels = ["Light", "Medium", "Deep"];
const contrastLevels = ["Low", "Medium", "High"];

const EMPTY_PALETTE: SeasonPalette = {
  season: "",
  key_characteristics: [],
  description: "",
  palettes: { primary: [], neutrals: [], accent: [], jewelry_metals: [] },
  color_relationships: { tonal: [], analogous: [], complementary_contrast: [] },
};

/** Fill any palette sections missing from the response so rendering never crashes. */
function withPalette(result: ColorAnalysisResult) {
  const palette = result.palette ?? EMPTY_PALETTE;
  return {
    skintone: result.skintone,
    description: result.description ?? "",
    palette: {
      ...EMPTY_PALETTE,
      ...palette,
      palettes: { ...EMPTY_PALETTE.palettes, ...palette.palettes },
      color_relationships: { ...EMPTY_PALETTE.color_relationships, ...palette.color_relationships },
    },
  };
}

const ColorAnalysisPage = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [analysisResult, setAnalysisResult] = useState<{
    skintone: {
      name: string;
      color: string;
      undertone: string;
      season: string;
      brightness: string;
      contrast: string;
    } | null;
    palette: {
      key_characteristics: string[];
      description: string;
      palettes: {
        primary: string[];
        neutrals: string[];
        accent: string[];
        jewelry_metals: string[];
      };
      color_relationships: {
        tonal: string[];
        analogous: string[];
        complementary_contrast: string[];
      };
    };
    description: string;
  }>({ 
    skintone: null,
    palette: {
      key_characteristics: [],
      description: "",
      palettes: { primary: [], neutrals: [], accent: [], jewelry_metals: [] },
      color_relationships: { tonal: [], analogous: [], complementary_contrast: [] }
    },
    description: ""
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      setImage(await prepareImageForUpload(file));
      setActiveTab("analyze");
    } catch (err) {
      toast.error(err instanceof ImageInputError ? err.message : "Please upload an image file");
    }
  };

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      downscaleDataUrl(imageSrc).then(setImage).catch(() => setImage(imageSrc));
      setIsWebcamOpen(false);
      setActiveTab("analyze");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!image) {
      toast.error("Please upload an image first");
      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await api.analyzeImage(image);
      setAnalysisResult(withPalette(result));
      setActiveTab("results");
      toast.success("Analysis complete!");
      // Reuse this result in onboarding and recommendations.
      writeJSON(STORAGE_KEYS.colorAnalysis, result);
      api.updateProfile(getOrCreateUserId(), { color_analysis: result })
        .catch((err) => console.error("Failed to save color analysis:", err));
    } catch (error) {
      toast.error(errorMessage(error, "An error occurred during analysis."));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AppLayout title="Color & Facial Analysis" hideSearch>
      {analysisResult.skintone && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button size="lg" asChild>
            <Link to={`/product-suggestions?colors=${encodeURIComponent(JSON.stringify([
              ...analysisResult.palette.palettes.primary,
              ...analysisResult.palette.palettes.neutrals,
              ...analysisResult.palette.palettes.accent
            ]))}`}>
              Suggest Outfit
            </Link>
          </Button>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Skin Tone & Seasonal Color Analysis
            </CardTitle>
            <CardDescription>
              Upload a clear selfie to analyze your skin tone, undertone, and seasonal color type
              for personalized fashion color recommendations.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="analyze" disabled={!image}>Analyze</TabsTrigger>
            <TabsTrigger value="results" disabled={!analysisResult.skintone}>Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-0">
            <Card>
              <CardContent className="p-6 space-y-6">
                <p className="text-center text-muted-foreground">
                  Upload a clear selfie in good lighting for accurate analysis
                </p>
                
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No image selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by uploading a photo or using your camera.</p>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload from Device
                    </Button>
                    <Dialog open={isWebcamOpen} onOpenChange={setIsWebcamOpen}>
                      <DialogTrigger asChild>
                        <Button variant="secondary">
                          <Camera className="mr-2 h-4 w-4" />
                          Take a Photo
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Take a Photo</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center my-4 bg-black rounded-lg overflow-hidden">
                          <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            width={1280}
                            height={720}
                            videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                            className="transform scale-105"
                          />
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="ghost">Cancel</Button>
                          </DialogClose>
                          <Button onClick={handleCapture}>Capture Photo</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analyze" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="overflow-hidden">
                {image && (
                  <div className="relative overflow-hidden">
                    <img
                      src={image}
                      alt="Your selfie"
                      className="w-full aspect-square object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                      onClick={handleUploadClick}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Analyze</CardTitle>
                  <CardDescription>
                    We'll analyze your facial features to provide personalized color recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">This analysis will detect:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="flex gap-1 items-center">
                        <Droplet className="h-3 w-3" /> Skin Tone
                      </Badge>
                      <Badge variant="outline" className="flex gap-1 items-center">
                        <SlidersHorizontal className="h-3 w-3" /> Undertone
                      </Badge>
                      <Badge variant="outline" className="flex gap-1 items-center">
                        <Palette className="h-3 w-3" /> Seasonal Type
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">How it works:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
                      <li>We extract your skin color from the image</li>
                      <li>We analyze your undertone (warm, cool, neutral)</li>
                      <li>We determine your seasonal color type</li>
                      <li>We recommend complementary colors for your wardrobe</li>
                    </ol>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? "Analyzing..." : "Analyze My Features"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="mt-0">
            {analysisResult.skintone && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Color Analysis Results</CardTitle>
                    <CardDescription>
                      Based on your skin tone, we've determined your personal color profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <SkintoneMatch 
                        name={analysisResult.skintone.name}
                        color={analysisResult.skintone.color}
                        undertone={analysisResult.skintone.undertone}
                        season={analysisResult.skintone.season}
                        brightness={analysisResult.skintone.brightness}
                        contrast={analysisResult.skintone.contrast}
                      />
                    </div>
                    {/* Key Characteristics */}
                    {analysisResult.palette.key_characteristics.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {analysisResult.palette.key_characteristics.map((char, idx) => (
                          <Badge key={char+idx} variant="outline">{char}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Your Seasonal Color Palette</CardTitle>
                    <CardDescription>
                      {analysisResult.palette.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-8 py-4 justify-center">
                      <div>
                        <div className="font-semibold mb-2 text-center">Primary Colors</div>
                        <div className="flex gap-2 justify-center">
                          {analysisResult.palette.palettes.primary.map((color, idx) => (
                            <ColorCircle key={"primary-"+idx} color={color} name="Primary" size="lg" />
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold mb-2 text-center">Neutrals</div>
                        <div className="flex gap-2 justify-center">
                          {analysisResult.palette.palettes.neutrals.map((color, idx) => (
                            <ColorCircle key={"neutral-"+idx} color={color} name="Neutral" size="lg" />
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold mb-2 text-center">Accent Colors</div>
                        <div className="flex gap-2 justify-center">
                          {analysisResult.palette.palettes.accent.map((color, idx) => (
                            <ColorCircle key={"accent-"+idx} color={color} name="Accent" size="lg" />
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Jewelry Metals */}
                    {analysisResult.palette.palettes.jewelry_metals.length > 0 && (
                      <div className="mt-6 text-center">
                        <div className="font-semibold mb-2">Recommended Jewelry Metals</div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {analysisResult.palette.palettes.jewelry_metals.map((metal, idx) => (
                            <Badge key={"metal-"+idx} variant="secondary">{metal}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Color Relationships */}
                    <div className="mt-8">
                      <div className="font-semibold mb-2 text-center">Color Relationships</div>
                      <div className="flex flex-col md:flex-row gap-6 justify-center">
                        <div>
                          <div className="text-sm font-medium mb-1 text-center">Tonal</div>
                          <div className="flex gap-2 justify-center">
                            {analysisResult.palette.color_relationships.tonal.map((color, idx) => (
                              <ColorCircle key={"tonal-"+idx} color={color} name="Tonal" size="md" />
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1 text-center">Analogous</div>
                          <div className="flex gap-2 justify-center">
                            {analysisResult.palette.color_relationships.analogous.map((color, idx) => (
                              <ColorCircle key={"analogous-"+idx} color={color} name="Analogous" size="md" />
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1 text-center">Complementary Contrast</div>
                          <div className="flex gap-2 justify-center">
                            {analysisResult.palette.color_relationships.complementary_contrast.map((color, idx) => (
                              <ColorCircle key={"complementary-"+idx} color={color} name="Complementary" size="md" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-3">
                    <div className="bg-muted/30 p-3 rounded-md w-full">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium">Color Harmony Tips</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            These colors will create natural harmony with your skin tone. Use them for clothing, accessories, and makeup to enhance your natural features.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button asChild className="w-full mt-4">
                      <Link to={`/product-suggestions?colors=${encodeURIComponent(JSON.stringify(analysisResult.palette.palettes.primary))}`}>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Show Products For Your Palette
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                {/* NEW: User Image & 2x2 Info Grid Card */}
                {image && analysisResult.skintone && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Your Personal Color Profile
                      </CardTitle>
                      <CardDescription>
                        See your uploaded photo and key color analysis insights at a glance.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                        {/* User Image */}
                        <div className="w-40 h-40 rounded-xl overflow-hidden border shadow-md flex-shrink-0">
                          <img
                            src={image}
                            alt="Uploaded selfie"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mt-6 md:mt-0">
                          {/* Season Type */}
                          <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center shadow-sm">
                            <span className="text-xs text-muted-foreground mb-1">Season Type</span>
                            <span className="font-semibold text-lg">{analysisResult.skintone.season}</span>
                          </div>
                          {/* Undertone */}
                          <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center shadow-sm">
                            <span className="text-xs text-muted-foreground mb-1">Undertone</span>
                            <span className="font-semibold text-lg">{analysisResult.skintone.undertone}</span>
                          </div>
                          {/* Color Tone (Skin Tone Color) */}
                          <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center shadow-sm">
                            <span className="text-xs text-muted-foreground mb-1">Color Tone</span>
                            <span className="flex items-center gap-2 mt-1">
                              <span
                                className="inline-block w-6 h-6 rounded-full border"
                                style={{ background: analysisResult.skintone.color }}
                              />
                              <span className="text-sm">{analysisResult.skintone.name}</span>
                            </span>
                          </div>
                          {/* Colors to Wear (Primary Palette) */}
                          <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center shadow-sm">
                            <span className="text-xs text-muted-foreground mb-1">Colors to Wear</span>
                            <div className="flex gap-1 mt-1 flex-wrap justify-center">
                              {analysisResult.palette.palettes.primary.slice(0, 5).map((color, idx) => (
                                <span
                                  key={color+idx}
                                  className="inline-block w-5 h-5 rounded-full border"
                                  style={{ background: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                          {/* Jewelry to Wear */}
                          <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center shadow-sm col-span-1 md:col-span-2">
                            <span className="text-xs text-muted-foreground mb-1">Jewelry to Wear</span>
                            <div className="flex gap-2 flex-wrap justify-center mt-1">
                              {analysisResult.palette.palettes.jewelry_metals.length > 0 ? (
                                analysisResult.palette.palettes.jewelry_metals.map((metal, idx) => (
                                  <Badge key={metal+idx} variant="secondary">{metal}</Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">N/A</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    {/* Share Buttons */}
                    <CardFooter className="flex flex-col items-center gap-2">
                      <div className="flex gap-3 mt-2">
                        {/* Dummy share URL */}
                        {(() => {
                          const shareUrl = "https://mycolorapp.com/result/12345";
                          const shareText = "Check out my personal color analysis result!";
                          return (
                            <>
                              {/* Generic Share Button */}
                              <Button
                                variant="outline"
                                className="flex items-center gap-2"
                                onClick={async () => {
                                  if (navigator.share) {
                                    try {
                                      await navigator.share({
                                        title: "My Color Analysis Result",
                                        text: shareText,
                                        url: shareUrl,
                                      });
                                    } catch (e) {
                                      // User cancelled or error
                                    }
                                  } else {
                                    try {
                                      await navigator.clipboard.writeText(shareUrl);
                                      toast.success("Link copied to clipboard!");
                                    } catch {
                                      toast.error("Failed to copy link");
                                    }
                                  }
                                }}
                              >
                                <Upload className="h-4 w-4" /> Share
                              </Button>
                              {/* WhatsApp Share Button */}
                              <Button
                                variant="outline"
                                className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => {
                                  const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
                                  window.open(url, '_blank');
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="h-4 w-4"><path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.832 4.584 2.236 6.393L4 29l7.828-2.05C13.416 27.632 14.692 28 16 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.13 0-2.238-.188-3.287-.558l-.235-.08-4.65 1.217 1.24-4.527-.153-.23C7.13 18.13 6.5 16.6 6.5 15c0-5.238 4.262-9.5 9.5-9.5s9.5 4.262 9.5 9.5-4.262 9.5-9.5 9.5zm5.07-6.13c-.277-.139-1.637-.807-1.89-.899-.253-.093-.437-.139-.62.14-.184.277-.71.899-.87 1.085-.16.185-.32.208-.597.07-.277-.139-1.17-.431-2.23-1.375-.824-.735-1.38-1.64-1.542-1.917-.16-.277-.017-.427.122-.565.126-.125.277-.324.416-.486.139-.162.185-.277.277-.462.093-.185.046-.347-.023-.486-.07-.139-.62-1.497-.85-2.05-.224-.54-.453-.466-.62-.475l-.53-.01c-.162 0-.425.06-.647.277-.222.216-.87.85-.87 2.07 0 1.22.89 2.4 1.013 2.567.124.162 1.75 2.67 4.243 3.637.594.204 1.057.326 1.418.418.596.152 1.14.13 1.57.08.48-.056 1.637-.668 1.87-1.312.232-.645.232-1.197.162-1.312-.07-.115-.253-.185-.53-.324z"/></svg>
                                WhatsApp
                              </Button>
                              {/* Twitter Share Button */}
                              <Button
                                variant="outline"
                                className="flex items-center gap-2 text-blue-500 border-blue-200 hover:bg-blue-50"
                                onClick={() => {
                                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                                  window.open(url, '_blank');
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="h-4 w-4"><path d="M32 6.076a13.14 13.14 0 0 1-3.769 1.031A6.601 6.601 0 0 0 31.115 4.1a13.195 13.195 0 0 1-4.169 1.594A6.563 6.563 0 0 0 22.155 3c-3.626 0-6.563 2.938-6.563 6.563 0 .514.058 1.016.17 1.496C10.272 10.86 5.444 8.13 2.228 4.149c-.564.97-.888 2.096-.888 3.301 0 2.277 1.159 4.287 2.924 5.463a6.533 6.533 0 0 1-2.975-.822v.083c0 3.181 2.263 5.834 5.267 6.437-.551.15-1.13.23-1.728.23-.423 0-.832-.041-1.232-.117.832 2.6 3.25 4.494 6.116 4.546A13.18 13.18 0 0 1 0 27.026 18.616 18.616 0 0 0 10.063 30c12.072 0 18.686-10.002 18.686-18.686 0-.285-.007-.568-.02-.85A13.348 13.348 0 0 0 32 6.076z"/></svg>
                                Twitter
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                    </CardFooter>
                  </Card>
                )}
                <div className="text-center">
                  <Button onClick={() => setActiveTab("upload")}>Analyze Another Photo</Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ColorAnalysisPage;