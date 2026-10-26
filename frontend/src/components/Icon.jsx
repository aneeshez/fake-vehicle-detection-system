import React from 'react';

const paths = {
    'shield-alt': 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z',
    home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z',
    search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35',
    'info-circle': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14h.01M11 12h1v5h1',
    eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    microchip: 'M8 8h8v8H8zM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z',
    lightbulb: 'M9 18h6m-5 4h4m-5-7a7 7 0 1 1 6 0c-.8.6-1 1.3-1 3h-4c0-1.7-.2-2.4-1-3Z',
    'user-tie': 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0Zm5-8 3 3 3-3m-3 3v5',
    'map-marker-alt': 'M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    'phone-alt': 'M7 3H4a1 1 0 0 0-1 1 17 17 0 0 0 17 17 1 1 0 0 0 1-1v-3l-5-2-2 3a14 14 0 0 1-6-6l3-2Z',
    envelope: 'M3 5h18v14H3zM3 6l9 7 9-7',
    'comment-alt': 'M4 4h16v13H9l-5 4Z',
    'paper-plane': 'm22 2-7 20-4-9-9-4Zm0 0L11 13',
    'car-side': 'M3 14l2-6h12l4 6v5h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3Zm2-6 2-4h8l2 4M3 14h18M7 19h.01M17 19h.01',
    database: 'M12 3c5 0 9 1.3 9 3s-4 3-9 3-9-1.3-9-3 4-3 9-3Zm-9 3v6c0 1.7 4 3 9 3s9-1.3 9-3V6m-18 6v6c0 1.7 4 3 9 3s9-1.3 9-3v-6',
    'chart-line': 'M3 3v18h18M7 14l4-4 4 3 6-7',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12a2 2 0 0 0 4 0',
    camera: 'M3 7h4l2-3h6l2 3h4v13H3Zm9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3',
    'video-slash': 'M3 6h13v12H3zM16 10l5-3v10l-5-3M2 2l20 20',
    image: 'M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6M8 8h.01',
    'id-card': 'M3 5h18v14H3zM7 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-2 5a3 3 0 0 1 6 0Zm9-5h4m-4 4h4',
    crosshairs: 'M12 2v4m0 12v4M2 12h4m12 0h4m-10 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    'circle-check': 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4l-10 10-3-3',
    'triangle-exclamation': 'm12 3 10 18H2Zm0 7v4m0 3h.01',
    'circle-info': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14h.01M11 12h1v5h1',
    'address-card': 'M3 5h18v14H3zM7 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-2 5a3 3 0 0 1 6 0Zm9-5h4m-4 4h4',
    'arrow-up-right-from-square': 'M14 3h7v7m0-7-10 10M18 13v7H4V6h7',
    'rotate-right': 'M20 7v5h-5M20 12a8 8 0 1 1-2-5',
    stop: 'M6 6h12v12H6z',
    radar: 'M12 12 20 4M5 5a10 10 0 1 0 14 0M8 8a6 6 0 1 0 8 0M12 12V3',
    spinner: 'M12 3a9 9 0 1 0 9 9',
    bars: 'M4 6h16M4 12h16M4 18h16',
    times: 'm6 6 12 12M18 6 6 18',
    check: 'm5 12 4 4L19 6',
    'check-circle': 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4l-10 10-3-3',
    'circle-exclamation': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v5m0 3h.01',
    'exclamation-circle': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v5m0 3h.01',
    'exclamation-triangle': 'm12 3 10 18H2Zm0 7v4m0 3h.01',
    tag: 'm20 13-7 7L3 10V3h7Zm-12-6h.01',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0Z',
    linkedin: 'M5 8v11M5 5h.01M9 19v-6a3 3 0 0 1 6 0v6m0-6a3 3 0 0 1 6 0v6',
    github: 'M9 19c-4 1.3-4-2-6-2m12 4v-3.9a3.4 3.4 0 0 0-.9-2.7c3-.3 6.1-1.5 6.1-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.6S17.5 1.6 15 3.2a13 13 0 0 0-7 0C5.5 1.6 3.3 2.5 3.3 2.5a4.8 4.8 0 0 0-.1 3.6 5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.1 6.4 6.1 6.7A3.4 3.4 0 0 0 7 19v2',
    twitter: 'M22 5.9a8 8 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.4 8.4 0 0 1-2.7 1 4.2 4.2 0 0 0-7.2 3.8 12 12 0 0 1-8.8-4.5 4.2 4.2 0 0 0 1.3 5.6 4.1 4.1 0 0 1-1.9-.5v.1a4.2 4.2 0 0 0 3.4 4.1 4.2 4.2 0 0 1-1.9.1 4.2 4.2 0 0 0 3.9 2.9A8.5 8.5 0 0 1 2 18.7a12 12 0 0 0 18.5-10.1v-.5A8.6 8.6 0 0 0 22 5.9Z',
    facebook: 'M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.5A25 25 0 0 0 15 1c-3 0-5 1.8-5 5v3H7v4h3v8Z',
    instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1h.01',
};

const Icon = ({ className = '', ...props }) => {
    const name = className.split(/\s+/).find((part) => part.startsWith('fa-'))?.slice(3);
    const path = paths[name] || paths['circle-info'];
    return (
        <svg aria-hidden="true" className={`ui-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d={path} />
        </svg>
    );
};

export default Icon;
