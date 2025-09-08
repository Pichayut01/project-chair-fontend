// src/pages/EditClassroomPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '../component/Navbar';
import '../CSS/EditClassroomPage.css';
import '../CSS/Navbar.css';
import '../CSS/Main.css';
import '../CSS/ClassroomPage.css';
import userPlaceholderImage from '../image/nulluser.png';
import Chair from '../component/Chair';
import ChairPresets from '../component/ChairPresets';
import { FaPalette, FaUsers, FaEllipsisH, FaSave, FaChair, FaTh, FaRandom, FaBars, FaThLarge } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const EditClassroomPage = ({ user, isSidebarOpen, toggleSidebar, handleSignOut }) => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [classroom, setClassroom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('theme');
    const [isEditing, setIsEditing] = useState(false);
    
    // Theme settings
    const [themeData, setThemeData] = useState({
        name: '',
        subname: '',
        color: '#4CAF50',
        bannerUrl: ''
    });

    // Role management
    const [classroomMembers, setClassroomMembers] = useState({
        creator: [],
        participants: []
    });

    // Other settings
    const [otherSettings, setOtherSettings] = useState({
        classCode: '',
        isPublic: false,
        allowSelfJoin: true
    });

    // Seating management
    const [seatingPositions, setSeatingPositions] = useState({});
    const [currentChairPositions, setCurrentChairPositions] = useState({});
    const [assignedUsers, setAssignedUsers] = useState({});
    const [isSeatingEditing, setIsSeatingEditing] = useState(false);
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        if (!user || !user.token || !classId) return;
        fetchClassroomDetails();
    }, [classId, user]);

    const fetchClassroomDetails = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/classrooms/${classId}`, {
                headers: { 'x-auth-token': user.token }
            });
            const data = response.data;
            setClassroom(data);
            
            // Set theme data
            setThemeData({
                name: data.name || '',
                subname: data.subname || '',
                color: data.color || '#4CAF50',
                bannerUrl: data.bannerUrl || ''
            });
            
            // Set banner preview if exists
            if (data.bannerUrl) {
                setBannerPreview(`${API_BASE_URL}${data.bannerUrl}`);
            }

            // Set classroom members
            setClassroomMembers({
                creator: data.creator || [],
                participants: data.participants || []
            });

            // Set other settings
            setOtherSettings({
                classCode: data.classCode || '',
                isPublic: data.isPublic || false,
                allowSelfJoin: data.allowSelfJoin !== false
            });

            // Set seating data
            const fetchedPositions = data.seatingPositions || {};
            const fetchedAssignedUsers = data.assignedUsers || {};
            setSeatingPositions(fetchedPositions);
            setCurrentChairPositions(fetchedPositions);
            setAssignedUsers(fetchedAssignedUsers);

            setLoading(false);
        } catch (err) {
            console.error("Error fetching classroom details:", err);
            Swal.fire('Error', 'Failed to load classroom details.', 'error');
            setLoading(false);
        }
    };


    const handleSaveSettings = async () => {
        try {
            await axios.put(
                `${API_BASE_URL}/api/classrooms/${classId}/settings`,
                {
                    isPublic: otherSettings.isPublic,
                    allowSelfJoin: otherSettings.allowSelfJoin
                },
                { headers: { 'x-auth-token': user.token } }
            );
            Swal.fire('Success', 'Classroom settings updated successfully!', 'success');
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update settings:", err);
            Swal.fire('Error', 'Failed to update classroom settings.', 'error');
        }
    };

    const handlePromoteMember = async (memberId, memberName) => {
        try {
            const result = await Swal.fire({
                title: `Promote ${memberName} to Creator?`,
                text: "This user will gain the same permissions as the classroom owner.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Promote',
                cancelButtonText: 'Cancel'
            });
            if (result.isConfirmed) {
                await axios.put(
                    `${API_BASE_URL}/api/classrooms/${classId}/promote`,
                    { userId: memberId },
                    { headers: { 'x-auth-token': user.token } }
                );
                Swal.fire('Success', `${memberName} has been promoted to Creator.`, 'success');
                fetchClassroomDetails();
            }
        } catch (err) {
            Swal.fire('Error', 'Could not promote the member.', 'error');
        }
    };

    const handleDemoteMember = async (memberId, memberName) => {
        try {
            const result = await Swal.fire({
                title: `Demote ${memberName}?`,
                text: "This user will lose their Creator permissions.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e74c3c',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Demote',
                cancelButtonText: 'Cancel'
            });
            if (result.isConfirmed) {
                await axios.put(
                    `${API_BASE_URL}/api/classrooms/${classId}/demote`,
                    { userId: memberId },
                    { headers: { 'x-auth-token': user.token } }
                );
                Swal.fire('Success', `${memberName} has been demoted to a participant.`, 'success');
                fetchClassroomDetails();
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.msg || 'Could not demote the member.', 'error');
        }
    };

    const handleKickMember = async (memberId, memberName) => {
        const result = await Swal.fire({
            title: `Kick ${memberName} from the classroom?`,
            text: "This user will be removed from the classroom.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Kick',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#e74c3c'
        });
        if (result.isConfirmed) {
            try {
                await axios.put(
                    `${API_BASE_URL}/api/classrooms/${classId}/kick`,
                    { userId: memberId },
                    { headers: { 'x-auth-token': user.token } }
                );
                Swal.fire('Success', `${memberName} has been kicked from the classroom.`, 'success');
                fetchClassroomDetails();
            } catch (err) {
                Swal.fire('Error', 'Could not kick the member.', 'error');
            }
        }
    };

    const handleBackToClassroom = () => {
        navigate(`/classroom/${classId}`);
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    const handleChairMove = useCallback((id, newX, newY) => {
        setCurrentChairPositions(prevPositions => ({
            ...prevPositions,
            [id]: { x: newX, y: newY }
        }));
    }, []);

    const handleApplyPreset = async (presetType) => {
        if (!containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const chairCount = Object.keys(currentChairPositions).length;
        
        if (chairCount === 0) {
            Swal.fire('No Chairs', 'Please add some chairs first before applying presets.', 'info');
            return;
        }

        const result = await Swal.fire({
            title: `Apply ${presetType.charAt(0).toUpperCase() + presetType.slice(1)} Layout?`,
            text: "This will rearrange all chairs according to the selected preset.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Apply Layout',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            const newPositions = ChairPresets.generatePreset(
                presetType, 
                chairCount, 
                containerRect.width || 800, 
                containerRect.height || 600
            );
            
            // Map existing chair IDs to new positions
            const chairIds = Object.keys(currentChairPositions);
            const updatedPositions = {};
            
            chairIds.forEach((chairId, index) => {
                const presetKey = `chair-${index + 1}`;
                if (newPositions[presetKey]) {
                    updatedPositions[chairId] = newPositions[presetKey];
                } else {
                    updatedPositions[chairId] = currentChairPositions[chairId];
                }
            });
            
            setCurrentChairPositions(updatedPositions);
            Swal.fire('Success', `${presetType.charAt(0).toUpperCase() + presetType.slice(1)} layout applied!`, 'success');
        }
    };

    const handleBannerFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file type
            if (!file.type.startsWith('image/')) {
                Swal.fire('Error', 'Please select an image file.', 'error');
                return;
            }
            
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire('Error', 'Image size must be less than 5MB.', 'error');
                return;
            }
            
            setBannerFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setBannerPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveBanner = () => {
        setBannerFile(null);
        setBannerPreview('');
        setThemeData({...themeData, bannerUrl: ''});
    };

    const handleSaveTheme = async () => {
        try {
            let updatedThemeData = { ...themeData };
            
            // If there's a new banner file, upload it first
            if (bannerFile) {
                const formData = new FormData();
                formData.append('banner', bannerFile);
                
                const uploadResponse = await axios.post(`${API_BASE_URL}/api/classrooms/${classId}/banner`, formData, {
                    headers: { 
                        'x-auth-token': user.token,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                updatedThemeData.bannerUrl = uploadResponse.data.bannerUrl;
            setBannerPreview(`${API_BASE_URL}${uploadResponse.data.bannerUrl}`);
            }
            
            await axios.put(`${API_BASE_URL}/api/classrooms/${classId}/theme`, updatedThemeData, {
                headers: { 'x-auth-token': user.token }
            });
            
            setClassroom(prev => ({ ...prev, ...updatedThemeData }));
            setThemeData(updatedThemeData);
            setBannerFile(null);
            setIsEditing(false);
            Swal.fire('Saved!', 'Theme settings updated successfully.', 'success');
        } catch (error) {
            console.error('Failed to save theme:', error);
            Swal.fire('Error', 'Failed to save theme settings.', 'error');
        }
    };

    const handleSaveSeating = async () => {
        try {
            await axios.put(`${API_BASE_URL}/api/classrooms/${classId}/seating`, {
                seatingPositions: currentChairPositions
            }, {
                headers: { 'x-auth-token': user.token }
            });
            setSeatingPositions(currentChairPositions);
            setIsSeatingEditing(false);
            Swal.fire('Saved!', 'Seating arrangement updated successfully.', 'success');
        } catch (error) {
            console.error('Failed to save seating positions:', error);
            Swal.fire('Error', 'Failed to save seating arrangement.', 'error');
        }
    };

    const handleCancelSeatingEdit = () => {
        setIsSeatingEditing(false);
        setCurrentChairPositions(seatingPositions);
    };

    const calculateContainerSize = () => {
        const positions = isSeatingEditing ? currentChairPositions : seatingPositions;
        const chairList = Object.values(positions);
        
        // คำนวณขนาดขั้นต่ำให้เต็มจอเมื่อเปิด sidebar (ลด 10%)
        const sidebarWidth = isSidebarOpen ? 250 : 0;
        const navbarHeight = 120; // ความสูงของ navbar
        const minWidth = (window.innerWidth - sidebarWidth - 40) * 0.9; // ลด 10%
        const minHeight = (window.innerHeight - navbarHeight) * 0.9; // ลด 10%
        
        if (chairList.length === 0) {
            return { 
                width: Math.round(minWidth) + 'px', 
                height: Math.round(minHeight) + 'px' 
            };
        }

        // คำนวณขนาดจากตำแหน่งเก้าอี้
        const chairSize = 60;
        const chairRadius = chairSize / 2;
        const nameHeight = 20;
        const padding = 80;
        
        // คำนวณขอบเขตจริงของเก้าอี้
        const bounds = chairList.reduce((acc, pos) => {
            const left = pos.x - chairRadius;
            const right = pos.x + chairRadius;
            const top = pos.y - chairRadius;
            const bottom = pos.y + chairRadius + nameHeight;
            
            return {
                minX: Math.min(acc.minX, left),
                maxX: Math.max(acc.maxX, right),
                minY: Math.min(acc.minY, top),
                maxY: Math.max(acc.maxY, bottom)
            };
        }, {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity
        });
        
        // ใช้ขนาดที่ใหญ่กว่าระหว่างขนาดเก้าอี้กับขนาดขั้นต่ำ
        const contentWidth = Math.max(minWidth, bounds.maxX - bounds.minX + (2 * padding));
        const contentHeight = Math.max(minHeight, bounds.maxY - bounds.minY + (2 * padding));
        
        return {
            width: Math.round(contentWidth) + 'px',
            height: Math.round(contentHeight) + 'px'
        };
    };

    const addNewChair = () => {
        const chairId = `chair-${Date.now()}`;
        const newPosition = { x: 100, y: 100 };
        setCurrentChairPositions(prev => ({
            ...prev,
            [chairId]: newPosition
        }));
    };

    const renderThemeSection = () => (
        <div className="edit-section">
            <h2 className="section-title">
                <FaPalette className="section-icon" />
                Theme Settings
            </h2>
            
            <div className="form-group">
                <label>Classroom Name</label>
                <input
                    type="text"
                    value={themeData.name}
                    onChange={(e) => setThemeData({...themeData, name: e.target.value})}
                    disabled={!isEditing}
                />
            </div>

            <div className="form-group">
                <label>Description</label>
                <input
                    type="text"
                    value={themeData.subname}
                    onChange={(e) => setThemeData({...themeData, subname: e.target.value})}
                    disabled={!isEditing}
                />
            </div>

            <div className="form-group">
                <label>Theme Color</label>
                <input
                    type="color"
                    value={themeData.color}
                    onChange={(e) => setThemeData({...themeData, color: e.target.value})}
                    disabled={!isEditing}
                />
            </div>

            <div className="form-group">
                <label>Banner Image</label>
                {isEditing ? (
                    <div className="banner-upload-section">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerFileChange}
                            className="file-input"
                            id="banner-upload"
                        />
                        <label htmlFor="banner-upload" className="file-upload-btn">
                            Choose Banner Image
                        </label>
                        <span className="file-info">Max size: 5MB. Supported: JPG, PNG, GIF</span>
                        
                        {bannerPreview && (
                            <div className="banner-actions">
                                <button 
                                    type="button" 
                                    className="remove-banner-btn"
                                    onClick={handleRemoveBanner}
                                >
                                    Remove Banner
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="banner-display">
                        {bannerPreview ? (
                            <span className="current-banner-text">Banner image uploaded</span>
                        ) : (
                            <span className="no-banner-text">No banner image</span>
                        )}
                    </div>
                )}
            </div>

            {bannerPreview && (
                <div className="banner-preview">
                    <img src={bannerPreview} alt="Banner Preview" />
                </div>
            )}
        </div>
    );

    const renderRoleSection = () => (
        <div className="edit-section">
            <h2 className="section-title">
                <FaUsers className="section-icon" />
                Role Management
            </h2>

            <div className="role-section">
                <h3>Creators ({classroomMembers.creator.length})</h3>
                <div className="members-list">
                    {classroomMembers.creator.map(creator => (
                        <div key={creator._id} className="member-card creator">
                            <img src={creator.photoURL ? `${API_BASE_URL}${creator.photoURL}` : '/nulluser.png'} alt={creator.displayName} />
                            <span>{creator.displayName}</span>
                            {isEditing && user.id !== creator._id && (
                                <button 
                                    className="action-btn demote-btn"
                                    onClick={() => handleDemoteMember(creator._id, creator.displayName)}
                                >
                                    Demote
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="role-section">
                <h3>Participants ({classroomMembers.participants.length})</h3>
                <div className="members-list">
                    {classroomMembers.participants.map(participant => (
                        <div key={participant._id} className="member-card participant">
                            <img src={participant.photoURL ? `${API_BASE_URL}${participant.photoURL}` : '/nulluser.png'} alt={participant.displayName} />
                            <span>{participant.displayName}</span>
                            {isEditing && (
                                <>
                                    <button 
                                        className="action-btn promote-btn"
                                        onClick={() => handlePromoteMember(participant._id, participant.displayName)}
                                    >
                                        Promote
                                    </button>
                                    <button 
                                        className="action-btn kick-btn"
                                        onClick={() => handleKickMember(participant._id, participant.displayName)}
                                    >
                                        Kick
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderOtherSection = () => (
        <div className="edit-section">
            <h2 className="section-title">
                <FaEllipsisH className="section-icon" />
                Other Settings
            </h2>

            <div className="form-group">
                <label>Class Code</label>
                <div className="class-code-display">
                    <input
                        type="text"
                        value={otherSettings.classCode}
                        readOnly
                        className="readonly-input"
                    />
                    <button 
                        className="copy-btn"
                        onClick={() => {
                            navigator.clipboard.writeText(otherSettings.classCode);
                            Swal.fire('Copied!', 'Class code copied to clipboard.', 'success');
                        }}
                    >
                        Copy
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={otherSettings.isPublic}
                        onChange={(e) => setOtherSettings({...otherSettings, isPublic: e.target.checked})}
                        disabled={!isEditing}
                    />
                    <span>Make classroom public</span>
                </label>
            </div>

            <div className="form-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={otherSettings.allowSelfJoin}
                        onChange={(e) => setOtherSettings({...otherSettings, allowSelfJoin: e.target.checked})}
                        disabled={!isEditing}
                    />
                    <span>Allow students to join with class code</span>
                </label>
            </div>

            {isEditing && (
                <button className="save-settings-btn" onClick={handleSaveSettings}>
                    <FaSave />
                    Save Settings
                </button>
            )}
        </div>
    );

    const renderSeatingSection = () => (
        <div className="edit-section">
            <h2 className="section-title">
                <FaChair className="section-icon" />
                Seating Management
            </h2>
            
            <div className="seating-controls">
                <div className="seating-actions">
                    {!isSeatingEditing ? (
                        <button 
                            className="edit-mode-btn" 
                            onClick={() => setIsSeatingEditing(true)}
                        >
                            Edit Seating
                        </button>
                    ) : (
                        <div className="seating-edit-actions">
                            <button className="add-chair-btn" onClick={addNewChair}>
                                Add Chair
                            </button>
                            <div className="chair-presets">
                                <span className="presets-label">Quick Layouts:</span>
                                <button 
                                    className="preset-btn rows-btn" 
                                    onClick={() => handleApplyPreset('rows')}
                                    title="Arrange chairs in rows"
                                >
                                    <FaBars /> Rows
                                </button>
                                <button 
                                    className="preset-btn grid-btn" 
                                    onClick={() => handleApplyPreset('grid')}
                                    title="Arrange chairs in grid pattern"
                                >
                                    <FaThLarge /> Grid
                                </button>
                                <button 
                                    className="preset-btn groups-btn" 
                                    onClick={() => handleApplyPreset('groups')}
                                    title="Arrange chairs in groups"
                                >
                                    <FaTh /> Groups
                                </button>
                                <button 
                                    className="preset-btn scattered-btn" 
                                    onClick={() => handleApplyPreset('scattered')}
                                    title="Scatter chairs randomly"
                                >
                                    <FaRandom /> Scattered
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="seating-preview">
                {Object.keys(seatingPositions).length === 0 ? (
                    <div className="no-seating-chart">
                        No seating chart available. Click "Edit Seating" to start creating one.
                    </div>
                ) : (
                    <div className="seating-container-wrapper" style={{
                        width: '100%',
                        overflowX: 'auto',
                        overflowY: 'auto',
                        maxHeight: '60vh'
                    }}>
                        <div className="seating-grid" ref={containerRef} style={{ 
                            position: 'relative', 
                            width: calculateContainerSize().width,
                            height: calculateContainerSize().height,
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            backgroundColor: '#f9f9f9',
                            margin: '0 auto',
                            minWidth: '400px'
                        }}>
                            {Object.entries(isSeatingEditing ? currentChairPositions : seatingPositions).map(([id, pos]) => {
                                const assignedUser = assignedUsers[id];
                                const photoURL = assignedUser?.photoURL ? `${API_BASE_URL}${assignedUser.photoURL}` : userPlaceholderImage;
                                const userName = assignedUser?.userName || null;

                                return (
                                    <Chair
                                        key={id}
                                        id={id}
                                        initialPosition={pos}
                                        onChairMove={handleChairMove}
                                        containerRef={containerRef}
                                        isDraggable={isSeatingEditing}
                                        userPhotoURL={photoURL}
                                        userName={userName}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {isSeatingEditing && (
                <div className="seating-edit-footer">
                    <button className="save-btn" onClick={handleSaveSeating}>
                        <FaSave />
                        Save Seating
                    </button>
                    <button className="cancel-btn" onClick={handleCancelSeatingEdit}>
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );


    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!classroom) {
        return <div className="error">Classroom not found.</div>;
    }

    const isCreator = user && classroom?.creator && (
        (Array.isArray(classroom.creator) ? classroom.creator.some(c => c._id === user.id) : classroom.creator._id === user.id)
    );

    if (!isCreator) {
        return <div className="error">You don't have permission to edit this classroom.</div>;
    }

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                onClassActionClick={() => {}}
                classrooms={[]}
                handleSignOut={handleSignOut}
                isEditClassroomPage={true}
                onBackClick={handleBackToClassroom}
                classroom={classroom}
                editActiveSection={activeSection}
                onEditSectionChange={handleSectionChange}
            />
            
            <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
                <div className="edit-classroom-container">
                    <div className="edit-header">
                        <h1>Edit Classroom Settings</h1>
                        <div className="edit-actions">
                            {!isEditing ? (
                                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                                    Edit Settings
                                </button>
                            ) : (
                                <>
                                    <button className="save-btn" onClick={activeSection === 'theme' ? handleSaveTheme : activeSection === 'other' ? handleSaveSettings : handleSaveTheme}>
                                        <FaSave />
                                        Save Changes
                                    </button>
                                    <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="edit-main-content">
                        {activeSection === 'theme' && renderThemeSection()}
                        {activeSection === 'role' && renderRoleSection()}
                        {activeSection === 'other' && renderOtherSection()}
                        {activeSection === 'seating' && renderSeatingSection()}
                    </div>
                </div>
            </main>
        </>
    );
};

export default EditClassroomPage;
