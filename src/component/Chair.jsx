// src/component/Chair.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../CSS/Chair.css';

const Chair = ({ id, initialPosition, onChairMove, containerRef, isDraggable, userPhotoURL, userName, onChairClick }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(initialPosition);
    const offset = useRef({ x: 0, y: 0 });
    const chairRef = useRef(null);

    useEffect(() => {
        setPosition(initialPosition);
    }, [initialPosition]);

    const handleMouseDown = useCallback((e) => {
        if (!isDraggable || !chairRef.current) return;
        setIsDragging(true);
        const chairRect = chairRef.current.getBoundingClientRect();
        offset.current = {
            x: e.clientX - chairRect.left,
            y: e.clientY - chairRect.top
        };
    }, [isDraggable]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !containerRef.current || !chairRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const chairRect = chairRef.current.getBoundingClientRect();

        let newX = e.clientX - containerRect.left - offset.current.x;
        let newY = e.clientY - containerRect.top - offset.current.y;

        newX = Math.max(0, Math.min(newX, containerRect.width - chairRect.width));
        newY = Math.max(0, Math.min(newY, containerRect.height - chairRect.height));

        setPosition({ x: newX, y: newY });
    }, [isDragging, containerRef]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            onChairMove(id, position.x, position.y);
        }
    }, [isDragging, onChairMove, id, position]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const handleClick = useCallback(() => {
        // เพิ่มเงื่อนไขให้ Chair สามารถถูกคลิกได้เมื่อไม่ได้อยู่ในโหมดลาก
        if (onChairClick && !isDraggable) {
            onChairClick(id);
        }
    }, [id, isDraggable, onChairClick]);

    return (
        <div
            ref={chairRef}
            className="chair-item"
            style={{
                left: position.x + 'px',
                top: position.y + 'px',
                zIndex: isDragging ? 1000 : 1
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            <div className="chair-icon" style={{ backgroundImage: userPhotoURL ? `url(${userPhotoURL})` : 'none' }}>
                {!userPhotoURL && <div className="chair-icon-placeholder"></div>}
            </div>
            <div className="user-name-under">
                {userName || ''}
            </div>
        </div>
    );
};

export default Chair;