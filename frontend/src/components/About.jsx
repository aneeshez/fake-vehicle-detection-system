import React from 'react';
import Icon from './Icon';
import './About.css';

const About = () => (
    <main className="about-container">
        <div className="about-content">
            <header className="about-header">
                <h1>About the System</h1>
                <div className="header-underline" />
                <p>A camera based workflow for checking a detected number plate against a local vehicle register.</p>
            </header>

            <section className="about-grid" aria-label="How vehicle verification works">
                <article className="about-section">
                    <div className="icon-wrapper"><Icon className="fas fa-video" /></div>
                    <h2>Capture</h2>
                    <p>Analyze one saved image or sample frames from a live camera feed.</p>
                </article>
                <article className="about-section">
                    <div className="icon-wrapper"><Icon className="fas fa-search" /></div>
                    <h2>Read the plate</h2>
                    <p>Plate detection and OCR estimate the registration text from the captured frame.</p>
                </article>
                <article className="about-section">
                    <div className="icon-wrapper"><Icon className="fas fa-database" /></div>
                    <h2>Look up the record</h2>
                    <p>Django searches the local vehicle register using the normalized plate text.</p>
                </article>
                <article className="about-section">
                    <div className="icon-wrapper"><Icon className="fas fa-car-side" /></div>
                    <h2>Compare</h2>
                    <p>The system compares the detected vehicle category and approximate color with the stored record.</p>
                </article>
            </section>

            <section className="about-detail">
                <h2>Review every mismatch</h2>
                <p>A color or category difference is only a review signal. Image quality, lighting, occlusion, and model errors can affect the result. This prototype does not confirm ownership, identify an exact physical vehicle, or prove fraud.</p>
            </section>
        </div>
    </main>
);

export default About;
