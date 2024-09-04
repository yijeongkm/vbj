import AWS from 'aws-sdk';

const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2', // S3 버킷이 위치한 리전
});

export default async function handler(req, res) {
    const newResult = req.body; // 새로운 설문 결과 데이터

    const params = {
        Bucket: 'realsurvey', // S3 버킷 이름
        Key: 'survey-results.json', // 저장할 파일 이름
    };

    try {
        // 기존 파일 읽기
        const existingData = await S3.getObject(params).promise().catch(error => {
            if (error.code === 'NoSuchKey') {
                // 파일이 존재하지 않으면 빈 배열로 시작
                return { Body: JSON.stringify([]) };
            } else {
                throw error;
            }
        });

        const existingResults = JSON.parse(existingData.Body.toString('utf-8'));

        // 새로운 데이터를 기존 데이터에 추가
        existingResults.push(...newResult.results);

        // 업데이트된 데이터를 다시 S3에 저장
        const updatedData = JSON.stringify(existingResults);
        await S3.putObject({
            ...params,
            Body: updatedData,
            ContentType: 'application/json',
        }).promise();

        res.status(200).json({ message: 'Result saved and appended' });
    } catch (error) {
        console.error('Error saving result:', error);
        res.status(500).json({ error: 'Error saving result' });
    }
}
