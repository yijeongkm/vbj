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
        // 이미지 경로를 URL 형식으로 반환
        const imagePaths = imageFiles.map(file => `/assets/images/${file}`);
        res.status(200).json(imagePaths);
    });
}
