import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface BackButtonProps {
  className?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "lg" | "icon";
}

export function BackButton({ 
  className = "", 
  variant = "ghost", 
  size = "sm" 
}: BackButtonProps) {
  const [location] = useLocation();
  
  // Hide on main dashboard pages
  const isDashboardRoot = [
    "/dashboard",
    "/dashboard/manager", 
    "/dashboard/receptionist",
    "/dashboard/trainer"
  ].includes(location);
  
  if (isDashboardRoot) return null;
  
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to dashboard based on current path
      if (location.startsWith("/dashboard/")) {
        window.location.href = location.split("/").slice(0, 3).join("/");
      } else {
        window.location.href = "/dashboard";
      }
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={`gap-2 min-h-[44px] min-w-[44px] ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Back</span>
    </Button>
  );
}