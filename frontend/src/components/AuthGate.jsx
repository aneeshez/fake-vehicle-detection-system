import React, { useCallback, useEffect, useState } from 'react';
import Icon from './Icon';
import { api, refreshCsrfToken } from '../api';

const AuthGate = ({ children }) => {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [offline, setOffline] = useState(false);

    const checkSession = useCallback(async () => {
        setChecking(true);
        setOffline(false);
        try {
            const response = await api.get('/auth/session/');
            setUser(response.data.authenticated ? response.data.username : null);
        } catch {
            setOffline(true);
        } finally {
            setChecking(false);
        }
    }, []);

    useEffect(() => {
        checkSession();
        const handleUnauthorized = () => setUser(null);
        window.addEventListener('api-unauthorized', handleUnauthorized);
        return () => window.removeEventListener('api-unauthorized', handleUnauthorized);
    }, [checkSession]);

    const handleLogin = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const token = await refreshCsrfToken();
            const response = await api.post('/auth/login/', { username, password }, {
                headers: { 'X-CSRFToken': token }
            });
            setUser(response.data.username);
            setPassword('');
        } catch (requestError) {
            setError(requestError.response?.data?.error || 'Could not sign in. Check that Django is running.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = async () => {
        try {
            const token = await refreshCsrfToken();
            await api.post('/auth/logout/', {}, { headers: { 'X-CSRFToken': token } });
        } catch {
            // Clear the local session view even when the remote session has already expired.
        } finally {
            setUser(null);
        }
    };

    if (checking) {
        return <main className="auth-page"><div className="auth-state" role="status">Checking secure session…</div></main>;
    }
    if (offline) {
        return <main className="auth-page"><section className="auth-card"><h2>API unavailable</h2><p>Start the Django server, then try again.</p><button type="button" className="primary-button" onClick={checkSession}>Try again</button></section></main>;
    }
    if (!user) {
        return (
            <main className="auth-page">
                <section className="auth-card" aria-labelledby="sign-in-title">
                    <div className="auth-icon"><Icon className="fas fa-lock" /></div>
                    <span className="section-kicker">PRIVATE VEHICLE REGISTER</span>
                    <h2 id="sign-in-title">Sign in to continue</h2>
                    <p>Vehicle records and detection history are only available to authorized users.</p>
                    <form className="auth-form" onSubmit={handleLogin}>
                        <label htmlFor="detect-username">Username</label>
                        <input id="detect-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={150} />
                        <label htmlFor="detect-password">Password</label>
                        <input id="detect-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={1024} />
                        {error && <p className="auth-error" role="alert">{error}</p>}
                        <button type="submit" className="primary-button" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
                    </form>
                    <a className="auth-admin-link" href={`${api.defaults.baseURL.replace(/\/api\/?$/, '')}/admin/login/`} target="_blank" rel="noreferrer">Need an account? Ask an administrator.</a>
                </section>
            </main>
        );
    }
    return children({ username: user, onLogout: handleLogout });
};

export default AuthGate;
