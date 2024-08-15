const AWS = require('aws-sdk');

// S3 인스턴스 생성
const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2'
});

export default async function handler(req, res) {
    const params = {
        Bucket: 'declinesurvey',
        Prefix: 'images/' // 이미지가 들어 있는 폴더 경로
    };

    try {
        // S3에서 폴더 내의 모든 파일 목록 가져오기
        const data = await S3.listObjectsV2(params).promise();

        // 이미지 파일만 필터링
        const imageFiles = data.Contents.filter(item => /\.(jpg|jpeg|png|gif)$/.test(item.Key));

        if (imageFiles.length < 2) {
            return res.status(404).json({ error: 'Not enough images found' });
        }

        // 랜덤으로 두 개의 이미지를 선택
        const shuffledImages = imageFiles.sort(() => 0.5 - Math.random());
        const selectedImages = shuffledImages.slice(0, 2); // 두 개의 이미지 선택

        // 선택된 이미지의 URL 생성
        const imageUrls = selectedImages.map(image => `https://${params.Bucket}.s3.${S3.config.region}.amazonaws.com/${image.Key}`);

        // 클라이언트에 두 개의 이미지 URL 반환
        res.status(200).json({ imageUrls });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching image URLs' });
    }
}
