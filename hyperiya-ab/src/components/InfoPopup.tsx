// src/components/InfoPopup.tsx
import { useState, useEffect } from 'react';
import './InfoPopup.css';

interface InfoPopupProps {
  onClose: () => void;
  isOpen: boolean;
}

const InfoPopup: React.FC<InfoPopupProps> = ({ onClose, isOpen }) => {
  const [showArtists, setShowArtists] = useState(false);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  const toggleArtists = () => {
    setShowArtists(!showArtists);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="popup-overlay" onClick={onClose}></div>
      <div className="popup-box" id="infoPopup">
        <div className="popup-content">
          <div className="header-text">Details</div>
          <div className="credit-text">
            <ul className="credit-container">
              <li>🎨 Design: Hyperiya</li>
              <li>⚡ Last Updated: 2/25/2025</li>
              <li>🌐 Version: 1.0</li>
              <br />
              <li className="artists-button-text" onClick={toggleArtists}>Artists</li>
              <div className={`artists-details ${showArtists ? 'show' : ''}`}>
                <a href="https://x.com/s7phonn" target="_blank" rel="noopener noreferrer">1. s7phonn<br /></a>
                <a>2. Unknown (TBH i just stole this from google)<br /></a>
                <a href="https://jp.pinterest.com/salembright777/" target="_blank" rel="noopener noreferrer">3. SalemBRIght<br /></a>
                <a>4. gmanee<br /></a>
                <a href="https://tankxcodex.newgrounds.com/" target="_blank" rel="noopener noreferrer">5. TankxCodex<br /></a>
                <a href="https://x.com/kanekoshake" target="_blank" rel="noopener noreferrer">6. kanekoshake<br /></a>
              </div>
            </ul>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
      </div>
    </>
  );
};

export default InfoPopup;
