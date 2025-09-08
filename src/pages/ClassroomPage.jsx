// src/pages/ClassroomPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '../component/Navbar';
import '../CSS/ClassroomPage.css';
import '../CSS/Navbar.css';
import '../CSS/Main.css';
import userPlaceholderImage from '../image/nulluser.png';
import Chair from '../component/Chair';
import ChairAssignModal from '../component/ChairAssignModal';
import ChairPresets from '../component/ChairPresets';
import { FaEdit, FaTh, FaRandom, FaBars, FaThLarge, FaChevronUp, FaChevronDown } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ClassroomPage = ({ user, isSidebarOpen, toggleSidebar, handleSignOut }) => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [classroom, setClassroom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [seatingPositions, setSeatingPositions] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [currentChairPositions, setCurrentChairPositions] = useState({});
    const [assignedUsers, setAssignedUsers] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedChairId, setSelectedChairId] = useState(null);
    const [isBannerCollapsed, setIsBannerCollapsed] = useState(false);
    const containerRef = useRef(null);

    
    const handleShareClick = () => {
        if (!classroom) return;
        Swal.fire({
            title: 'Class Code',
            html: `
                <div style="background-color: #eaf6ea; border: 1px solid #d4ecd4; border-radius: 4px; padding: 12px 15px; text-align: center;">
                    <p style="font-size: 1.2em; font-weight: bold; margin: 0;">${classroom.classCode}</p>
                </div>
                <p style="margin-top: 15px; font-size: 0.9em; color: #555;">Give this code to your students so they can join this class.</p>
            `,
            showCancelButton: false,
            showConfirmButton: true,
            confirmButtonText: 'Copy Code',
            preConfirm: () => {
                navigator.clipboard.writeText(classroom.classCode);
                Swal.showValidationMessage('Copied!');
            }
        });
    };

    const handleChairMove = useCallback((id, newX, newY) => {
        setCurrentChairPositions(prevPositions => ({
            ...prevPositions,
            [id]: { x: newX, y: newY }
        }));
    }, []);

    const handleChairClick = (chairId) => {
        if (isEditing || isCreator) return;

        const currentSeatId = Object.keys(assignedUsers).find(
            key => assignedUsers[key]?.userId === user.id
        );
        const chairUser = assignedUsers[chairId];

        // ถ้า user ไม่ได้นั่งที่ไหน และเก้าอี้นี้มีคน -> แจ้งเตือน
        if (!currentSeatId && chairUser) {
            alert('This seat is already taken.');
            return;
        }
        // ถ้า user ไม่นั่งที่ไหน และเก้าอี้ว่าง -> เปิด modal
        if (!currentSeatId && !chairUser) {
            setSelectedChairId(chairId);
            setModalOpen(true);
            return;
        }
        // ถ้า user นั่งอยู่แล้ว
        if (currentSeatId) {
            // ถ้าคลิกเก้าอี้เดิม -> ไม่ต้องทำอะไร
            if (currentSeatId === chairId) return;
            // ถ้าคลิกเก้าอี้ใหม่ที่ว่าง -> ถามว่าย้ายไหม
            if (!chairUser) {
                if (window.confirm('Do you want to move to this seat?')) {
                    setSelectedChairId(chairId);
                    setModalOpen(true);
                }
                return;
            }
            // ถ้าคลิกเก้าอี้ใหม่ที่มีคน -> แจ้งเตือน
            if (chairUser) {
                alert('Cannot move to this seat, it is already taken.');
                return;
            }
        }
    };

    const fetchClassroomDetails = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/classrooms/${classId}`, {
                headers: { 'x-auth-token': user.token }
            });
            setClassroom(response.data);
            const fetchedPositions = response.data.seatingPositions || {};
            const fetchedAssignedUsers = response.data.assignedUsers || {};
            setSeatingPositions(fetchedPositions);
            setCurrentChairPositions(fetchedPositions);
            setAssignedUsers(fetchedAssignedUsers);
            setLoading(false);
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.requiresInvitation) {
                setError('This classroom is private and requires an invitation to access.');
            } else {
                setError('Failed to load classroom details.');
            }
            setLoading(false);
            console.error("Error fetching classroom details:", err);
        }
    }, [classId, user]);

    useEffect(() => {
        if (!user || !user.token || !classId) return;
        setLoading(true);
        fetchClassroomDetails();

        // ถ้าอยู่ในโหมดแก้ไข ไม่ต้องตั้ง interval สำหรับ polling
        if (isEditing) {
            return;
        }

        // Polling ทุก 2 วินาที
        const interval = setInterval(() => {
            fetchClassroomDetails();
        }, 2000);

        return () => clearInterval(interval);
    }, [classId, user, fetchClassroomDetails, isEditing]);

    const handleAssign = async (name) => {
        if (!selectedChairId || !user) return;
        // ลบที่เดิมถ้ามี
        const prevSeatId = Object.keys(assignedUsers).find(
            key => assignedUsers[key]?.userId === user.id
        );
        const newAssignedUsers = { ...assignedUsers };
        if (prevSeatId) delete newAssignedUsers[prevSeatId];
        // จองที่ใหม่
        newAssignedUsers[selectedChairId] = {
            userName: name,
            userId: user.id,
            photoURL: user.photoURL,
        };
        setAssignedUsers(newAssignedUsers);
        setModalOpen(false);

        try {
            await axios.put(
                `${API_BASE_URL}/api/classrooms/${classId}/seating`,
                {
                    seatingPositions,
                    assignedUsers: newAssignedUsers
                },
                { headers: { 'x-auth-token': user.token } }
            );
            fetchClassroomDetails();
        } catch (e) {
            alert('Save failed.');
        }
    };

    const handleSavePositions = async () => {
        try {
            await axios.put(`${API_BASE_URL}/api/classrooms/${classId}/seating`, {
                seatingPositions: currentChairPositions
            }, {
                headers: { 'x-auth-token': user.token }
            });
            setSeatingPositions(currentChairPositions);
            setIsEditing(false);
            Swal.fire('Saved!', 'Seating arrangement updated successfully.', 'success');
        } catch (error) {
            console.error('Failed to save seating positions:', error);
            Swal.fire('Error', 'Failed to save seating arrangement.', 'error');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setCurrentChairPositions(seatingPositions);
    };

    const handleToggleEditMode = () => {
        setIsEditing(prev => !prev);
    };

    const handleLeaveSeat = async () => {
        if (!user) return;
        const seatId = Object.keys(assignedUsers).find(
            key => assignedUsers[key]?.userId === user.id
        );
        if (!seatId) return;
        const newAssignedUsers = { ...assignedUsers };
        delete newAssignedUsers[seatId];
        setAssignedUsers(newAssignedUsers);

        try {
            await axios.put(
                `${API_BASE_URL}/api/classrooms/${classId}/seating`,
                {
                    seatingPositions,
                    assignedUsers: newAssignedUsers
                },
                { headers: { 'x-auth-token': user.token } }
            );
            fetchClassroomDetails();
        } catch (e) {
            alert('Failed to leave the seat.');
        }
    };

    const onPromoteMember = async (memberId, memberName) => {
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

    const onDemoteMember = async (memberId, memberName) => {
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

    const handleEditClassroom = () => {
        navigate(`/classroom/${classId}/edit`);
    };

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

    const calculateContainerSize = () => {
        const positions = isEditing ? currentChairPositions : seatingPositions;
        const chairList = Object.values(positions);
        
        // คำนวณขนาดขั้นต่ำให้เต็มจอเมื่อเปิด sidebar (ลด 10%)
        const sidebarWidth = isSidebarOpen ? 250 : 0;
        const minWidth = (window.innerWidth - sidebarWidth - 40) * 0.9; // ลด 10%
        const minHeight = (window.innerHeight - 200) * 0.9; // ลด 10%
        
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

    const renderSeatingChart = () => {
        if (!seatingPositions || Object.keys(seatingPositions).length === 0) {
            return <div className="no-seating-chart">No seating chart available.</div>;
        }

        const chairList = Object.entries(isEditing ? currentChairPositions : seatingPositions);
        const containerSize = calculateContainerSize();

        return (
            <div className="seating-container-wrapper" style={{
                width: '100%',
                overflowX: 'auto',
                overflowY: 'auto',
                maxHeight: '70vh'
            }}>
                <div className="seating-grid" ref={containerRef} style={{ 
                    position: 'relative', 
                    width: containerSize.width,
                    height: containerSize.height,
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9',
                    margin: '0 auto',
                    minWidth: '400px'
                }}>
                    {chairList.map(([id, pos]) => {
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
                                isDraggable={isEditing}
                                userPhotoURL={photoURL}
                                userName={userName}
                                onChairClick={handleChairClick}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!classroom) {
        return <div>Classroom not found.</div>;
    }

    const isCreator = user && classroom?.creator && (
        (Array.isArray(classroom.creator) ? classroom.creator.some(c => c._id === user.id) : classroom.creator._id === user.id)
    );
    const userSeatId = Object.keys(assignedUsers).find(
        key => assignedUsers[key]?.userId === user.id
    );

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                onClassActionClick={() => {}}
                classrooms={[]}
                handleSignOut={handleSignOut}
                isClassroomPage={true}
                onShareClick={handleShareClick}
                classroomMembers={{ creator: classroom.creator, participants: classroom.participants }}
                isCreator={isCreator}
                isEditing={isEditing}
                onToggleEditMode={handleToggleEditMode}
                onSavePositions={handleSavePositions}
                onCancelEdit={handleCancelEdit}
                userSeatId={userSeatId}
                onLeaveSeat={handleLeaveSeat}
                onPromoteMember={onPromoteMember}
                onDemoteMember={onDemoteMember}
                onKickMember={handleKickMember}
                classroom={classroom}
                onClassroomBackClick={() => navigate('/')}
            />
            <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
                <div 
                    className={`classroom-header ${isBannerCollapsed ? 'collapsed' : ''}`}
                    style={{ 
                        borderLeftColor: classroom.color,
                        backgroundImage: classroom.bannerUrl ? `url(${API_BASE_URL}${classroom.bannerUrl})` : 'none'
                    }}
                >
                    <div className="classroom-header-overlay"></div>
                    <div className="classroom-header-content">
                        <h1>{classroom.name}</h1>
                        <p>{classroom.subname}</p>
                    </div>
                    {isCreator && (
                        <div className="classroom-header-actions">
                            <button className="classroom-edit-btn" title="Edit Classroom Settings" onClick={handleEditClassroom} style={{ marginBottom: '-13px' }}>
                                <FaEdit size={20} />
                            </button>
                        </div>
                    )}
                    
                    {/* Banner toggle button */}
                    <button 
                        className="banner-collapse-btn" 
                        onClick={() => setIsBannerCollapsed(!isBannerCollapsed)}
                        title={isBannerCollapsed ? "Expand banner" : "Collapse banner"}
                    >
                        {isBannerCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                    </button>
                </div>
                <div className="classroom-layout-container">
                    <div className="seating-chart-section">
                        <div className="seating-header">
                            <h2 className="section-title">Seating Arrangement</h2>
                            {isEditing && isCreator && (
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
                            )}
                        </div>
                        {renderSeatingChart()}
                    </div>
                </div>
            </main>
            <ChairAssignModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleAssign}
                defaultName={user?.displayName}
            />
        </>
    );
};

export default ClassroomPage;