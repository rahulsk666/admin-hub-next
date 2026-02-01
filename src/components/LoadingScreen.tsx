import { Truck } from "lucide-react";

interface LoadingScreenProps {
    message?: string;
}

export const LoadingScreen = ({ message = "Preparing your dashboard..." }: LoadingScreenProps) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in">
            <div className="relative flex flex-col items-center">
                {/* Animated Glow Backdrop */}
                <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse-slow" />

                {/* Icon Container */}
                <div className="relative stat-icon w-20 h-20 mb-6 shadow-glow">
                    <Truck className="w-10 h-10 text-primary-foreground animate-bounce" />
                </div>

                {/* Brand Text */}
                <h2 className="text-2xl font-bold gradient-text mb-2 tracking-tight">
                    TripTrack Pro
                </h2>

                {/* Loading Message */}
                <div className="flex items-center gap-2">
                    <p className="text-muted-foreground animate-pulse font-medium">
                        {message}
                    </p>
                    <div className="flex gap-1">
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                    </div>
                </div>
            </div>
        </div>
    );
};
