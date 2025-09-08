// src/component/Main.jsx

import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'; // ✨ Add this import
import "../CSS/Main.css";
import userPlaceholderImage from "../image/nulluser.png"
import { FiShare2 } from "react-icons/fi";
import { FaThumbtack } from "react-icons/fa";
import Swal from 'sweetalert2';

const API_BASE_URL = 'http://localhost:5000';

const Main = ({ isSidebarOpen, classrooms, user, onPinClass, setShowMenu, showMenu, handleLeaveClassroom }) => {
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const navigate = useNavigate(); // ✨ Add this line

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = userPlaceholderImage;
    };

    const toggleDropdown = (id, e) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const handleShareClick = (classCode, e) => {
        e.stopPropagation();
        setOpenDropdownId(null);
        
        Swal.fire({
            title: 'Class Code',
            html: `
                <div style="background-color: #eaf6ea; border: 1px solid #d4ecd4; border-radius: 4px; padding: 12px 15px; font-size: 24px; font-weight: bold; color: #388e3c; word-break: break-all; margin: 15px 0;">
                    ${classCode}
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'Copy Code',
            cancelButtonText: 'Close',
            customClass: {
                confirmButton: 'swal2-confirm',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                navigator.clipboard.writeText(classCode);
                Swal.fire('Copied!', 'Class code has been copied to clipboard.', 'success');
            }
        });
    };

    const handleCardClick = (classId) => {
        navigate(`/classroom/${classId}`);
    }; // ✨ Add this new function

    const renderClassroomCards = (classes) => (
        <div className="classroom-grid">
            {classes.map((room) => {
                const isPinned = user.pinnedClasses?.includes(room._id);
                return (
                    <div
                        key={room._id}
                        className={`classroom-card ${openDropdownId === room._id ? 'active-dropdown' : ''}`}
                        style={{ borderLeftColor: room.color }}
                        onClick={() => handleCardClick(room._id)} // ✨ Add this onClick handler
                    >
                        <div className="classroom-options-wrapper">
                            <div className="classroom-options-icon" onClick={(e) => toggleDropdown(room._id, e)}>
                                &#x22EE;
                            </div>
                            {openDropdownId === room._id && (
                                <div className="dropdown-menu" onClick={e => e.stopPropagation()}>
                                    <div className="dropdown-item" onClick={() => onPinClass(room._id)}>
                                        <FaThumbtack size={16} />
                                        <span>{isPinned ? 'Unpin class' : 'Pin class'}</span>
                                    </div>
                                    <div className="dropdown-item" onClick={(e) => handleShareClick(room.classCode, e)}>
                                        <FiShare2 size={16} />
                                        <span>Share Class Code</span>
                                    </div>
                                    <div
                                      className="dropdown-item"
                                      style={{ color: 'red' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLeaveClassroom(room._id);
                                        setOpenDropdownId(null);
                                      }}
                                    >
                                      <span>Exit & Remove</span>
                                    </div>
                                  </div>
                            )}
                        </div>

                        <div className="classroom-text-content">
                            <h2>{room.name}</h2>
                            <h3 className="classroom-subname">{room.subname}</h3>
                        </div>
                        <div className="classroom-image-container">
                            <img
                                src={
                                    room.creator && room.creator[0]?.photoURL ? `${API_BASE_URL}${room.creator[0].photoURL}` : userPlaceholderImage
                                }
                                alt={`${room.name} owner profile`}
                                className="classroom-image"
                                onError={handleImageError}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const pinnedClasses = classrooms.filter(room => user.pinnedClasses?.includes(room._id));
    const createdClasses = classrooms.filter(room => user.createdClasses?.includes(room._id) && !user.pinnedClasses?.includes(room._id));
    const joinedClasses = classrooms.filter(room => user.enrolledClasses?.includes(room._id) && !user.createdClasses?.includes(room._id) && !user.pinnedClasses?.includes(room._id));

    return (
        <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
            <div className="main-content-scrollable-area">
                {pinnedClasses.length > 0 && (
                    <>
                        <h2 className="section-title">Pinned Classrooms</h2>
                        {renderClassroomCards(pinnedClasses)}
                        <hr className="divider" />
                    </>
                )}
                {createdClasses.length > 0 && (
                    <>
                        <h2 className="section-title">Created by You</h2>
                        {renderClassroomCards(createdClasses)}
                        <hr className="divider" />
                    </>
                )}
                {joinedClasses.length > 0 && (
                    <>
                        <h2 className="section-title">Joined Classrooms</h2>
                        {renderClassroomCards(joinedClasses)}
                    </>
                )}
            </div>
        </main>
    );
};

export default Main;