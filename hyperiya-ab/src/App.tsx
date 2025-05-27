// src/App.tsx
import { useState, useEffect } from 'react'
import ImageTrack from './components/ImageTrack'
import AudioPlayer from './components/AudioPlayer'
import LoadingScreen from './components/LoadingScreen'
import InfoPopup from './components/InfoPopup'
import { Sakura } from './components/Sakura'
import './App.css'


function App() {
  const [showPopup, setShowPopup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleLoadingComplete = () => {
    setIsLoading(false);
  }


  return (
    <>
      <LoadingScreen onComplete={handleLoadingComplete} />
      <Sakura />
      <div className='hyperiya-ab-container'>
        <div className='image-track-container'>
          <ImageTrack />
        </div>
        <AudioPlayer />

        <div className="email-icon">
          <a href="mailto:hyperiya.vcz@outlook.com" aria-label="Send email">
            <div className="icon-mask"></div>
          </a>
        </div>

        <div className="info-icon" onClick={() => setShowPopup(true)}>
          <div className="info-mask"></div>
        </div>

        <InfoPopup isOpen={showPopup} onClose={() => setShowPopup(false)} />
      </div>
    </>
  )
}

export default App
