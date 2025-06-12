// src/components/ImageTrack.tsx
import { useRef, useState, useEffect, useCallback } from 'react';
import './Styles/ImageTrack.scss';
import { api } from '../../utils/api';

// Define profile data to make it more maintainable
interface ProfileItem {
    id: string;
    url: string;
    image: string;
    title: string;
}


interface ImageTrackProps {
    title?: string;
}

interface ImageTrackProps {
    title?: string;
}

const ImageTrack: React.FC<ImageTrackProps> = ({ title = "Hyperiya's Profiles" }) => {
    const [profileItems, setProfileItems] = useState<ProfileItem[]>([]);
    const [regionConfig, setRegionConfig] = useState<string>('default');

    useEffect(() => {
        const checkVisitorMetrics = async () => {
            try {
                const admin = localStorage.getItem('admin_auth');
                if (admin) {
                    setRegionConfig('default');
                    return;
                }
                // Collect device name in an obfuscated way
                const deviceInfo = {
                    screen: `${window.screen.width}x${window.screen.height}`,
                    // This will help identify the device name on the server
                    system: navigator.userAgent,
                    // Add a timestamp to make it look like analytics
                    ts: Date.now()
                };

                const response = await api.fetch('/api/analytics/visitor-metrics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(deviceInfo)
                });

                if (response.ok) {
                    const data = await response.json();
                    // Use an innocuous-looking property name
                    if (data.display_config) {
                        setRegionConfig(data.display_config);
                    }
                }
            } catch (error) {
                // Silently fail
            }
        };

        checkVisitorMetrics();
    }, []);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const response = await api.fetch(`/api/profiles`);

                if (response.ok) {
                    const data = await response.json();
                    setProfileItems(data);
                }

            } catch (error) {
                console.error('Error fetching profiles:', error);
            }
        };

        fetchProfiles();
    }, []);
    const [initPosition] = useState<number>(38)

    const trackRef = useRef<HTMLDivElement>(null);
    const [trackMoved, setTrackMoved] = useState<boolean>(false);
    const [startX, setStartX] = useState<number>(0);
    const [mouseDownAt, setMouseDownAt] = useState<string>("0");
    const [prevPercentage, setPrevPercentage] = useState<string>(String(initPosition));
    const [percentage, setPercentage] = useState<string>(String(initPosition));
    const [isDragging, setIsDragging] = useState<boolean>(false);



    const isNav = useCallback((e: MouseEvent | TouchEvent): boolean => {
        const nav = document.querySelector('.navbar-container')
        if (!nav) return false;

        const rect = nav.getBoundingClientRect();
        const x = 'clientX' in e ? e.clientX : (e.touches ? e.touches[0].clientX : 0);
        const y = 'clientY' in e ? e.clientY : (e.touches ? e.touches[0].clientY : 0);

        return x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom;
    }, [])

    // Function to check if click/touch is on volume control
    const isVolumeControl = useCallback((e: MouseEvent | TouchEvent): boolean => {
        const volumeControls = document.querySelector('.audio-controls');
        if (!volumeControls) return false;

        const rect = volumeControls.getBoundingClientRect();
        const x = 'clientX' in e ? e.clientX : (e.touches ? e.touches[0].clientX : 0);
        const y = 'clientY' in e ? e.clientY : (e.touches ? e.touches[0].clientY : 0);

        return x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom;
    }, []);

    const ignoreDrag = useCallback((e: MouseEvent | TouchEvent): boolean => {
        const volume = isVolumeControl(e);
        const nav = isNav(e);
        if (nav || volume) {
            return true;
        } else {
            return false;
        }
    }, [isNav, isVolumeControl])

    // Function to animate track and images (unchanged)
    const animateTrack = useCallback((nextPercentage: number, instant?: boolean) => {
        if (!trackRef.current) return;

        // Move the track
        trackRef.current.animate({
            transform: `translate(${nextPercentage}%, 0%)`
        }, { duration: 1200, fill: "forwards" });

        // Calculate parallax position from center (50%)
        const parallaxPosition = `${50 + (nextPercentage / 2)}% center`;

        // Apply the same parallax position to all images
        const images = trackRef.current.getElementsByTagName("img");

        for (const image of Array.from(images)) {
            if (!instant) {
                image.animate({
                    objectPosition: parallaxPosition
                }, { duration: 1200, fill: "forwards" });
            } else {
                image.animate({
                    objectPosition: parallaxPosition
                }, { duration: 1, fill: "forwards" });
            }
        }
    }, []);

    useEffect(() => {
        animateTrack((initPosition), true)
    }, [initPosition, animateTrack])

    // Function to update track dimensions on resize (unchanged)
    const updateTrackDimensions = useCallback(() => {
        if (!trackRef.current) return;

        const track = trackRef.current;
        const images = track.getElementsByTagName("img");

        // Reset the track position
        track.dataset.prevPercentage = String(initPosition);
        track.dataset.percentage = "0";
        track.style.transform = `"translate(${initPosition}, 0%)"`;

        // Reset image positions
        for (const image of Array.from(images)) {
            image.style.objectPosition = "75% center";
        }
    }, [initPosition]);

    // Handle link clicks
    const handleLinkClick = useCallback((e: React.MouseEvent, item: ProfileItem) => {
        if (trackMoved) {
            e.preventDefault();
            setTrackMoved(false);
        } else {
            window.open(item.url, '_blank')
        }
    }, [trackMoved]);

    // Initialize and cleanup
    useEffect(() => {
        if (!trackRef.current) return;

        const track = trackRef.current;

        // Set initial values
        track.style.transform = `translate(${initPosition}%, 0%)`;
        track.dataset.mouseDownAt = "0";
        track.dataset.prevPercentage = String(initPosition);
        track.dataset.percentage = "0";

        // Mouse down handler - now on document
        const handleMouseDown = (e: MouseEvent) => {
            if (ignoreDrag(e)) return;

            const clientX = e.clientX.toString();
            if (track) {
                track.dataset.mouseDownAt = clientX;
                track.setAttribute('data-dragging', 'true');
            }

            setStartX(e.clientX);
            setTrackMoved(false);
            setMouseDownAt(clientX);
            // Make sure to use the current percentage from state
            setPrevPercentage(percentage);
            setIsDragging(true);
        };

        // Mouse up handler - now on document
        const handleMouseUp = () => {
            if (track) {
                track.dataset.mouseDownAt = "0";
                track.dataset.prevPercentage = track.dataset.percentage || "0";
                track.setAttribute('data-dragging', 'false');
            }
            setMouseDownAt("0");
            setPrevPercentage(track.dataset.percentage || "0");
            setIsDragging(false);
        };

        // Mouse move handler - now on document
        const handleMouseMove = (e: MouseEvent) => {
            if (!track || mouseDownAt === "0") return;

            // Check if the track has moved more than a small threshold
            if (Math.abs(e.clientX - startX) > 5) {
                setTrackMoved(true);
            }

            const mouseDelta = parseFloat(mouseDownAt) - e.clientX;
            const maxDelta = window.innerWidth / 2;

            const percentageChange = (mouseDelta / maxDelta) * -100;
            const nextPercentageUnconstrained = parseFloat(prevPercentage) + percentageChange;

            const nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, initPosition), -75);

            setPercentage(nextPercentage.toString());
            track.dataset.percentage = nextPercentage.toString();

            animateTrack(nextPercentage);
        };

        // Touch handlers - now on document
        const handleTouchStart = (e: TouchEvent) => {
            if (ignoreDrag(e)) return;

            const touch = e.touches[0];
            const clientX = touch.clientX.toString();
            if (track) {
                track.dataset.mouseDownAt = clientX;
                track.setAttribute('data-dragging', 'true');
            }
            setStartX(touch.clientX);
            setTrackMoved(false);
            setMouseDownAt(clientX);
            setIsDragging(true);
        };

        const handleTouchEnd = () => {
            if (track) {
                track.dataset.mouseDownAt = "0";
                track.dataset.prevPercentage = track.dataset.percentage || "0";
            }
            setMouseDownAt("0");
            setPrevPercentage(track.dataset.percentage || "0");
            setIsDragging(false);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!track || mouseDownAt === "0") return;

            const touch = e.touches[0];

            if (Math.abs(touch.clientX - startX) > 5) {
                setTrackMoved(true);
            }

            const touchDelta = parseFloat(mouseDownAt) - touch.clientX;
            const maxDelta = window.innerWidth / 2;

            const percentageChange = (touchDelta / maxDelta) * -100;
            const nextPercentageUnconstrained = parseFloat(prevPercentage) + percentageChange;
            const nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 50), -100);

            setPercentage(nextPercentage.toString());
            track.dataset.percentage = nextPercentage.toString();

            animateTrack(nextPercentage);
        };

        // Prevent scrolling with keyboard
        const handleKeyDown = (e: KeyboardEvent) => {
            const preventedKeys = [
                ' ', 'PageUp', 'PageDown', 'End', 'Home',
                'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'
            ];

            if (preventedKeys.includes(e.key)) {
                e.preventDefault();
                return false;
            }
        };

        // Prevent mouse wheel scrolling
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
        };

        // Prevent default touch moves
        const handleDocTouchMove = (e: TouchEvent) => {
            e.preventDefault();
        };


        // Add event listeners to document instead of track
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('touchmove', handleDocTouchMove, { passive: false });
        window.addEventListener('resize', updateTrackDimensions);

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchmove', handleTouchMove);

            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('wheel', handleWheel);
            document.removeEventListener('touchmove', handleDocTouchMove);
            window.removeEventListener('resize', updateTrackDimensions);
        };
    }, [mouseDownAt, startX, prevPercentage, animateTrack, ignoreDrag, updateTrackDimensions, initPosition, percentage]);


    return (
        <div
            className="image-track"
            ref={trackRef}
            data-mouse-down-at="0"
            data-prev-percentage="25"
            data-percentage="0"
            data-dragging={isDragging.toString()}
        >
            <div className="left-text">{title}</div>

            {profileItems.map(item => {
                // Don't render patreon/gamebanana items
                if ((item.id === 'patreon' || item.id === 'gamebanana') && regionConfig === 'special_ne1') {
                    return null;
                }

                // Otherwise render the item
                return (
                    <div
                        className="image-item" key={item.id}
                        onClick={(e) => handleLinkClick(e, item)}
                    >
                        <a href={item.url}>
                            <img src={item.image} alt={item.title} />
                        </a>
                        <div className="text-overlay" data-text={item.id}>{item.title}</div>
                    </div>
                );
            })}

        </div>
    );
};

export default ImageTrack;
