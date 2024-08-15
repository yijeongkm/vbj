import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const imagesDir = path.join(process.cwd(), 'public/assets/images');
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/.test(file));
        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
        const imagePath = `/assets/images/${randomImage}`;
        res.status(200).json({ imageUrl: imagePath });
    });
}
