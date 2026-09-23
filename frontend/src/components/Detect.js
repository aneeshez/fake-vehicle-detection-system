import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import Icon from './Icon';
import './Detect.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const ADMIN_VEHICLES_URL = `${API_BASE_URL.replace(/\/api\/?$/, '')}/admin/vehicles/vehicle/`;
const SCAN_INTERVAL_MS = 2200;
const statusLabels = { genuine: 'Genuine match', fraud: 'Possible mismatch', not_found: 'Not found', needs_review: 'Needs review', unreadable: 'Plate unreadable', no_vehicle: 'No plate detected' };

const Detect = () => {
    const webcamRef = useRef(null);
    const busyRef = useRef(false);
    const analyzeRef = useRef(null);
    const [cameraOn, setCameraOn] = useState(false);
    const [monitoring, setMonitoring] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [apiState, setApiState] = useState('checking');
    const [vehicles, setVehicles] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);

    const refreshRecords = useCallback(async () => {
        try {
            const [vehiclesResponse, eventsResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/vehicles/`),
                axios.get(`${API_BASE_URL}/events/`)
            ]);
            setVehicles(vehiclesResponse.data.vehicles || []);
            setEvents(eventsResponse.data.events || []);
        } catch (requestError) {
            setError(requestError.response?.data?.error || 'Could not load registered vehicles from Django.');
        }
    }, []);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/health/`, { timeout: 5000 })
            .then(() => setApiState('connected'))
            .catch(() => setApiState('disconnected'));
        refreshRecords();
    }, [refreshRecords]);

    const analyzeImage = useCallback(async (imageData) => {
        if (busyRef.current) return;
        busyRef.current = true;
        setProcessing(true);
        setError('');
        try {
            const response = await axios.post(`${API_BASE_URL}/detect/`, { image: imageData }, { timeout: 60000 });
            setResult(response.data);
            if (response.data.status !== 'no_vehicle') refreshRecords();
        } catch (requestError) {
            setError(requestError.response?.data?.error || 'Frame analysis failed. Check that Django and the vision models are running.');
        } finally {
            busyRef.current = false;
            setProcessing(false);
        }
    }, [refreshRecords]);

    const captureAndAnalyze = useCallback(() => {
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = () => analyzeImage(reader.result);
            reader.readAsDataURL(selectedFile);
            setSelectedFile(null);
            return;
        }
        const screenshot = webcamRef.current?.getScreenshot();
        if (screenshot) analyzeImage(screenshot);
        else setError('Start the camera or choose an image before analyzing.');
    }, [analyzeImage, selectedFile]);

    analyzeRef.current = captureAndAnalyze;
    useEffect(() => {
        if (!monitoring) return undefined;
        const timer = window.setInterval(() => analyzeRef.current?.(), SCAN_INTERVAL_MS);
        return () => window.clearInterval(timer);
    }, [monitoring]);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files?.[0] || null);
        setError('');
    };
    const cameraError = () => {
        setCameraOn(false);
        setMonitoring(false);
        setError('Camera access failed. Allow camera access in your browser, or choose a vehicle image to analyze.');
    };

    return (
        <div className="detect-page">
            <div className="detect-overlay">
                <main className="detect-content">
                    <header className="detect-header">
                        <div className="eyebrow"><span className={`connection-dot ${apiState}`} /> VEHICLE VERIFICATION</div>
                        <h1>Live Vehicle Detection</h1>
                        <p>Capture a passing vehicle, read its plate, and compare it with registered vehicle details.</p>
                    </header>

                    <section className="monitor-grid">
                        <div className="camera-card">
                            <div className="camera-card-heading">
                                <div><span className="section-kicker">LIVE CAMERA</span><h2>Camera feed</h2></div>
                                <span className={`feed-state ${monitoring ? 'live' : ''}`}><span /> {monitoring ? 'Monitoring' : cameraOn ? 'Camera ready' : 'Camera off'}</span>
                            </div>
                            <div className="camera-frame">
                                {cameraOn ? (
                                    <Webcam ref={webcamRef} audio={false} mirrored={false} screenshotFormat="image/jpeg" screenshotQuality={0.72}
                                        videoConstraints={{ facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }}
                                        onUserMediaError={cameraError} className="camera-video" />
                                ) : (
                                    <div className="camera-placeholder"><div className="camera-placeholder-icon"><Icon className="fas fa-video" /></div><strong>Your camera feed will appear here</strong><span>Use the live camera or analyze a saved image.</span></div>
                                )}
                                {processing && <div className="processing-pill"><span className="mini-spinner" /> Analyzing frame</div>}
                            </div>
                            <div className="camera-controls">
                                {!cameraOn ? <button className="primary-button" onClick={() => { setError(''); setCameraOn(true); }}><Icon className="fas fa-camera" /> Start camera</button> : <>
                                    <button className={`primary-button ${monitoring ? 'stop-button' : ''}`} onClick={() => setMonitoring(!monitoring)}><Icon className={`fas ${monitoring ? 'fa-stop' : 'fa-radar'}`} /> {monitoring ? 'Stop monitoring' : 'Start monitoring'}</button>
                                    <button className="secondary-button" disabled={processing} onClick={captureAndAnalyze}><Icon className="fas fa-crosshairs" /> Capture & check</button>
                                    <button className="icon-button" aria-label="Turn camera off" onClick={() => { setMonitoring(false); setCameraOn(false); }}><Icon className="fas fa-video-slash" /></button>
                                </>}
                                <label className="upload-button"><Icon className="fas fa-image" /> {selectedFile ? 'Image selected' : 'Choose image'}<input type="file" accept="image/*" capture="environment" onChange={handleFileChange} /></label>
                                {selectedFile && <button className="secondary-button analyze-upload" disabled={processing} onClick={captureAndAnalyze}>Analyze image</button>}
                            </div>
                            {error && <div className="detect-error"><Icon className="fas fa-circle-exclamation" /> {error}</div>}
                        </div>

                        <aside className="result-card" aria-live="polite">
                            <div className="camera-card-heading result-heading"><div><span className="section-kicker">LATEST CHECK</span><h2>Verification result</h2></div>
                                {result && <span className={`result-mark ${result.status}`}><Icon className={`fas ${result.status === 'genuine' ? 'fa-check' : result.status === 'fraud' ? 'fa-triangle-exclamation' : 'fa-circle-info'}`} /></span>}
                            </div>
                            {!result ? <div className="empty-result"><Icon className="fas fa-car-side" /><strong>Waiting for a vehicle</strong><span>Start monitoring or capture a frame to begin.</span></div> : <>
                                <div className={`decision-banner ${result.status}`}><span>{statusLabels[result.status] || 'Review result'}</span><p>{result.message}</p></div>
                                {result.annotated_image && <div className="frame-evidence"><span>CAPTURED FRAME</span><img src={result.annotated_image} alt="Captured frame with detected vehicle and number plate outlined" /></div>}
                                <div className="plate-result-row">
                                    {result.plate_crop ? <img src={result.plate_crop} alt="Captured number plate" /> : <div className="plate-placeholder"><Icon className="fas fa-id-card" /></div>}
                                    <div className="plate-copy"><span>READ NUMBER PLATE</span><strong>{result.number_plate || 'Not readable'}</strong>{result.ocr_confidence != null && <small>OCR confidence {Math.round(result.ocr_confidence * 100)}%</small>}</div>
                                </div>
                                <div className="compare-columns">
                                    <div><span>CAMERA DETECTED</span><strong>{result.detected_vehicle ? `${titleCase(result.detected_vehicle.color)} ${titleCase(result.detected_vehicle.vehicle_type)}` : 'Not clear'}</strong></div>
                                    <div><span>REGISTERED AS</span><strong>{result.registered_vehicle ? `${titleCase(result.registered_vehicle.color)} ${titleCase(result.registered_vehicle.vehicle_type)}` : result.status === 'not_found' ? 'No database record' : '—'}</strong></div>
                                </div>
                                {result.registered_vehicle && <div className="registered-owner"><Icon className="fas fa-address-card" /><span>{result.registered_vehicle.make_model || 'Registered vehicle'}</span></div>}
                                {result.vehicle_crop && <div className="vehicle-evidence"><span>CAPTURED VEHICLE</span><img src={result.vehicle_crop} alt="Captured vehicle used for comparison" /></div>}
                            </>}
                            <div className="result-footer"><Icon className="fas fa-circle-check" /> A mismatch is a review flag, not proof of fraud.</div>
                        </aside>
                    </section>

                    <section className="support-grid">
                        <div className="support-card records-card">
                            <div className="support-heading"><div><span className="section-kicker">DATABASE</span><h2>Registered vehicles <span className="count-chip">{vehicles.length}</span></h2></div><a href={ADMIN_VEHICLES_URL} target="_blank" rel="noreferrer" className="admin-link">Manage records <Icon className="fas fa-arrow-up-right-from-square" /></a></div>
                            {vehicles.length ? <div className="records-list">{vehicles.slice(0, 5).map((vehicle) => <div className="record-row" key={vehicle.id}><strong>{vehicle.number_plate}</strong><span>{titleCase(vehicle.color)} {titleCase(vehicle.vehicle_type)}</span><small>{vehicle.make_model || 'Vehicle record'}</small></div>)}</div> : <div className="support-empty">No vehicle records yet. Add registered plates in Django Admin to enable comparisons.</div>}
                        </div>
                        <div className="support-card events-card">
                            <div className="support-heading"><div><span className="section-kicker">RECENT ACTIVITY</span><h2>Latest detections</h2></div><button className="refresh-link" onClick={refreshRecords} aria-label="Refresh records"><Icon className="fas fa-rotate-right" /></button></div>
                            {events.length ? <div className="events-list">{events.slice(0, 5).map((event, index) => <div className="event-row" key={`${event.number_plate}-${event.created_at}-${index}`}><span className={`event-dot ${event.status}`} /><div><strong>{event.number_plate || 'Unreadable plate'}</strong><small>{event.message}</small></div><span className={`event-label ${event.status}`}>{statusLabels[event.status] || event.status}</span></div>)}</div> : <div className="support-empty">Detection results will appear here after the first plate is read.</div>}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

function titleCase(value = '') { return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''; }

export default Detect;
