// src/App.js

import Loader from './component/Loader';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './firebaseConfig';
import axios from 'axios';

const AccountSetting = lazy(() => import('./pages/AccountSetting'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
// Import the new ClassroomPage component
const ClassroomPage = lazy(() => import('./pages/ClassroomPage')); // ✨ Add this line
const EditClassroomPage = lazy(() => import('./pages/EditClassroomPage')); // ✨ Add Edit Classroom Page
const Layout = lazy(() => import('./component/Layout')); // ✨ Add Layout component

const backendUrl = 'http://localhost:5000/api/auth';

function App() {
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    const handleSignOut = async () => {
        try {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('userPhotoURL');
            if (auth.currentUser) {
                await signOut(auth);
            }
            setUser(null);
        } catch (error) {
            console.error("ข้อผิดพลาดในการออกจากระบบ:", error);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const updateUserProfile = (updatedData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...updatedData
        }));
        const storedAuthToken = localStorage.getItem('authToken');
        if (storedAuthToken) {
            localStorage.setItem('userProfile', JSON.stringify({
                ...JSON.parse(localStorage.getItem('userProfile')),
                ...updatedData
            }));
            // Also update photoURL separately if it's being updated
            if (updatedData.photoURL) {
                localStorage.setItem('userPhotoURL', updatedData.photoURL);
            }
        }
    };

    useEffect(() => {
        const storedAuthToken = localStorage.getItem('authToken');
        const storedUserProfile = localStorage.getItem('userProfile');
        const storedPhotoURL = localStorage.getItem('userPhotoURL');

        if (storedAuthToken && storedUserProfile) {
            try {
                const parsedUser = JSON.parse(storedUserProfile);
                // Merge photoURL from separate storage if available
                if (storedPhotoURL) {
                    parsedUser.photoURL = storedPhotoURL;
                }
                setUser({ ...parsedUser, token: storedAuthToken });
            } catch (e) {
                console.error("Failed to parse user profile from localStorage", e);
                localStorage.removeItem('authToken');
                localStorage.removeItem('userProfile');
                localStorage.removeItem('userPhotoURL');
                setUser(null);
            } finally {
                // ตั้งค่า loading เป็น false เมื่อโหลดข้อมูลจาก localStorage เสร็จสิ้น
                setAuthLoading(false);
            }
        } else {
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (firebaseUser) {
                    try {
                        const idToken = await firebaseUser.getIdToken();
                        const response = await axios.get(`${backendUrl}/me`, {
                            headers: { 'x-auth-token': idToken }
                        });
                        localStorage.setItem('authToken', idToken);
                        localStorage.setItem('userProfile', JSON.stringify(response.data));
                        setUser({ ...response.data, token: idToken });
                    } catch (error) {
                        console.error("Error fetching user data after auth state change:", error);
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userProfile');
                        setUser(null);
                    }
                } else {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userProfile');
                    setUser(null);
                }
                setAuthLoading(false);
            });
            // คืนค่าฟังก์ชัน unsubscribe เพื่อ clean up เมื่อ component ถูก unmount
            return () => unsubscribe();
        }
    }, []);

    useEffect(() => {
        const savedSidebarState = localStorage.getItem('isSidebarOpen');
        if (savedSidebarState !== null) {
            setIsSidebarOpen(savedSidebarState === 'true');
        }
    }, []);

    if (authLoading) {
        return <Loader />;
    }

    return (
        <Router>
            <AppRoutes
                user={user}
                onLoginSuccess={handleLoginSuccess}
                handleSignOut={handleSignOut}
                updateUserProfile={updateUserProfile}
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
            />
        </Router>
    );
}

// สร้าง component ใหม่สำหรับ Routes เพื่อใช้ useNavigate hook
function AppRoutes({ user, onLoginSuccess, handleSignOut, updateUserProfile, isSidebarOpen, toggleSidebar }) {
    const navigate = useNavigate();

    // ฟังก์ชันใหม่ที่รวมการออกจากระบบและการนำทาง
    const handleSignOutAndNavigate = async () => {
        await handleSignOut();
        navigate('/login');
    };

    return (
        <Suspense fallback={<Loader />}>
            <Routes>
                <Route
                    path="/login"
                    element={user ? <Navigate to="/" /> : 
                        <Layout user={null} handleSignOut={handleSignOut} classrooms={[]} isLoginPage={true}>
                            <LoginPage onLoginSuccess={onLoginSuccess} />
                        </Layout>
                    }
                />
                <Route
                    path="/"
                    element={user ? <DashboardPage
                        user={user}
                        updateUserProfile={updateUserProfile}
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={toggleSidebar}
                        handleSignOut={handleSignOutAndNavigate} // ส่งฟังก์ชันใหม่ไปที่ DashboardPage
                    /> : <Navigate to="/login" />}
                />
                <Route
                    path="/account-setting"
                    element={user ? <AccountSetting
                        user={user}
                        updateUserProfile={updateUserProfile}
                        onSignOut={handleSignOutAndNavigate} // ส่งฟังก์ชันใหม่
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={toggleSidebar}
                    /> : <Navigate to="/login" />}
                />
                {/* Add a new route for the classroom details page */}
                <Route
                    path="/classroom/:classId"
                    element={user ? <ClassroomPage
                        user={user}
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={toggleSidebar}
                        handleSignOut={handleSignOutAndNavigate}
                    /> : <Navigate to="/login" />}
                /> {/* ✨ Add this new route */}
                {/* Add a new route for the edit classroom page */}
                <Route
                    path="/classroom/:classId/edit"
                    element={user ? <EditClassroomPage
                        user={user}
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={toggleSidebar}
                        handleSignOut={handleSignOutAndNavigate}
                    /> : <Navigate to="/login" />}
                /> {/* ✨ Add Edit Classroom route */}
                <Route path="*" element={<p style={{ textAlign: 'center', fontSize: '2em', marginTop: '100px' }}>404 Page Not Found</p>} />
            </Routes>
        </Suspense>
    );
}

export default App;