const AWS = require('aws-sdk');

// S3 인스턴스 생성
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2' // 서울 리전
});

export default async function handler(req, res) {
    const params = {
        Bucket: 'declinesurvey',
        Prefix: 'images/' // 이미지가 들어 있는 폴더 경로
    };

    try {
        // S3에서 폴더 내의 객체(파일) 목록 가져오기
        const data = await s3.listObjectsV2(params).promise();
        
        // 각 파일의 URL 생성
        const imageUrls = data.Contents.map(item => 
            `https://${params.Bucket}.s3.${s3.config.region}.amazonaws.com/${item.Key}`
        );

        // 클라이언트에 이미지 URL 목록 반환
        res.status(200).json({ imageUrls });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching image URLs' });
    }
}
