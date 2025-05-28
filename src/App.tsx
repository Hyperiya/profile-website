// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Projects from './pages/Projects'
import About from './pages/About'
import Admin from './pages/Admin'

import './App.scss'

import LoadingScreen from './components/LoadingScreen'
import Nav from './components/Nav/Nav'
import AudioPlayer from './components/Main/AudioPlayer'

import { Sakura } from './Sakura'

function App() {
  return (
    <>
      <Router>

        <Sakura />
        <Nav />
        <LoadingScreen />

        <div className="content-wrapper">
          <AudioPlayer />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </Router>
    </>
  )
}

export default App
