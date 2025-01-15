import AWS from 'aws-sdk';

const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2', // S3 버킷이 위치한 리전
});

export default async function handler(req, res) {
    const newResult = req.body;

    // 결과가 배열인지 확인
    if (!Array.isArray(newResult.results)) {
        return res.status(400).json({ error: 'Invalid data format: results should be an array' });
    }

    const params = {
        Bucket: 'realsurvey', 
        Key: 'pilot_survey.json',
    };

    try {
        const existingData = await S3.getObject(params).promise().catch(error => {
            if (error.code === 'NoSuchKey') {
                console.log('Initializing new file.');
                return { Body: JSON.stringify() }; // 파일이 없을 경우 초기 데이터
            } else {
                throw error;
            }
        });

        let existingResults; 
        try {
            existingResults  = JSON.parse(existingData.Body.toString('utf-8'));
        } catch (error) {
            console.error('Error parsing existing data:', error);
            existingResults = []; // 데이터 파싱 오류 시 빈 배열로 초기화
        }

        // 새 데이터를 기존 데이터에 병합
        existingResults = existingResults.concat(newResult.results);

        // 업데이트된 데이터 저장
        const updatedData = JSON.stringify(existingResults, null, 2); // 보기 쉽게 저장
        await S3.putObject({
            ...params,
            Body: updatedData,
            ContentType: 'application/json',
        }).promise();

        res.status(200).json({ 
            message: 'Result saved and appended'});
    } catch (error) {
        console.error('Error saving result:', error);
        res.status(500).json({ error: 'Error saving result' });
    }
}