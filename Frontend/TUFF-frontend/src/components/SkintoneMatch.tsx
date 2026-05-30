import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StyleLabel } from "@/components/StyleLabel";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface SkintoneMatchProps {
  name: string;
  color: string;
  undertone?: string;
  season?: string;
  brightness?: string;
  contrast?: string;
  className?: string;
}

export const SkintoneMatch = ({ 
  name, 
  color, 
  undertone = "Neutral", 
  season = "Neutral", 
  brightness = "Medium", 
  contrast = "Medium", 
  className 
}: SkintoneMatchProps) => {
  return (
    <div className={cn("text-center", className)}>
      <div 
        className="w-24 h-24 rounded-full border-4 border-white shadow-md mx-auto mb-3"
        style={{ backgroundColor: color }}
      />
      <div className="space-y-1">
        <h3 className="text-xl font-medium">Your skin tone is</h3>
        <p className="text-2xl font-bold text-primary">{name}</p>
        <p className="text-xs text-muted-foreground mb-3">{color.toUpperCase()}</p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <div className="space-y-1 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">Undertone</span>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">The subtle hue beneath your skin's surface</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge variant="outline" className="px-3 py-1">
              {undertone}
            </Badge>
          </div>
          
          <div className="space-y-1 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">Season</span>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Your color season based on undertone, brightness and contrast</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge variant="outline" className="px-3 py-1">
              {season}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mt-3">
          <StyleLabel label="Brightness" value={brightness} />
          <StyleLabel label="Contrast" value={contrast} />
        </div>
      </div>
    </div>
  );
};
