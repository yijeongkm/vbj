import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const imagesDir = path.join(process.cwd(), 'public/assets/images');
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        // 이미지 파일만 필터링
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/.test(file));
        // 랜덤으로 하나의 이미지를 선택
        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
        // 선택된 이미지의 경로 반환
        const imagePath = `/assets/images/${randomImage}`;
        res.status(200).json({ imageUrl: imagePath });
    });
}
