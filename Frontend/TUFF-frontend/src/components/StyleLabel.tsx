import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StyleLabelProps {
  children?: React.ReactNode;
  label?: string;
  value?: string;
  className?: string;
}

export const StyleLabel = ({ children, label, value, className }: StyleLabelProps) => {
  // If label and value are provided, render them in a labeled badge format
  if (label && value) {
    return (
      <div className={cn("flex flex-col gap-1 items-center", className)}>
        <span className="text-sm text-muted-foreground">{label}</span>
        <Badge variant="outline" className="px-3 py-1 font-medium">
          {value}
        </Badge>
      </div>
    );
  }
  
  // If only children are provided, render a simple badge
  return (
    <Badge variant="outline" className={cn("px-3 py-1 font-medium", className)}>
      {children}
    </Badge>
  );
};
