// src/component/CreateClassModal.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../CSS/Modal.css';
import '../CSS/Chair.css';
import Chair from './Chair';

const SeatingPreviewModal = ({ rows, cols, onClose, onSavePositions, initialSavedPositions }) => {
    const [currentChairPositions, setCurrentChairPositions] = useState({});
    const containerRef = useRef(null);

    const initializeGridSeating = useCallback((containerWidth) => {
        const initialPositions = {};
        if (!containerWidth || cols === 0 || rows === 0) return initialPositions;
        
        // กำหนดขนาดเก้าอี้และระยะห่างให้เหมาะสม
        const chairSize = 60; 
        const padding = 20;
        const margin = 10;

        // คำนวณความกว้างและสูงของพื้นที่ทั้งหมด
        const totalWidth = Math.max(containerWidth, cols * (chairSize + padding) + margin);
        const totalHeight = rows * (chairSize + padding) + margin;

        // คำนวณตำแหน่งเริ่มต้นเพื่อให้เก้าอี้อยู่ตรงกลาง
        const startX = (totalWidth - (cols * (chairSize + padding))) / 2;
        const startY = margin;

        let seatIndex = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                initialPositions[`seat-${seatIndex}`] = { 
                    x: startX + (c * (chairSize + padding)), 
                    y: startY + (r * (chairSize + padding)) 
                };
                seatIndex++;
            }
        }
        return initialPositions;
    }, [rows, cols]);

    useEffect(() => {
        if (Object.keys(initialSavedPositions).length > 0) {
            setCurrentChairPositions(initialSavedPositions);
        } else {
            // ใช้ setTimeout เพื่อให้แน่ใจว่า DOM ถูก render แล้วและสามารถวัดขนาด container ได้
            const timer = setTimeout(() => {
                if (containerRef.current) {
                    const containerWidth = containerRef.current.clientWidth;
                    if (containerWidth) {
                        setCurrentChairPositions(initializeGridSeating(containerWidth));
                    }
                }
            }, 0); 
            return () => clearTimeout(timer);
        }
    }, [initialSavedPositions, initializeGridSeating]);

    // เพิ่ม useEffect เพื่อปรับขนาดเมื่อขนาดของหน้าต่างเปลี่ยนไป
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                if (containerWidth) {
                    setCurrentChairPositions(initializeGridSeating(containerWidth));
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [initializeGridSeating]);


    const handleChairMove = useCallback((id, newX, newY) => {
        setCurrentChairPositions(prevPositions => ({
            ...prevPositions,
            [id]: { x: newX, y: newY }
        }));
    }, []);

    const handleSaveClick = () => {
        onSavePositions(currentChairPositions);
        onClose();
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content preview-modal">
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <h2>Seating Arrangement Preview</h2>
                <div className="seating-area">
                    <div ref={containerRef} className="seating-grid" style={{
                        width: '100%',
                        minWidth: '800px',
                        height: '600px',
                        position: 'relative',
                        backgroundColor: '#f9f9f9',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                    }}>
                        {Object.entries(currentChairPositions).map(([id, pos]) => (
                            <Chair
                                key={id}
                                id={id}
                                initialPosition={pos}
                                onChairMove={handleChairMove}
                                isDraggable={true}
                                containerRef={containerRef}
                            />
                        ))}
                    </div>
                </div>
                <button className="modal-action-button" onClick={handleSaveClick}>
                    Save Seating Arrangement
                </button>
            </div>
        </div>
    );
};

const CreateClassModal = ({ onClose, onClassCreated, user }) => {
    const [name, setName] = useState('');
    const [subname, setSubname] = useState('');
    const [color, setColor] = useState('#4CAF50');
    const [rows, setRows] = useState(0);
    const [cols, setCols] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [savedSeatingPositions, setSavedSeatingPositions] = useState({});

    // ฟังก์ชันนี้จะถูกใช้เป็นค่าเริ่มต้นสำหรับสร้างคลาส
    const initializeGridSeating = useCallback(() => {
        const initialPositions = {};
        if (rows === 0 || cols === 0) return initialPositions;
        
        const chairSize = 60;
        const padding = 20;
        const margin = 10;
        
        // คำนวณขนาดพื้นที่ทั้งหมด
        const totalWidth = cols * (chairSize + padding) + margin;
        const totalHeight = rows * (chairSize + padding) + margin;
        
        // คำนวณตำแหน่งเริ่มต้นเพื่อให้เก้าอี้อยู่ตรงกลาง
        const startX = margin;
        const startY = margin;
        
        let seatIndex = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                initialPositions[`seat-${seatIndex}`] = { 
                    x: startX + (c * (chairSize + padding)), 
                    y: startY + (r * (chairSize + padding)) 
                };
                seatIndex++;
            }
        }
        return initialPositions;
    }, [rows, cols]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user || !user.token) {
            console.error("User or token is not available. Cannot create class.");
            alert("Please log in to create a class.");
            return;
        }

        if (rows < 0 || rows > 10 || cols < 0 || cols > 10) {
            alert("Rows and columns must be between 0 and 10.");
            return;
        }

        let finalSeatingPositions = savedSeatingPositions;
        // หากไม่มีการบันทึกตำแหน่งจากหน้า preview ให้สร้างตำแหน่งเริ่มต้น
        if (Object.keys(finalSeatingPositions).length === 0 && rows > 0 && cols > 0) {
            finalSeatingPositions = initializeGridSeating();
        }

        try {
            const response = await fetch('http://localhost:5000/api/classrooms/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': user.token,
                },
                body: JSON.stringify({
                    name,
                    subname,
                    color,
                    imageUrl: 'https://via.placeholder.com/50',
                    rows,
                    cols,
                    seatingPositions: finalSeatingPositions
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Failed to create class');
            }

            const data = await response.json();
            console.log('Class created:', data.class);

            onClassCreated();
        } catch (error) {
            alert(error.message);
        }
    };

    const handlePreviewClick = (e) => {
        e.preventDefault();
        if (rows > 0 && cols > 0 && rows <= 10 && cols <= 10) {
            setShowPreview(true);
        } else {
            alert("Please enter valid numbers for rows and columns (1-10) to preview.");
        }
    };

    const handleSaveSeatingPositions = (positions) => {
        setSavedSeatingPositions(positions);
        console.log("Saved seating positions:", positions);
    };

    return (
        <>
            <div className="modal-backdrop">
                <div className="modal-content">
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                    <h2>Create New Class</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Class Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <input
                                type="text"
                                value={subname}
                                onChange={(e) => setSubname(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Class Color</label>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                            />
                        </div>
                        <div className="form-group-inline">
                            <div className="form-group">
                                <label>Rows (1-10)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={rows}
                                    onChange={(e) => setRows(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Columns (1-10)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={cols}
                                    onChange={(e) => setCols(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <button type="button" className="modal-preview-button" onClick={handlePreviewClick}>
                                Preview Seating
                            </button>
                        </div>
                        <button type="submit" className="modal-action-button">Create Class</button>
                    </form>
                </div>
            </div>
            {showPreview && (
                <SeatingPreviewModal
                    rows={rows}
                    cols={cols}
                    onClose={() => setShowPreview(false)}
                    onSavePositions={handleSaveSeatingPositions}
                    initialSavedPositions={savedSeatingPositions}
                />
            )}
        </>
    );
};

export default CreateClassModal;