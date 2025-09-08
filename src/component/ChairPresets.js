// src/component/ChairPresets.js
import { ContainerUtils } from '../utils/ContainerUtils';
import { ChairValidation } from '../utils/ChairValidation';

export const ChairPresets = {
    // คำนวณตำแหน่งเก้าอี้แบบแถว (Rows)
    calculateRowLayout: (chairCount, containerWidth = 1200, containerHeight = 800) => {
        const positions = {};
        const chairSize = 60;
        const margin = 60;
        const minSpacing = 100;
        
        // คำนวณจำนวนเก้าอี้ต่อแถวที่เหมาะสม
        const maxChairsPerRow = Math.floor((containerWidth - 2 * margin) / minSpacing);
        let chairsPerRow = Math.min(maxChairsPerRow, Math.ceil(Math.sqrt(chairCount * 1.5)));
        chairsPerRow = Math.max(1, chairsPerRow);
        
        const totalRows = Math.ceil(chairCount / chairsPerRow);
        
        // คำนวณระยะห่างที่สมดุล
        const availableWidth = containerWidth - 2 * margin;
        const availableHeight = containerHeight - 2 * margin;
        
        const spacingX = chairsPerRow > 1 ? Math.min(availableWidth / (chairsPerRow - 1), minSpacing * 1.5) : 0;
        const spacingY = totalRows > 1 ? Math.min(availableHeight / (totalRows - 1), minSpacing * 1.2) : availableHeight / 2;
        
        for (let i = 0; i < chairCount; i++) {
            const row = Math.floor(i / chairsPerRow);
            const col = i % chairsPerRow;
            
            // ใช้พื้นที่เต็มความกว้าง - ชิดขอบซ้ายและขวา
            const x = chairsPerRow === 1 ? containerWidth / 2 : margin + col * spacingX;
            const y = totalRows === 1 ? containerHeight / 2 : margin + row * spacingY;
            
            positions[`chair-${i + 1}`] = { x, y };
        }
        
        return positions;
    },

    // คำนวณตำแหน่งเก้าอี้แบบกลุ่ม (Groups)
    calculateGroupLayout: (chairCount, containerWidth = 1200, containerHeight = 800) => {
        const positions = {};
        const chairSize = 60;
        const chairRadius = chairSize / 2;
        const margin = 100; // เพิ่ม margin เพื่อป้องกันการเลยขอบ
        
        // ปรับขนาดกลุ่มให้เหมาะสม
        let chairsPerGroup, groupRadius;
        
        if (chairCount <= 8) {
            chairsPerGroup = Math.min(4, chairCount);
            groupRadius = 50;
        } else if (chairCount <= 16) {
            chairsPerGroup = 4;
            groupRadius = 55;
        } else if (chairCount <= 24) {
            chairsPerGroup = 4;
            groupRadius = 60;
        } else {
            chairsPerGroup = Math.min(5, Math.max(4, Math.ceil(chairCount / Math.ceil(chairCount / 5))));
            groupRadius = 65;
        }
        
        const totalGroups = Math.ceil(chairCount / chairsPerGroup);
        
        // คำนวณจำนวนกลุ่มต่อแถว - ให้มีพื้นที่เพียงพอ
        const groupDiameter = groupRadius * 2 + chairSize; // เส้นผ่านศูนย์กลางของกลุ่ม + ขนาดเก้าอี้
        const minGroupSpacing = groupDiameter + 80; // ระยะห่างขั้นต่ำระหว่างกลุ่ม
        
        const availableWidth = containerWidth - 2 * margin - groupDiameter;
        const maxGroupsPerRow = Math.max(1, Math.floor(availableWidth / minGroupSpacing) + 1);
        let groupsPerRow = Math.min(maxGroupsPerRow, totalGroups);
        
        const totalGroupRows = Math.ceil(totalGroups / groupsPerRow);
        
        // คำนวณตำแหน่งกลุ่มให้อยู่ในขอบเขต
        const availableHeight = containerHeight - 2 * margin - groupDiameter;
        
        const groupSpacingX = groupsPerRow > 1 ? availableWidth / (groupsPerRow - 1) : 0;
        const groupSpacingY = totalGroupRows > 1 ? availableHeight / (totalGroupRows - 1) : availableHeight / 2;
        
        for (let i = 0; i < chairCount; i++) {
            const groupIndex = Math.floor(i / chairsPerGroup);
            const chairInGroup = i % chairsPerGroup;
            
            // ตำแหน่งกลุ่ม
            const groupRow = Math.floor(groupIndex / groupsPerRow);
            const groupCol = groupIndex % groupsPerRow;
            
            // จุดกึ่งกลางของกลุ่ม - ปรับให้อยู่ในขอบเขตที่ปลอดภัย
            const groupCenterX = groupsPerRow === 1 ? 
                containerWidth / 2 : 
                margin + groupDiameter/2 + groupCol * groupSpacingX;
            const groupCenterY = totalGroupRows === 1 ? 
                containerHeight / 2 : 
                margin + groupDiameter/2 + groupRow * groupSpacingY;
            
            // จัดเก้าอี้ในกลุ่มเป็นวงกลม
            let x, y;
            
            if (chairsPerGroup === 1) {
                // ถ้ามีเก้าอี้เพียงตัวเดียวในกลุ่ม ให้อยู่กึ่งกลาง
                x = groupCenterX;
                y = groupCenterY;
            } else if (chairsPerGroup === 2) {
                // ถ้ามี 2 ตัว ให้เรียงแนวนอน
                x = groupCenterX + (chairInGroup === 0 ? -groupRadius/2 : groupRadius/2);
                y = groupCenterY;
            } else if (chairsPerGroup === 3) {
                // 3 ตัว ให้เป็นสามเหลี่ยม
                const angles = [-Math.PI/2, Math.PI/6, 5*Math.PI/6]; // บน, ขวาล่าง, ซ้ายล่าง
                const angle = angles[chairInGroup];
                x = groupCenterX + Math.cos(angle) * groupRadius;
                y = groupCenterY + Math.sin(angle) * groupRadius;
            } else {
                // 4+ ตัว ให้เป็นวงกลม
                const angle = (chairInGroup * 2 * Math.PI) / chairsPerGroup - Math.PI/2; // เริ่มจากด้านบน
                x = groupCenterX + Math.cos(angle) * groupRadius;
                y = groupCenterY + Math.sin(angle) * groupRadius;
            }
            
            // ตรวจสอบและปรับตำแหน่งให้อยู่ในขอบเขต
            x = Math.max(chairRadius + 10, Math.min(x, containerWidth - chairRadius - 10));
            y = Math.max(chairRadius + 10, Math.min(y, containerHeight - chairRadius - 10));
            
            positions[`chair-${i + 1}`] = { x, y };
        }
        
        return positions;
    },

    // คำนวณตำแหน่งเก้าอี้แบบกระจาย (Scattered)
    calculateScatteredLayout: (chairCount, containerWidth = 1200, containerHeight = 800) => {
        const positions = {};
        const chairSize = 60;
        const margin = 40; // ลด margin ให้ชิดขอบ
        
        // ปรับระยะห่างให้ใช้พื้นที่เต็มที่
        const availableWidth = containerWidth - 2 * margin - chairSize;
        const availableHeight = containerHeight - 2 * margin - chairSize;
        const totalArea = availableWidth * availableHeight;
        const areaPerChair = totalArea / chairCount;
        
        // คำนวณระยะห่างขั้นต่ำจากพื้นที่ที่มี
        let minDistance = Math.max(80, Math.sqrt(areaPerChair) * 0.7);
        
        // สร้าง seed สำหรับ random ที่สม่ำเสมอ
        const seededRandom = (seed) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };
        
        const usedPositions = [];
        
        for (let i = 0; i < chairCount; i++) {
            let x, y;
            let attempts = 0;
            let validPosition = false;
            
            // พยายามหาตำแหน่งที่ไม่ชนกัน
            while (!validPosition && attempts < 150) {
                x = margin + seededRandom(i * 7 + attempts) * availableWidth;
                y = margin + seededRandom(i * 11 + attempts) * availableHeight;
                
                validPosition = true;
                
                // ตรวจสอบระยะห่างกับเก้าอี้อื่น
                for (const pos of usedPositions) {
                    const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                    if (distance < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
                
                attempts++;
            }
            
            // ถ้าหาตำแหน่งไม่ได้ ใช้ grid fallback
            if (!validPosition) {
                const gridSize = Math.ceil(Math.sqrt(chairCount));
                const cellWidth = availableWidth / gridSize;
                const cellHeight = availableHeight / gridSize;
                
                const row = Math.floor(i / gridSize);
                const col = i % gridSize;
                
                x = margin + col * cellWidth + cellWidth / 2;
                y = margin + row * cellHeight + cellHeight / 2;
            }
            
            positions[`chair-${i + 1}`] = { x, y };
            usedPositions.push({ x, y });
        }
        
        return positions;
    },

    // คำนวณตำแหน่งเก้าอี้แบบ Grid (เท่ากันทุกแถว)
    calculateGridLayout: (chairCount, containerWidth = 1200, containerHeight = 800) => {
        const positions = {};
        const chairSize = 60;
        const margin = 60;
        const minSpacing = 100;
        
        // คำนวณจำนวนคอลัมน์และแถวที่สมดุล
        const cols = Math.ceil(Math.sqrt(chairCount));
        const rows = Math.ceil(chairCount / cols);
        
        // ตรวจสอบว่าพื้นที่เพียงพอหรือไม่
        const requiredWidth = cols * minSpacing + 2 * margin;
        const requiredHeight = rows * minSpacing + 2 * margin;
        
        // ใช้ขนาดที่ใหญ่กว่าระหว่าง container หรือขนาดที่ต้องการ
        const effectiveWidth = Math.max(containerWidth, requiredWidth);
        const effectiveHeight = Math.max(containerHeight, requiredHeight);
        
        const availableWidth = effectiveWidth - 2 * margin;
        const availableHeight = effectiveHeight - 2 * margin;
        
        // คำนวณระยะห่างที่สมดุล
        const spacingX = cols > 1 ? Math.max(minSpacing, availableWidth / (cols - 1)) : 0;
        const spacingY = rows > 1 ? Math.max(minSpacing, availableHeight / (rows - 1)) : availableHeight / 2;
        
        for (let i = 0; i < chairCount; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            // ใช้พื้นที่เต็มความกว้าง - ชิดขอบซ้ายและขวา
            const x = cols === 1 ? effectiveWidth / 2 : margin + col * spacingX;
            const y = rows === 1 ? effectiveHeight / 2 : margin + row * spacingY;
            
            positions[`chair-${i + 1}`] = { x, y };
        }
        
        return positions;
    },

    // ฟังก์ชันหลักสำหรับสร้าง preset
    generatePreset: (type, chairCount, containerWidth = 1200, containerHeight = 800) => {
        // คำนวณขนาด container ที่เหมาะสมกับจำนวนเก้าอี้
        const optimalSize = ChairPresets.calculateOptimalContainerSize(chairCount, type);
        const finalWidth = Math.max(containerWidth, optimalSize.width);
        const finalHeight = Math.max(containerHeight, optimalSize.height);
        
        let positions;
        
        switch (type) {
            case 'rows':
                positions = ChairPresets.calculateRowLayout(chairCount, finalWidth, finalHeight);
                break;
            case 'groups':
                positions = ChairPresets.calculateGroupLayout(chairCount, finalWidth, finalHeight);
                break;
            case 'scattered':
                positions = ChairPresets.calculateScatteredLayout(chairCount, finalWidth, finalHeight);
                break;
            case 'grid':
                positions = ChairPresets.calculateGridLayout(chairCount, finalWidth, finalHeight);
                break;
            default:
                return {};
        }

        // ตรวจสอบและปรับตำแหน่งให้อยู่ในขอบเขตที่ถูกต้อง
        const containerBounds = { width: finalWidth, height: finalHeight };
        const validatedPositions = ChairValidation.resolveCollisions(positions, containerBounds);
        
        return validatedPositions;
    },

    // คำนวณขนาด container ที่เหมาะสมตามจำนวนเก้าอี้และประเภท layout
    calculateOptimalContainerSize: (chairCount, layoutType) => {
        const chairSize = 60;
        const minSpacing = 100;
        const margin = 60;
        
        let optimalWidth, optimalHeight;
        
        switch (layoutType) {
            case 'rows':
                // คำนวณขนาดสำหรับ rows layout
                const chairsPerRow = Math.ceil(Math.sqrt(chairCount * 1.5));
                const totalRows = Math.ceil(chairCount / chairsPerRow);
                optimalWidth = chairsPerRow * minSpacing + 2 * margin;
                optimalHeight = totalRows * (minSpacing + 40) + 2 * margin;
                break;
                
            case 'groups':
                // คำนวณขนาดสำหรับ groups layout
                const chairsPerGroup = Math.min(6, Math.max(4, Math.ceil(chairCount / 6)));
                const totalGroups = Math.ceil(chairCount / chairsPerGroup);
                const groupsPerRow = Math.ceil(Math.sqrt(totalGroups));
                const groupSpacing = 200;
                optimalWidth = groupsPerRow * groupSpacing + 2 * margin;
                optimalHeight = Math.ceil(totalGroups / groupsPerRow) * groupSpacing + 2 * margin;
                break;
                
            case 'grid':
                // คำนวณขนาดสำหรับ grid layout
                const cols = Math.ceil(Math.sqrt(chairCount));
                const rows = Math.ceil(chairCount / cols);
                optimalWidth = cols * minSpacing + 2 * margin;
                optimalHeight = rows * (minSpacing + 20) + 2 * margin;
                break;
                
            case 'scattered':
                // คำนวณขนาดสำหรับ scattered layout
                const areaPerChair = minSpacing * minSpacing * 1.5;
                const totalArea = chairCount * areaPerChair;
                const aspectRatio = 1.4; // กว้าง:สูง = 1.4:1
                optimalHeight = Math.sqrt(totalArea / aspectRatio) + 2 * margin;
                optimalWidth = optimalHeight * aspectRatio;
                break;
                
            default:
                optimalWidth = 1200;
                optimalHeight = 800;
        }
        
        return {
            width: Math.max(1200, Math.round(optimalWidth)),
            height: Math.max(800, Math.round(optimalHeight))
        };
    }
};

export default ChairPresets;
