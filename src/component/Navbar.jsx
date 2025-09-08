// src/component/Navbar.jsx

import React, { useState } from "react";
import "../CSS/Navbar.css";
import icon from "../image/icon.ico";
import userPlaceholderImage from "../image/nulluser.png";
import { FiPlus, FiLogOut, FiArrowLeft, FiShare2, FiEdit2, FiSave, FiX } from "react-icons/fi"; // ✨ เพิ่ม icon ใหม่
import { FaCog, FaCrown } from 'react-icons/fa'; // ✨ เพิ่ม FaCrown icon
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Navbar = ({
    isSidebarOpen, toggleSidebar, user, handleSignOut, onClassActionClick, classrooms,
    isClassroomPage, onShareClick, classroomMembers, isAccountSettingPage,
    onPromoteMember,
    onKickMember,
    onDemoteMember,
    isCreator, isEditing, onToggleEditMode, onSavePositions, onCancelEdit, userSeatId, onLeaveSeat, classroom,
    isEditClassroomPage, onBackClick, // เพิ่ม props สำหรับ EditClassroomPage
    editActiveSection, onEditSectionChange, // เพิ่ม props สำหรับ EditClassroomPage navigation
    accountActiveSection, onAccountSectionChange, // เพิ่ม props สำหรับ AccountSetting navigation
    onClassroomBackClick, // เพิ่ม props สำหรับ ClassroomPage back navigation
    isLoginPage = false // เพิ่ม props สำหรับ Login page
}) => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = userPlaceholderImage;
        console.warn("Navbar profile image failed to load, falling back to placeholder:", e.target.src);
    };

    const handleSignInClick = () => {
        navigate('/login');
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleAccountSettingClick = () => {
        navigate('/account-setting');
        setIsDropdownOpen(false);
    };

    const handleSignOutClick = async () => {
        await handleSignOut();
        setIsDropdownOpen(false);
        window.location.reload();
    };

    const handleClassroomClick = (classId) => {
        navigate(`/classroom/${classId}`);
        toggleSidebar();
    };

    const handleBackClick = () => {
        navigate(-1);
    };

    const listItemStyle = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        display: 'block'
    };

    const handleMemberMenu = (member) => {
        // ✨ แก้ไข: ตรวจสอบ isTargetCreator ให้รองรับทั้ง Object และ Array
        const creators = Array.isArray(classroomMembers.creator)
            ? classroomMembers.creator
            : [classroomMembers.creator].filter(Boolean);
        const isTargetCreator = creators.some(c => c && c._id === member._id);
 
        // ป้องกันไม่ให้ creator จัดการตัวเอง
        if (user.id === member._id) return;

        if (isTargetCreator) {
            // Menu for Co-Creators - เฉพาะ Original Creator เท่านั้นที่สามารถจัดการได้
            if (isOriginalCreator) {
                Swal.fire({
                    title: member.displayName,
                    showDenyButton: false,
                    showCancelButton: true,
                    confirmButtonText: 'Demote to Participant',
                    cancelButtonText: 'Cancel',
                    icon: 'info',
                    confirmButtonColor: '#e74c3c',
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await onDemoteMember(member._id, member.displayName);
                    }
                });
            } else {
                // ถ้าไม่ใช่ Original Creator ให้แสดงข้อมูลเท่านั้น
                Swal.fire({
                    title: member.displayName,
                    text: 'This is a Co-Creator. Only the Original Creator can manage this member.',
                    icon: 'info',
                    showConfirmButton: true,
                    confirmButtonText: 'OK'
                });
            }
        } else {
            // Menu for Participants
            Swal.fire({
                title: member.displayName,
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: 'Promote to Creator',
                denyButtonText: 'Kick from Classroom',
                cancelButtonText: 'Cancel',
                icon: 'info'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await onPromoteMember(member._id, member.displayName);
                } else if (result.isDenied && isCreator) { // Creator ทุกคนสามารถเตะได้
                    await onKickMember(member._id, member.displayName);
                }
            });
        }
    };

    // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็น "ผู้สร้างห้องคนแรก" หรือไม่
    const isOriginalCreator = classroomMembers?.creator && user && classroomMembers.creator[0]?._id === user.id;

    return (
        <>
            <nav className="navbar">
                <div className="navbar__logo">
                    <button className="navbar__burger" onClick={toggleSidebar}>
                        &#9776;
                    </button>
                    <img src={icon} alt="Logo" className="navbar__logo-image" />
                    <h1 style={{ color: "#414141ff" ,fontSize: "24px" }}>Chair</h1>
                </div>

                {/* ✨ ย้ายปุ่มมาไว้ตรงกลาง Navbar เพื่อให้แสดงผลถูกต้อง */}
                <div className="navbar-center">
                    {isClassroomPage && isCreator && (
                        isEditing ? (
                            <>
                                <button className="navbar-action-button save" onClick={onSavePositions} title="Save Seating">
                                    <FiSave size={20} />
                                    <span>Save</span>
                                </button>
                                <button className="navbar-action-button cancel" onClick={onCancelEdit} title="Cancel">
                                    <FiX size={20} />
                                    <span>Cancel</span>
                                </button>
                            </>
                        ) : (
                            <button className="navbar-action-button" onClick={onToggleEditMode} title="Edit Seating">
                                <FiEdit2 size={20} />
                                <span>Edit</span>
                            </button>
                        )
                    )}
                </div>

                <div className="navbar__profile" onClick={toggleDropdown}>
                    {user ? (
                        <img
                            src={user.photoURL ? `${API_BASE_URL}${user.photoURL}` : userPlaceholderImage}
                            alt="User Profile"
                            className="navbar-profile-image"
                            onError={handleImageError}
                        />
                    ) : !isLoginPage ? (
                        <button onClick={handleSignInClick} className="navbar__signin-button">
                            Sign In
                        </button>
                    ) : null}
                    {isDropdownOpen && user && (
                        <div className="dropdown-menu">
                            <div className="dropdown-user-info">
                                <img
                                    src={user.photoURL ? `${API_BASE_URL}${user.photoURL}` : userPlaceholderImage}
                                    alt="User Profile"
                                    className="dropdown-profile-image"
                                    onError={handleImageError}
                                />
                                <div className="user-details">
                                    <span className="user-name">{user.displayName}</span>
                                    <br />
                                    <span className="user-email">{user.email}</span>
                                </div>
                            </div>
                            <hr style={{ border: "none", height: "1px", backgroundColor: "#dadce0", margin: "8px 0" }} />
                            <div className="dropdown-list">
                                <span className="dropdown-item" onClick={handleAccountSettingClick}>
                                    Account Setting
                                </span>
                                <span className="dropdown-item" onClick={handleSignOutClick}>
                                    <FiLogOut />
                                    Sign Out
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
            <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
                <ul className="sidebar-list">
                    {/* ✨ เพิ่มโค้ดนี้: เพิ่มเงื่อนไขสำหรับหน้า Account Setting และ Edit Classroom */}
                    {isLoginPage ? (
                        <li className="sidebar-list-item" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                            Welcome to Chair
                        </li>
                    ) : isAccountSettingPage ? (
                        <>
                            <li className="sidebar-list-item sidebar-back-button" onClick={handleBackClick}>
                                <FiArrowLeft size={18} />
                                <span>Back</span>
                            </li>
                            <hr className="divider" style={{ margin: "8px 0" }} />
                            <li 
                                className={`sidebar-list-item ${accountActiveSection === 'account' ? 'active' : ''}`}
                                onClick={() => onAccountSectionChange && onAccountSectionChange('account')}
                            >
                                <span>Account Settings</span>
                            </li>
                            <li 
                                className={`sidebar-list-item ${accountActiveSection === 'security' ? 'active' : ''}`}
                                onClick={() => onAccountSectionChange && onAccountSectionChange('security')}
                            >
                                <span>Security</span>
                            </li>
                            <li 
                                className={`sidebar-list-item ${accountActiveSection === 'privacy' ? 'active' : ''}`}
                                onClick={() => onAccountSectionChange && onAccountSectionChange('privacy')}
                            >
                                <span>Privacy</span>
                            </li>
                            <li 
                                className={`sidebar-list-item ${accountActiveSection === 'notifications' ? 'active' : ''}`}
                                onClick={() => onAccountSectionChange && onAccountSectionChange('notifications')}
                            >
                                <span>Notifications</span>
                            </li>
                        </>
                    ) : isEditClassroomPage ? (
                        <>
                            <li className="sidebar-list-item sidebar-back-button" onClick={onBackClick}>
                                <FiArrowLeft size={18} />
                                <span>Back to Classroom</span>
                            </li>
                            <hr className="divider" style={{ margin: "8px 0" }} />
                            <li 
                                className={`sidebar-list-item ${editActiveSection === 'theme' ? 'active' : ''}`}
                                onClick={() => onEditSectionChange('theme')}
                            >
                                <span>Theme</span>
                            </li>
                            <li 
                                className={`sidebar-list-item ${editActiveSection === 'role' ? 'active' : ''}`}
                                onClick={() => onEditSectionChange('role')}
                            >
                                <span>Role</span>
                            </li>
                            <li 
                                className={`sidebar-list-item ${editActiveSection === 'other' ? 'active' : ''}`}
                                onClick={() => onEditSectionChange('other')}
                            >
                                <span>Other</span>
                            </li>
                        </>
                    ) : isClassroomPage ? (
                        <>
                            <li className="sidebar-list-item sidebar-back-button" onClick={onClassroomBackClick || handleBackClick}>
                                <FiArrowLeft size={18} />
                                <span>Back</span>
                            </li>
                            {/* ✨ การแก้ไข: เพิ่มการตรวจสอบ user ก่อนแสดงส่วนนี้เพื่อป้องกัน error */}
                            {user && (
                                <li className="sidebar-list-item sidebar-share-class" onClick={onShareClick}>
                                    <FiShare2 size={18} />
                                    <span>Share Class</span>
                                </li>
                            )}
                            
                            {/* ส่วนแสดงสมาชิก */}
                            {classroomMembers?.creator && (Array.isArray(classroomMembers.creator) ? classroomMembers.creator.length > 0 : classroomMembers.creator) && (
                                <>
                                    <hr className="divider" style={{ margin: "8px 0" }} />
                                    <h3 className="sidebar-section-title">
                                        Creator ({Array.isArray(classroomMembers.creator) ? classroomMembers.creator.length : 1})
                                    </h3>
                                    {/* ✨ แก้ไข: แสดงผล creator ให้รองรับทั้ง Object และ Array */}
                                    {(Array.isArray(classroomMembers.creator) ? classroomMembers.creator : [classroomMembers.creator]).map(c => (
                                        c && <li key={c._id} className="sidebar-list-item sidebar-member-item" onClick={() => isCreator && handleMemberMenu(c)}>
                                            <img
                                                src={c.photoURL ? `${API_BASE_URL}${c.photoURL}` : userPlaceholderImage}
                                                alt={c.displayName}
                                                onError={handleImageError}
                                                className="sidebar-profile-image"
                                            />
                                            <span style={listItemStyle}>
                                                {c.displayName}
                                                {/* ✨ เพิ่ม: แสดงไอคอนมงกุฎสำหรับผู้สร้างห้องคนแรก */}
                                                {classroomMembers.creator[0]?._id === c._id && <FaCrown style={{ marginLeft: '8px', color: '#f1c40f' }} title="Original Creator" />}
                                            </span>
                                            {/* ✨ แก้ไข: แสดงปุ่มเมนูเฉพาะสำหรับ Original Creator เท่านั้น */}
                                            {isOriginalCreator && user.id !== c._id && (
                                                <button
                                                    className="menu-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleMemberMenu(c); }}
                                                    title="Member options"
                                                >
                                                    <FaCog />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </>
                            )}
                            
                            {classroomMembers?.participants?.length > 0 && (
                                <>
                                    <hr className="divider" style={{ margin: "8px 0" }} />                                    
                                    {/* ✨ แก้ไข: การนับจำนวน Participants ให้ถูกต้อง */}
                                    {(() => {
                                        const creatorIds = Array.isArray(classroomMembers.creator)
                                            ? classroomMembers.creator.map(c => c._id)
                                            : [classroomMembers.creator?._id].filter(Boolean);
                                        const participantsOnly = classroomMembers.participants.filter(p => !creatorIds.includes(p._id));
                                        return (
                                            <>
                                                <h3 className="sidebar-section-title">Participants ({participantsOnly.length})</h3>
                                    {classroomMembers.participants
                                        .filter(p => !creatorIds.includes(p._id))
                                        .map(participant => (
                                        <li key={participant._id} className="sidebar-list-item sidebar-member-item" onClick={() => isCreator && handleMemberMenu(participant)}>
                                            <img
                                                src={participant.photoURL ? `${API_BASE_URL}${participant.photoURL}` : userPlaceholderImage}
                                                alt={participant.displayName}
                                                onError={handleImageError}
                                                className="sidebar-profile-image"
                                            />
                                            <span style={listItemStyle}>{participant.displayName}</span>
                                            {/* ✨ แก้ไข: ตรวจสอบ user.id ก่อนแสดงปุ่ม */}
                                            {isCreator && user.id !== participant._id && (
                                                <button
                                                    className="menu-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleMemberMenu(participant); }}
                                                    title="Member options"
                                                >
                                                    <FaCog />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                            </>
                                        );
                                    })()}
                                </>
                            )}
                            {isClassroomPage && userSeatId && (
                                <button
                                    className="leave-seat-btn"
                                    style={{
                                        width: '90%',
                                        margin: '20px auto 10px auto',
                                        display: 'block',
                                        background: '#f44336',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '10px 0',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                    onClick={onLeaveSeat}
                                >
                                    Leave Seat
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            {/* ✨ การแก้ไข: เพิ่มการตรวจสอบ user ก่อนแสดงส่วนนี้เพื่อป้องกัน error */}
                            {user && (
                                <li className="sidebar-list-item sidebar-create-class" onClick={onClassActionClick}>
                                    <FiPlus size={18} />
                                    <span>Class</span>
                                </li>
                            )}
                            <hr style={{ border: "none", height: "1px", backgroundColor: "#dadce0", margin: "8px 0" }} />
                            {classrooms.length > 0 ? (
                                classrooms.map((room) => (
                                    <li
                                        key={room._id}
                                        className="sidebar-list-item sidebar-classroom-item"
                                        onClick={() => handleClassroomClick(room._id)}
                                    >
                                        <img
                                            src={
                                                room.creator && room.creator[0]?.photoURL ? `${API_BASE_URL}${room.creator[0].photoURL}` : userPlaceholderImage
                                            }
                                            alt="Creator Profile"
                                            className="sidebar-profile-image"
                                        />
                                        <span className="sidebar-classroom-name">{room.name}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="sidebar-no-class-text">
                                    No classes joined.
                                </li>
                            )}
                        </>
                    )}
                </ul>
            </aside>
        </>
    );
};

export default Navbar;
