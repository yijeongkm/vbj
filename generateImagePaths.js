const fs = require('fs');
const path = require('path');

// 'public/assets/images/' 폴더 경로
const imagesDirectory = path.join(process.cwd(), 'public/assets/images');

// 이미지 파일 목록 생성 함수
function getImagePaths() {
    // 'images' 폴더 내 모든 파일명 불러오기
    const imageFiles = fs.readdirSync(imagesDirectory);

    // 파일명으로부터 정적 파일 경로를 생성하여 배열 반환
    return imageFiles.map(file => `/assets/images/${file}`);
}

// 이미지 경로 목록 생성
const imagePaths = getImagePaths();

// 파일로 저장
fs.writeFileSync('imagePaths.json', JSON.stringify(imagePaths, null, 2));

console.log('이미지 경로 목록이 imagePaths.json 파일로 저장되었습니다.');
