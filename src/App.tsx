// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import LoadingScreen from './components/LoadingScreen'
import './App.scss'
import { Sakura } from './Sakura'
import Nav from './components/Nav/Nav'

function App() {
  return (
    <>
      {/* <LoadingScreen /> */}
      <Sakura />
      <Router>
        
        <Nav />
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </Router>
    </>
  )
}

export default App
