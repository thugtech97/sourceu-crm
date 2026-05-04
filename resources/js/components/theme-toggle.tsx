import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

function currentThemeIsDark(appearance: string) {
    if (typeof window === 'undefined') {
        return false;
    }

    return appearance === 'dark' || (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

export function ThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(currentThemeIsDark(appearance));
    }, [appearance]);

    function toggleTheme() {
        const nextAppearance = currentThemeIsDark(appearance) ? 'light' : 'dark';
        updateAppearance(nextAppearance);
        setIsDark(nextAppearance === 'dark');
    }

    const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                        <span className="sr-only">{label}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
