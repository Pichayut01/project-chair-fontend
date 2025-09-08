// src/component/AccountSetting.jsx

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import '../CSS/AccountSetting.css';
import nullUserPhoto from '../image/nulluser.png';
import Navbar from '../component/Navbar'
import '../CSS/Navbar.css'
const API_BASE_URL = 'http://localhost:5000';

const AccountSetting = ({ user, updateUserProfile, onSignOut, isSidebarOpen, toggleSidebar }) => {
    const [activeSection, setActiveSection] = useState('account');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user.photoURL);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showCropper, setShowCropper] = useState(false);

    // Cropper states
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [imageSrcToCrop, setImageSrcToCrop] = useState(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            const fileReader = new FileReader();
            fileReader.onload = () => {
                setImageSrcToCrop(fileReader.result);
                setShowCropper(true);
            };
            fileReader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setPreviewUrl(user.photoURL);
        }
    };

    const handleCropAndUpload = async () => {
        setLoading(true);
        setMessage('');
        setShowCropper(false);

        try {
            const croppedImageBlob = await getCroppedImg(imageSrcToCrop, croppedAreaPixels);
            const formData = new FormData();
            formData.append('profileImage', croppedImageBlob, selectedFile.name);

            const response = await fetch(`${API_BASE_URL}/api/auth/profile/update-photo`, {
                method: 'POST',
                headers: {
                    'x-auth-token': user.token,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                updateUserProfile(data.user);
                setPreviewUrl(data.user.photoURL);
                // Also update localStorage directly
                localStorage.setItem('userPhotoURL', data.user.photoURL);
                localStorage.setItem('userProfile', JSON.stringify({
                    ...JSON.parse(localStorage.getItem('userProfile')),
                    photoURL: data.user.photoURL
                }));
                setMessage('Profile picture updated successfully!');
            } else {
                const errorMessage = typeof data.msg === 'string' ? data.msg : 'Failed to update profile picture.';
                setMessage(errorMessage);
            }
        } catch (error) {
            console.error("Error cropping or uploading photo:", error);
            const errorMessage = typeof error === 'object' && error.message ? error.message : 'Server error. Please try again later.';
            setMessage(errorMessage);
        } finally {
            setLoading(false);
            setSelectedFile(null);
            setImageSrcToCrop(null);
        }
    };

    const handleDeletePhoto = async () => {
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/profile/delete-photo`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': user.token,
                },
            });

            const data = await response.json();

            if (response.ok) {
                updateUserProfile(data.user);
                setPreviewUrl(null);
                // Also update localStorage directly
                localStorage.removeItem('userPhotoURL');
                localStorage.setItem('userProfile', JSON.stringify({
                    ...JSON.parse(localStorage.getItem('userProfile')),
                    photoURL: null
                }));
                setMessage('Profile picture removed successfully!');
            } else {
                const errorMessage = typeof data.msg === 'string' ? data.msg : 'Failed to remove profile picture.';
                setMessage(errorMessage);
            }
        } catch (error) {
            console.error("Error deleting profile photo:", error);
            const errorMessage = typeof error === 'object' && error.message ? error.message : 'Server error. Please try again later.';
            setMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    const photoSrc = previewUrl
        ? (previewUrl.startsWith('blob:') ? previewUrl : `${API_BASE_URL}${previewUrl}`)
        : nullUserPhoto;

    const renderAccountSection = () => (
        <div className="setting-section">
            <h2 className="section-title">Account Settings</h2>

            <div className="profile-photo-section">
                <img
                    src={photoSrc}
                    alt="Profile"
                    className="profile-photo"
                />
                <div className="photo-actions">
                    <label className="file-upload-label">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file-upload-input"
                            disabled={loading}
                        />
                        <span className="file-upload-button">
                            {loading ? 'Processing...' : 'Change Photo'}
                        </span>
                    </label>
                    {user.photoURL && (
                        <button
                            onClick={handleDeletePhoto}
                            className="remove-photo-button"
                            disabled={loading}
                        >
                            Remove Photo
                        </button>
                    )}
                </div>
            </div>
            {message && <p className="message">{message}</p>}

            <div className="user-info-section">
                <h3>User Information</h3>
                <p><strong>Name:</strong> {user.displayName}</p>
                <p><strong>Email:</strong> {user.email}</p>
            </div>

            <div className="action-buttons">
                <button onClick={onSignOut} className="sign-out-button">Sign Out</button>
            </div>
        </div>
    );

    const renderSecuritySection = () => (
        <div className="setting-section">
            <h2 className="section-title">Security Settings</h2>
            <div className="placeholder-content">
                <p>Security settings will be implemented here.</p>
                <ul>
                    <li>Change Password</li>
                    <li>Two-Factor Authentication</li>
                    <li>Login History</li>
                    <li>Active Sessions</li>
                </ul>
            </div>
        </div>
    );

    const renderPrivacySection = () => (
        <div className="setting-section">
            <h2 className="section-title">Privacy Settings</h2>
            <div className="placeholder-content">
                <p>Privacy settings will be implemented here.</p>
                <ul>
                    <li>Profile Visibility</li>
                    <li>Data Sharing Preferences</li>
                    <li>Activity Tracking</li>
                    <li>Account Deletion</li>
                </ul>
            </div>
        </div>
    );

    const renderNotificationsSection = () => (
        <div className="setting-section">
            <h2 className="section-title">Notification Settings</h2>
            <div className="placeholder-content">
                <p>Notification settings will be implemented here.</p>
                <ul>
                    <li>Email Notifications</li>
                    <li>Push Notifications</li>
                    <li>Classroom Updates</li>
                    <li>System Alerts</li>
                </ul>
            </div>
        </div>
    );

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                handleSignOut={onSignOut}
                isAccountSettingPage={true}
                accountActiveSection={activeSection}
                onAccountSectionChange={handleSectionChange}
            />
            <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
                <div className="account-setting-container">
                    <div className="account-main-content">
                        {activeSection === 'account' && renderAccountSection()}
                        {activeSection === 'security' && renderSecuritySection()}
                        {activeSection === 'privacy' && renderPrivacySection()}
                        {activeSection === 'notifications' && renderNotificationsSection()}
                    </div>

                    {showCropper && (
                        <div className="cropper-modal">
                            <div className="cropper-container">
                                <Cropper
                                    image={imageSrcToCrop}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>
                            <div className="cropper-controls">
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(e.target.value)}
                                    className="zoom-slider"
                                />
                                <button onClick={() => setShowCropper(false)} className="cancel-crop-button">
                                    Cancel
                                </button>
                                <button onClick={handleCropAndUpload} className="crop-upload-button">
                                    Crop & Upload
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
};

export default AccountSetting;