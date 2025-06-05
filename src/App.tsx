// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'

import Home from './pages/Home'
import Projects from './pages/Projects'
import About from './pages/About'
import Admin from './pages/Admin'
import AdminDashboard from './pages/AdminDashboard'

import './App.scss'

import LoadingScreen from './components/LoadingScreen'
import Nav from './components/Nav/Nav'
import AudioPlayer from './components/Main/AudioPlayer'

import { Sakura } from './Sakura'

import { api } from './utils/api'

function App() {

  useEffect(() => {
    // Track visitor
    const trackVisit = async () => {
      try {
        // Get visitor ID from localStorage or create new one
        let visitorId = localStorage.getItem('visitor_id');


        console.log(window.API_URL)
        const response = await api.fetch(`/api/analytics/record-visit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            visitorId,
            referrer: document.referrer,
            userAgent: navigator.userAgent
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Store the visitor ID for future visits
          localStorage.setItem('visitor_id', data.visitorId);
        }

      } catch (error) {
        console.error('Error tracking visit:', error);
      }
    };

    trackVisit();
  }, []);

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
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
    </>
  )
}

export default App
