import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    // 'public/assets/images/' 폴더 경로
    const imagesDirectory = path.join(process.cwd(), 'public/assets/images');

    try {
        // 'images' 폴더 내 모든 파일명 불러오기
        const imageFiles = fs.readdirSync(imagesDirectory);

        // 이미지 파일이 없으면 에러 반환
        if (imageFiles.length === 0) {
            return res.status(404).json({ error: 'No images found' });
        }

        // 랜덤으로 하나의 이미지를 선택
        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];

        // 선택된 이미지의 URL 반환
        const imageUrl = `https://decline-perception-yijeongkms-projects.vercel.app/assets/images/${randomImage}`;
        res.status(200).json({ imageUrl });
    } catch (err) {
        console.error('Error reading image files:', err);
        res.status(500).json({ error: 'Error reading image files' });
    }
}
