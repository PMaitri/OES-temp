import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
    targetDate: string | Date;
    onComplete?: () => void;
    className?: string;
    fallback?: React.ReactNode;
}

export function CountdownTimer({ targetDate, onComplete, className = "", fallback }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();

            if (difference > 0) {
                return {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            } else {
                if (onComplete) onComplete();
                return null;
            }
        };

        // Initial calculation
        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            if (!newTimeLeft) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, onComplete]);

    if (!timeLeft) return <>{fallback}</>;

    return (
        <div className={`flex items-center gap-2 text-sm font-medium text-orange-600 ${className}`}>
            <Clock className="w-4 h-4" />
            <span>
                Starts in: {timeLeft.days > 0 && `${timeLeft.days}d `}
                {timeLeft.hours.toString().padStart(2, "0")}h{" "}
                {timeLeft.minutes.toString().padStart(2, "0")}m{" "}
                {timeLeft.seconds.toString().padStart(2, "0")}s
            </span>
        </div>
    );
}
