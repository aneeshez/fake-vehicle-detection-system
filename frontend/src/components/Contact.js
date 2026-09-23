import React, { useState } from 'react';
import Icon from './Icon';
import './Contact.css';
import emailjs from 'emailjs-com';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const [status, setStatus] = useState({
        message: '',
        type: '' // 'success' or 'error'
    });

    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email) => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        return pattern.test(email);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        setFormData({
            ...formData,
            [name]: value
        });

        // Clear status when user starts typing again
        if (status.message) {
            setStatus({ message: '', type: '' });
        }
        
        // Validate email format
        if (name === 'email') {
            if (value && !validateEmail(value)) {
                setEmailError('Please enter a valid email address');
            } else {
                setEmailError('');
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate email format before submission
        if (!validateEmail(formData.email)) {
            setEmailError('Please enter a valid email address');
            return;
        }
        
        setLoading(true);
        
        const serviceID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
        const templateID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
        const userID = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
        if (!serviceID || !templateID || !userID) {
            setStatus({ message: 'The contact form is not configured yet. Please use the project email shown here.', type: 'error' });
            setLoading(false);
            return;
        }
        
        // Add recipient email to template parameters
        const templateParams = {
            ...formData,
            to_email: 'Aneeshkumarv2003@gmail.com'
        };

        emailjs.send(serviceID, templateID, templateParams, userID)
            .then((result) => {
                console.log('Email successfully sent!', result.text);
                setStatus({
                    message: 'Message sent successfully! We will get back to you soon.',
                    type: 'success'
                });
                setFormData({ name: '', email: '', subject: '', message: '' });
            })
            .catch((error) => {
                console.error('Failed to send email:', error);
                setStatus({
                    message: 'Failed to send message. Please try again later.',
                    type: 'error'
                });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <main className="contact-container">
            <div className="contact-content">
                <div className="contact-header">
                    <h1>Get in Touch</h1>
                    <div className="header-underline"></div>
                    <p>Have concerns about vehicle fraud? We're here to help.</p>
                </div>

                <div className="contact-grid">
                    <div className="contact-info">
                        <div className="info-card">
                            <div className="icon-wrapper">
                                <Icon className="fas fa-map-marker-alt"></Icon>
                            </div>
                            <h3>Our Location</h3>
                            <p>John cox<br />kanamoola</p>
                        </div>

                        <div className="info-card">
                            <div className="icon-wrapper">
                                <Icon className="fas fa-phone-alt"></Icon>
                            </div>
                            <h3>24/7 Hotline</h3>
                            <p>+91 9947575267<br />Always Available</p>
                        </div>

                        <div className="info-card">
                            <div className="icon-wrapper">
                                <Icon className="fas fa-envelope"></Icon>
                            </div>
                            <h3>Email</h3>
                            <p><a href="mailto:Aneeshkumarv2003@gmail.com">Aneeshkumarv2003@gmail.com</a><br />Project enquiries</p>
                        </div>

                        <div className="social-links">
                            <span className="social-icon" aria-hidden="true">
                                <Icon className="fab fa-linkedin"></Icon>
                            </span>
                            <span className="social-icon" aria-hidden="true">
                                <Icon className="fab fa-twitter"></Icon>
                            </span>
                            <span className="social-icon" aria-hidden="true">
                                <Icon className="fab fa-facebook"></Icon>
                            </span>
                            <span className="social-icon" aria-hidden="true">
                                <Icon className="fab fa-instagram"></Icon>
                            </span>
                        </div>
                    </div>

                    <div className="contact-form-container">
                        <form onSubmit={handleSubmit} className="contact-form">
                            <div className="form-group">
                                <div className="input-icon">
                                    <Icon className="fas fa-user"></Icon>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Your Name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="input-icon">
                                    <Icon className="fas fa-envelope"></Icon>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Your Email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {emailError && (
                                    <div className="field-error">
                                        <Icon className="fas fa-exclamation-triangle"></Icon> {emailError}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <div className="input-icon">
                                    <Icon className="fas fa-tag"></Icon>
                                    <input
                                        type="text"
                                        name="subject"
                                        placeholder="Subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="input-icon">
                                    <Icon className="fas fa-comment-alt"></Icon>
                                    <textarea
                                        name="message"
                                        placeholder="Your Message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>
                            </div>

                            {status.message && (
                                <div className={`status-message ${status.type}`}>
                                    <Icon className={`fas ${status.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></Icon>
                                    {status.message}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className={`submit-button ${loading ? 'loading' : ''}`}
                                disabled={loading || emailError}
                            >
                                {loading ? (
                                    <>
                                        <Icon className="fas fa-spinner fa-spin"></Icon>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Icon className="fas fa-paper-plane"></Icon>
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Contact;
