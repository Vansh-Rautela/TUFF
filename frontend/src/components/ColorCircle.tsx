import { cn } from "@/lib/utils";

interface ColorCircleProps {
  color: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ColorCircle = ({ 
  color, 
  name, 
  size = "md", 
  className 
}: ColorCircleProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-14 h-14"
  };
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={cn(
          "rounded-full border border-border shadow-sm", 
          sizeClasses[size],
          className
        )} 
        style={{ backgroundColor: color }}
        title={name}
      />
      {name && <span className="text-xs text-muted-foreground">{name}</span>}
    </div>
  );
};
