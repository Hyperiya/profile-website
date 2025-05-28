import { Link } from "react-router-dom"
import './Styles/Nav.scss'
import DiscordProfile from './DiscordProfile'
import { useState } from 'react'


function Nav() {
    const [showProfile, setShowProfile] = useState(false);

    return (
        <nav className='nav'>
            <div className="navbar-container">
                <div
                    className="profile-section"
                    onMouseEnter={() => setShowProfile(true)}
                    onMouseLeave={() => setShowProfile(false)}
                >
                    <img
                        className="navbar-avatar"
                        src="https://cdn.discordapp.com/avatars/328275328373882880/01a39df8f7d912562a0bb11a368e50e3.webp?size=64"
                        alt="Profile"
                    />
                    <span className="navbar-username">hyperiya</span>

                    {showProfile && (
                        <div className="discord-profile-popup">
                            <DiscordProfile />
                        </div>
                    )}
                </div>
                <div className="navbar-divider"></div>
                <ul className="navigation">
                    <li>
                        <Link to="/">
                            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            <span className="nav-label">Home</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/about">
                            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 16v-4"></path>
                                <path d="M12 8h.01"></path>
                            </svg>
                            <span className="nav-label">About</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/projects">
                            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                <polyline points="2 17 12 22 22 17"></polyline>
                                <polyline points="2 12 12 17 22 12"></polyline>
                            </svg>
                            <span className="nav-label">Projects</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/blog">
                            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            <span className="nav-label">Blog</span>
                        </Link>
                    </li>
                </ul>
                <li style={{ opacity: 0 }}>
                    <Link to="/admin">
                        <span className="nav-label">Admin</span>
                    </Link>
                </li>
                <div className="spacer"></div>
                <li className="nav-item bottom-item email-item">
                    <a href="mailto:hyperiya.vcz@outlook.com" className="nav-link">
                        <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span className="nav-label">Email</span>
                    </a>
                </li>
            </div>
        </nav >
    )
}

export default Nav