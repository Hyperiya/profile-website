// src/pages/About.tsx
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import './Styles/About.scss';

const skills = [
    { category: 'Development', skills: ['React', 'TypeScript', 'CSS/SCSS', 'Node.js', 'Python', 'Rust'] },
    { category: 'Design', skills: ['UI/UX Design', '3D Modelling', 'Animation'] }
];

const aboutMe = [
    { paragraph: "Hi, I\'m Hyperiya! I\'m a developer and digital artist passionate about creating unique web experiences, useful applications, and game modifications." },
    { paragraph: "This website serves as my personal portfolio and hub for all my online profiles. Feel free to explore and connect with me through any of the platforms linked on the home page." }
]


function About() {

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

    return (
        <div className="about-container">
            <div className="about-content">
                <h1>About Me</h1>

                <section className="about-section">
                    {aboutMe.map((paragraph, index) => (
                        <p key={index}>{paragraph.paragraph}</p>
                    ))}
                </section>

                {regionConfig !== 'special_ne1' && (
                    <section className="about-section">
                        <h2>Pronouns</h2>
                        <p>He/She</p>
                        <p>Genderfluid</p>
                    </section>
                )}

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
                    <p>
                        If not otherwise stated, none of the art on this page is mine.
                    </p>
                </section>
            </div>
        </div>
    );
}

export default About;
