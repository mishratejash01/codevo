import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface StickyBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

export const StickyBanner = React.forwardRef<HTMLDivElement, StickyBannerProps>(
  ({ className, children, onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full px-4 py-3 text-primary-foreground shadow-md transition-all",
          className
        )}
        {...props}
      >
        <div className="container mx-auto flex items-center justify-center">
          {children}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        )}
      </div>
    );
  }
);
StickyBanner.displayName = "StickyBanner";
