import React, { useState } from 'react';
import Icon from './Icon';
import './Contact.css';
import emailjs from '@emailjs/browser';

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
    const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || '';

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
        
        const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const userID = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
        if (!serviceID || !templateID || !userID || !contactEmail) {
            setStatus({ message: 'The contact form is not configured for this site. Please contact its administrator.', type: 'error' });
            setLoading(false);
            return;
        }
        
        // Add recipient email to template parameters
        const templateParams = {
            ...formData,
            to_email: contactEmail
        };

        emailjs.send(serviceID, templateID, templateParams, userID)
            .then(() => {
                setStatus({
                    message: 'Message sent successfully! We will get back to you soon.',
                    type: 'success'
                });
                setFormData({ name: '', email: '', subject: '', message: '' });
            })
            .catch(() => {
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
                                <Icon className="fas fa-envelope"></Icon>
                            </div>
                            <h3>Project enquiries</h3>
                            <p>{contactEmail ? <a href={`mailto:${contactEmail}`}>{contactEmail}</a> : 'Send a message using the form. Contact details are set by the site administrator.'}</p>
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
                                        maxLength={100}
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
                                        maxLength={254}
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
                                        maxLength={160}
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
                                        maxLength={5000}
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>
                            </div>

                            {status.message && (
                                <div className={`status-message ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
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
