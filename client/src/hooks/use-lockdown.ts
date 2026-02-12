import { useEffect, useRef, useState, useCallback } from 'react';

export interface LockdownOptions {
    onTabSwitch?: () => void;
    onFullscreenExit?: () => void;
    maxViolations?: number;
    onMaxViolations?: () => void;
    enableFullscreen?: boolean;
}

export interface LockdownState {
    violations: number;
    isFullscreen: boolean;
    isLocked: boolean;
}

/**
 * Hook to implement exam lockdown/proctoring features
 * Detects when students try to leave the exam tab or exit fullscreen
 */
export function useLockdown(options: LockdownOptions = {}) {
    const {
        onTabSwitch,
        onFullscreenExit,
        maxViolations = 3,
        onMaxViolations,
        enableFullscreen = true,
    } = options;

    const [violations, setViolations] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const violationCountRef = useRef(0);

    // Enter fullscreen mode
    const enterFullscreen = useCallback(async () => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if ((elem as any).webkitRequestFullscreen) {
                await (elem as any).webkitRequestFullscreen();
            } else if ((elem as any).msRequestFullscreen) {
                await (elem as any).msRequestFullscreen();
            }
        } catch (error) {
            console.error('Failed to enter fullscreen:', error);
        }
    }, []);

    // Exit fullscreen mode
    const exitFullscreen = useCallback(async () => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                await (document as any).msExitFullscreen();
            }
        } catch (error) {
            console.error('Failed to exit fullscreen:', error);
        }
    }, []);

    // Start lockdown mode
    const startLockdown = useCallback(async () => {
        console.log('🔒 Starting lockdown mode...');
        setIsLocked(true);
        if (enableFullscreen) {
            await enterFullscreen();
        }
    }, [enableFullscreen, enterFullscreen]);

    // Stop lockdown mode
    const stopLockdown = useCallback(async () => {
        console.log('🔓 Stopping lockdown mode...');
        setIsLocked(false);
        if (isFullscreen) {
            await exitFullscreen();
        }
    }, [isFullscreen, exitFullscreen]);

    useEffect(() => {
        if (!isLocked) return;

        // Handle visibility change (tab switching)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                violationCountRef.current += 1;
                setViolations(violationCountRef.current);
                onTabSwitch?.();

                if (violationCountRef.current >= maxViolations) {
                    onMaxViolations?.();
                }
            }
        };

        // Handle window blur (losing focus)
        const handleBlur = () => {
            if (!document.hidden) {
                violationCountRef.current += 1;
                setViolations(violationCountRef.current);
                onTabSwitch?.();

                if (violationCountRef.current >= maxViolations) {
                    onMaxViolations?.();
                }
            }
        };

        // Handle fullscreen change
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).msFullscreenElement
            );

            setIsFullscreen(isCurrentlyFullscreen);

            // If user exits fullscreen while locked, count as violation
            if (!isCurrentlyFullscreen && isLocked && enableFullscreen) {
                violationCountRef.current += 1;
                setViolations(violationCountRef.current);
                onFullscreenExit?.();

                if (violationCountRef.current >= maxViolations) {
                    onMaxViolations?.();
                } else {
                    // Immediately try to re-enter fullscreen (no delay)
                    console.log('🔄 Re-entering fullscreen immediately...');
                    enterFullscreen();

                    // Backup retry after 50ms in case first attempt fails
                    setTimeout(() => {
                        if (!document.fullscreenElement) {
                            console.log('🔄 Retry entering fullscreen...');
                            enterFullscreen();
                        }
                    }, 50);
                }
            }
        };

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        // Cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, [isLocked, enableFullscreen, maxViolations, onTabSwitch, onFullscreenExit, onMaxViolations]);

    // Prevent right-click context menu
    useEffect(() => {
        if (!isLocked) return;

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [isLocked]);

    // Prevent common keyboard shortcuts
    useEffect(() => {
        if (!isLocked) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent ESC key (exits fullscreen)
            if (e.key === 'Escape' || e.key === 'Esc') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (dev tools)
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'U')
            ) {
                e.preventDefault();
                return false;
            }

            // Prevent Ctrl+W, Ctrl+T, Ctrl+N (close/new tab/window)
            if (e.ctrlKey && (e.key === 'w' || e.key === 't' || e.key === 'n')) {
                e.preventDefault();
                return false;
            }

            // Prevent Alt+Tab, Alt+F4
            if (e.altKey && (e.key === 'Tab' || e.key === 'F4')) {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isLocked]);

    return {
        violations,
        isFullscreen,
        isLocked,
        startLockdown,
        stopLockdown,
        enterFullscreen,
        exitFullscreen,
    };
}
