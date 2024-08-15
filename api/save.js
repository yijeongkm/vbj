import AWS from 'aws-sdk';

const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2', // S3 버킷이 위치한 리전
});

export default function handler(req, res) {
    const result = req.body;

    // S3에 저장될 파일의 이름 (timestamp를 이용하여 고유한 이름 생성)
    const params = {
        Bucket: 'declinesurvey', // S3 버킷 이름
        Key: `results-${Date.now()}.json`, // 저장될 파일 이름
        Body: JSON.stringify(result), // 파일 내용 (설문 결과)
        ContentType: 'application/json', // 파일의 MIME 타입
    };

    // S3에 파일 업로드
    S3.putObject(params, (err, data) => {
        if (err) {
            console.error('Error uploading result to S3:', err);
            return res.status(500).json({ error: 'Error saving result' });
        }
        res.status(200).json({ message: 'Result saved to S3' });
    });
}
