// src/App.tsx
import { useState } from 'react'
import ImageTrack from '../components/Main/ImageTrack'
import AudioPlayer from '../components/Main/AudioPlayer'
import InfoPopup from '../components/Main/InfoPopup'
import './Home.scss'


function Home() {
  const [showPopup, setShowPopup] = useState(false)
  return (
    <>
      <div className='hyperiya-ab-container'>
        <div className='image-track-container'>
          <ImageTrack />
        </div>
        <AudioPlayer />


        <InfoPopup isOpen={showPopup} onClose={() => setShowPopup(false)} />
      </div>
    </>
  )
}

export default Home
