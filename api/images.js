const AWS = require('aws-sdk');

const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2'
});

export default async function handler(req, res) {
    const params = {
        Bucket: 'declinesurvey',
        Prefix: 'images/'
    };

    try {
        // S3에서 목록을 가져오기 전에, 환경 변수를 확인해보자.
        console.log('ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
        console.log('SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY);
        
        const data = await S3.listObjectsV2(params).promise();

        const imageFiles = data.Contents.filter(item => /\.(jpg|jpeg|png|gif)$/.test(item.Key));

        if (imageFiles.length === 0) {
            return res.status(404).json({ error: 'No images found' });
        }

        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];

        const imageUrl = `https://${params.Bucket}.s3.${S3.config.region}.amazonaws.com/${randomImage.Key}`;

        res.status(200).json({ imageUrl });
    } catch (err) {
        console.error('S3 Fetch Error:', err);  // 오류를 더 명확히 로그로 남긴다.
        res.status(500).json({ error: 'Error fetching image URLs' });
    }
}
