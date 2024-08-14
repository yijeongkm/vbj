import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const imagesDir = path.join(process.cwd(), 'public/assets/images');
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to scan directory' });
        }
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/.test(file));
        
        if (imageFiles.length < 2) {
            return res.status(500).json({ error: 'Not enough images to display' });
        }
        
        // 이미지를 랜덤으로 섞어 두 개를 선택합니다.
        const shuffledImages = imageFiles.sort(() => 0.5 - Math.random()).slice(0, 2);
        res.status(200).json(shuffledImages);
    });
}
