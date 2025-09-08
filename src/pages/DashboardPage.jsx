// src/pages/DashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from '../component/Navbar';
import Main from '../component/Main';
import ClassActionModal from '../component/ClassActionModal';

const API_BASE_URL = 'http://localhost:5000';

const DashboardPage = ({ user, updateUserProfile, isSidebarOpen, toggleSidebar, handleSignOut }) => {
    const [classrooms, setClassrooms] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showMenu, setShowMenu] = useState(null);

    const fetchClassrooms = async (token) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/classrooms`, {
                headers: {
                    'x-auth-token': token,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching classrooms:", error);
            return [];
        }
    };

    const fetchUserProfile = async (token) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'x-auth-token': token,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    };

    const updateAllData = useCallback(async () => {
        if (user && user.token) {
            const [classroomsData, userProfileData] = await Promise.all([
                fetchClassrooms(user.token),
                fetchUserProfile(user.token),
            ]);
            setClassrooms(classroomsData);
            if (userProfileData) {
                updateUserProfile(userProfileData);
            }
        }
    }, [user, updateUserProfile]);

    useEffect(() => {
        updateAllData();
    }, [updateAllData]);

    const handlePinClass = async (classId) => {
        try {
            // โค้ดที่แก้ไข: ใช้ endpoint ที่ถูกต้องและไม่ต้องส่ง isPinned
            await axios.post(`${API_BASE_URL}/api/classrooms/${classId}/toggle-pin`, null, {
                headers: {
                    'x-auth-token': user.token,
                },
            });
            // อัปเดตข้อมูลใหม่หลังจากเปลี่ยนสถานะ pin
            updateAllData();
        } catch (error) {
            console.error("Error pinning/unpinning class:", error);
        }
    };

    const handleLeaveClassroom = async (classId) => {
        if (!window.confirm('คุณต้องการออกจากห้องนี้ใช่หรือไม่?')) return;
        try {
            await axios.post(
                `${API_BASE_URL}/api/classrooms/${classId}/leave`,
                {},
                { headers: { 'x-auth-token': user.token } }
            );
            fetchClassrooms(); // รีเฟรชรายชื่อห้อง
        } catch (e) {
            alert('ออกจากห้องไม่สำเร็จ');
        }
    };

    const handleClassActionClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const onClassCreated = async () => {
        await updateAllData();
        handleCloseModal();
    };

    const onClassJoined = async () => {
        await updateAllData();
        handleCloseModal();
    };

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                onClassActionClick={handleClassActionClick}
                classrooms={classrooms}
                // ส่ง handleSignOut ที่ได้รับจาก App.jsx ไปให้ Navbar
                handleSignOut={handleSignOut}
            />
            <Main
                isSidebarOpen={isSidebarOpen}
                classrooms={classrooms}
                user={user}
                updateUserProfile={updateUserProfile}
                onPinClass={handlePinClass}
                setShowMenu={setShowMenu}
                showMenu={showMenu}
                handleLeaveClassroom={handleLeaveClassroom} // ส่งผ่านฟังก์ชันนี้ไปยัง Main
            />
            {isModalOpen && (
                <ClassActionModal
                    onClose={handleCloseModal}
                    onClassCreated={onClassCreated}
                    onClassJoined={onClassJoined}
                    user={user}
                />
            )}
        </>
    );
};
export default DashboardPage;