// src/components/LoadingScreen.tsx
import { useState, useEffect } from 'react';
import './LoadingScreen.css';



const LoadingScreen: React.FC = () => {
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showEnter, setShowEnter] = useState(false);

    // Simulate loading progress
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + Math.random() * 10;
                if (newProgress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setLoading(false);
                        setShowEnter(true);
                    }, 500);
                    return 100;
                }
                return newProgress;
            });
        }, 200);

        return () => clearInterval(interval);
    }, []);

    const handleEnterClick = () => {
        // Fade out animation
        const enterPage = document.querySelector('.enter-page');
        const weathergirl: HTMLMediaElement | null = document.querySelector('.weathergirl')
        weathergirl!.play()
        if (enterPage) {
            enterPage.classList.add('fade-out');
            
        };
    };

    if (!loading && !showEnter) return null;

    return (
        <>
            {loading && (
                <div className="loading-screen">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            {showEnter && (
                <div className="enter-page" onClick={handleEnterClick}>
                    <h1>Click to Enter</h1>
                </div>
            )}
        </>
    );
};

export default LoadingScreen;
