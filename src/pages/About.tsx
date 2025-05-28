// src/pages/About.tsx
import { useState } from 'react';
import './Styles/About.scss';

const artists = [
    { name: 's7phonn', image: 'https://x.com/s7phonn' },
    { name: 'Unknown (From Google)' },
    { name: 'SalemBRIght', image: 'https://pinterest.com/salembright777/' },
    { name: 'gmanee' },
    { name: 'TankxCodex', image: 'https://tankxcodex.newgrounds.com/' },
    { name: 'kanekoshake', image: 'https://x.com/kanekoshake' }
]

const skills = [
    { category: 'Development', skills: ['React', 'TypeScript', 'CSS/SCSS', 'Node.js', 'Python', 'Rust'] },
    { category: 'Design', skills: ['UI/UX Design', '3D Modelling', 'Animation'] }
];

const aboutMe = [
    { paragraph: "Hi, I\'m Hyperiya! I\'m a developer and digital artist passionate about creating unique web experiences, useful applications, and game modifications." },
    { paragraph: "This website serves as my personal portfolio and hub for all my online profiles. Feel free to explore and connect with me through any of the platforms linked on the home page." }
]


function About() {
    const [showArtists, setShowArtists] = useState(false);

    return (
        <div className="about-container">
            <div className="about-content">
                <h1>About Me</h1>

                <section className="about-section">
                    {aboutMe.map((paragraph, index) => (
                        <p key={index}>{paragraph.paragraph}</p>
                    ))}
                </section>

                <section className="about-section">
                    <h2>Skills</h2>
                    <div className="skills-grid">
                        {skills.map((category, index) => {
                            return (
                                <div className="skill-category" key={index}>
                                    <h3>{category.category}</h3>
                                    <ul>
                                        {category.skills.map((skill, skillIndex) => (
                                            <li key={skillIndex}>{skill}</li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="about-section">
                    <h2 className="artists-heading" onClick={() => setShowArtists(!showArtists)}>
                        Image Credits {showArtists ? '▼' : '▶'}
                    </h2>

                    {showArtists && (
                        <div className='artists-list'>
                            {artists.map((artist, index) => (
                                <a key={artist.name} className="artist-item" href={artist.image}>
                                    <span className='image-number'>Image {index + 1}:</span>
                                    <span className='artist-name'>{artist.name}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default About;
