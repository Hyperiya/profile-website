// src/components/AudioPlayer.tsx
import { useState, useEffect, useRef } from 'react';
import './AudioPlayer.scss';

interface AudioPlayerProps {
  audioSrc?: string;
  songTitle?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioSrc = '/music/spotifydown.com - weathergirl - FLAVOR FOLEY.mp3',
  songTitle = 'weathergirl - FLAVOR FOLEY'
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.1);
  const [preMuteVolume, setPreMuteVolume] = useState<number>(0.1);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeSliderRef = useRef<HTMLInputElement>(null);

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (!audioRef.current || !volumeSliderRef.current) return;
    
    setIsMuted(prev => {
      const newMuted = !prev;
      
      if (newMuted) {
        setPreMuteVolume(audioRef.current!.volume);
        console.log('muting', audioRef.current!.volume)
        audioRef.current!.volume = 0;
        volumeSliderRef.current!.value = '0';
        updateVolumePercentage(0);
      } else {
        console.log(preMuteVolume)
        audioRef.current!.volume = preMuteVolume;
        volumeSliderRef.current!.value = preMuteVolume.toString();
        updateVolumePercentage(preMuteVolume * 500);
      }
      
      return newMuted;
    });
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    
    const newVolume = parseFloat(e.target.value);
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    updateVolumePercentage(newVolume * 500);
  };

  // Update volume percentage CSS variable
  const updateVolumePercentage = (percentage: number) => {
    if (volumeSliderRef.current) {
      volumeSliderRef.current.style.setProperty('--volume-percentage', `${percentage}%`);
    }
  };

  // Update time display
  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
      } as Intl.DateTimeFormatOptions;
      
      const estTime = new Date().toLocaleTimeString('en-US', options);
      setCurrentTime(`${estTime} EST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Initialize audio
  useEffect(() => {
    if (audioRef.current && volumeSliderRef.current) {
      audioRef.current.volume = volume;
      updateVolumePercentage(volume * 500);
    }
  }, [volume]);

  return (
    <div className="audio-section">
      <audio id="bgMusic" className='weathergirl' ref={audioRef} loop >
        <source src={audioSrc} type="audio/mpeg" />
      </audio>
      
      <div className="audio-controls" role="group" aria-label="Audio controls">
        <button 
          id="musicToggle"
          className="audio-toggle"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          aria-pressed={isMuted}
          onClick={handleMuteToggle}
          data-muted={isMuted}
        >
          <span className="icon-wrapper">
            <svg 
              className="volume-icon" 
              width="24" 
              height="24" 
              viewBox="0 0 48 48" 
              aria-hidden="true"
            >
              <defs>
                <mask id="volume-mask">
                  <path 
                    fill="none" 
                    stroke="#fff" 
                    strokeWidth="4"
                    strokeLinejoin="round"
                    d="M24 6v36c-7 0-12.201-9.16-12.201-9.16H6a2 2 0 0 1-2-2V17.01a2 2 0 0 1 2-2h5.799S17 6 24 6Z"
                  />
                  <path 
                    className="volume-waves"
                    fill="none"
                    stroke="#fff" 
                    strokeWidth="4"
                    strokeLinecap="round"
                    d="M32 15a11.91 11.91 0 0 1 1.684 1.859A12.07 12.07 0 0 1 36 24c0 2.654-.846 5.107-2.278 7.09A11.936 11.936 0 0 1 32 33
                    M34.236 41.186C40.084 37.696 44 31.305 44 24c0-7.192-3.796-13.496-9.493-17.02"
                  />
                  <path 
                    className="mute-x"
                    fill="none"
                    stroke="#fff" 
                    strokeWidth="4"
                    strokeLinecap="round"
                    d="M38 20L32 26M32 20L38 26"
                  />
                </mask>
              </defs>
              <rect 
                width="48" 
                height="48" 
                fill="currentColor" 
                mask="url(#volume-mask)"
              />
            </svg>
          </span>
        </button>
        
        <div 
          className="volume-slider-container"
          role="group" 
          aria-label="Volume control"
        >
          <input 
            type="range"
            id="volumeSlider"
            ref={volumeSliderRef}
            className="volume-slider"
            min="0"
            max="0.20"
            step="0.001"
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Adjust volume"
          />
        </div>
      </div>
      
      <div className="song-info">
        <span className="time" id="date-time">{currentTime}</span>
        <span className="song-text">Now Playing: {songTitle}</span>
      </div>
    </div>
  );
};

export default AudioPlayer;
