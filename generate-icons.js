const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#10B981');
    grad.addColorStop(1, '#059669');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.15);
    ctx.fill();
    
    // Piggy bank icon
    ctx.fillStyle = 'white';
    ctx.font = `${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐷', size/2, size/2 + size * 0.05);
    
    // Save
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join(__dirname, 'wwwroot', 'icons', `icon-${size}x${size}.png`);
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ Generated ${size}x${size}`);
}

// Create directory if not exists
const dir = path.join(__dirname, 'wwwroot', 'icons');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

sizes.forEach(generateIcon);
console.log('🎉 All icons generated!');