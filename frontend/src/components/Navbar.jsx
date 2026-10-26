import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import './Navbar.css';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <Icon className="fas fa-shield-alt"></Icon>
                    <span>FakeVehicle</span>
                    <span className="highlight">Detect</span>
                </Link>

                <button
                    type="button"
                    className="mobile-menu-button"
                    aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={isMobileMenuOpen}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <Icon className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`} />
                </button>

                <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                    <li className="nav-item">
                        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                            <Icon className="fas fa-home"></Icon>
                            Home
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/detect" className={`nav-link ${isActive('/detect') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                            <Icon className="fas fa-search"></Icon>
                            Detect
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                            <Icon className="fas fa-info-circle"></Icon>
                            About
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                            <Icon className="fas fa-envelope"></Icon>
                            Contact
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
