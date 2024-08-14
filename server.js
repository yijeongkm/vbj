const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 이미지 목록을 제공하는 엔드포인트
app.get('/api/images', (req, res) => {
    const imagesDir = path.join(__dirname, 'public/assets/images');
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        // 이미지 파일만 필터링
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/.test(file));
        res.json(imageFiles);
    });
});

// 설문조사 결과를 저장하는 엔드포인트
app.post('/api/save', (req, res) => {
    const result = req.body;

    fs.appendFile('results.json', JSON.stringify(result) + '\n', (err) => {
        if (err) {
            console.error('Error saving result:', err);
            return res.status(500).send('Error saving result');
        }
        res.status(200).send('Result saved');
    });
});

// 설문조사 결과를 다운로드하는 엔드포인트
app.get('/api/results', (req, res) => {
    const file = path.join(__dirname, 'results.json');
    res.download(file, 'results.json', (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
