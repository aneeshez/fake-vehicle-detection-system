import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            <div className="content-overlay">
                <div className="hero-section">
                    <h1 className="main-title">
                        Fake Vehicle Detection
                        <span className="highlight">System</span>
                    </h1>
                    <p className="subtitle">
                        Capture a passing vehicle, read its number plate, and compare it with registered vehicle details.
                    </p>
                    <div className="cta-buttons">
                        <Link to="/detect" className="cta-button primary">
                            <Icon className="fas fa-search"></Icon>
                            Start Detection
                        </Link>
                    </div>
                </div>

                <div className="features-section">
                    <div className="feature-card">
                        <Icon className="fas fa-shield-alt"></Icon>
                        <h3>Fraud Detection</h3>
                        <p>Flag registered plates when the detected vehicle type or color does not match.</p>
                    </div>
                    <div className="feature-card">
                        <Icon className="fas fa-database"></Icon>
                        <h3>Plate Lookup</h3>
                        <p>Compare the recognized plate against the local registered vehicle database.</p>
                    </div>
                    <div className="feature-card">
                        <Icon className="fas fa-chart-line"></Icon>
                        <h3>Camera Capture</h3>
                        <p>Use a live camera or a saved image to check a vehicle.</p>
                    </div>
                    <div className="feature-card">
                        <Icon className="fas fa-bell"></Icon>
                        <h3>Review Flags</h3>
                        <p>Review possible mismatches before drawing a conclusion.</p>
                    </div>
                </div>

                <div className="stats-section">
                    <div className="stat-item">
                        <span className="stat-number">Plate</span>
                        <span className="stat-label">Registration lookup</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">Vehicle</span>
                        <span className="stat-label">Type and color check</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">Live + still</span>
                        <span className="stat-label">Camera capture options</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
