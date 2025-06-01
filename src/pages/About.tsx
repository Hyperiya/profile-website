// src/pages/About.tsx
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
                    <h2>Pronouns</h2>
                    <p>He/She</p>
                    <p>Genderfluid</p>
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
                    <p>
                        If not otherwise stated, none of the art on this page is mine.
                    </p>
                </section>
            </div>
        </div>
    );
}

export default About;
