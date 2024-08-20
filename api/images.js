import AWS from 'aws-sdk';

// S3 인스턴스 생성
const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2' // 서울 리전
});

// 배열을 랜덤하게 섞는 함수
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 파일 목록 캐싱을 위한 변수
let cachedImageFiles = [];

async function loadAndCacheImageFiles() {
    const params = {
        Bucket: 'declinesurvey',
        Prefix: 'images/' // 이미지가 들어 있는 폴더 경로
    };

    try {
        let imageFiles = [];
        let isTruncated = true;
        let continuationToken = null;

        while (isTruncated) {
            const data = await S3.listObjectsV2({
                ...params,
                ContinuationToken: continuationToken
            }).promise();

            imageFiles = imageFiles.concat(data.Contents.filter(item => /\.(jpg|jpeg|png|gif)$/.test(item.Key)));

            isTruncated = data.IsTruncated;
            continuationToken = data.NextContinuationToken;
        }

        cachedImageFiles = imageFiles; // 파일 목록을 캐시에 저장
        console.log('파일 목록 캐싱 완료: ', cachedImageFiles.length, '개 파일');
    } catch (err) {
        console.error('파일 목록 로드 오류: ', err);
    }
}

// 서버 시작 시 파일 목록을 캐싱
loadAndCacheImageFiles();

export default function handler(req, res) {
    try {
        if (cachedImageFiles.length < 2) {
            console.error('Not enough images in cache');
            return res.status(500).json({ error: 'Not enough images in cache' });
        }

        // 캐시된 목록에서 두 개의 이미지를 랜덤하게 선택
        const shuffledImages = shuffleArray([...cachedImageFiles]); // 캐시된 목록 복사 후 섞기
        const selectedImages = shuffledImages.slice(0, 2);

        // CloudFront 배포 도메인 이름을 여기에 넣으세요.
        const cloudFrontDomain = 'd2icbqhqqbhym1.cloudfront.net'; // CloudFront 도메인

        const imageUrls = selectedImages.map(image => `https://${cloudFrontDomain}/${image.Key}`);
        
        console.log('Selected images:', imageUrls);

        // 클라이언트에 두 개의 이미지 URL 반환
        res.status(200).json({ imageUrls });
    } catch (err) {
        console.error('Error fetching image URLs: ', err);
        res.status(500).json({ error: 'Error fetching image URLs' });
    }
}