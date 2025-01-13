import AWS from 'aws-sdk';

const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2', // S3 버킷이 위치한 리전
});

export default async function handler(req, res) {
    const newResult = req.body; // 새로운 설문 결과 데이터

    // 결과가 배열인지 확인
    if (!Array.isArray(newResult.results)) {
        return res.status(400).json({ error: 'Invalid data format: results should be an array' });
    }

    const params = {
        Bucket: 'realsurvey', // S3 버킷 이름
        Key: 'pilot_survey.json', // 저장할 파일 이름
    };

    try {
        // 기존 데이터를 불러와 파싱
        const existingData = await S3.getObject(params).promise().catch(error => {
            if (error.code === 'NoSuchKey') {
                console.log('Initializing new file.');
                return { Body: JSON.stringify({ participants_count: 0, results: [] }) }; // 파일이 없을 경우 초기 데이터
            } else {
                throw error;
            }
        });

        let parsedData = JSON.parse(existingData.Body.toString('utf-8')) || { participants_count: 0, results: [] };

        if (newResult.requestId && parsedData.results.some(r => r.requestId === newResult.requestId)) {
            return res.status(400).json({ error: 'Duplicate request detected' });
        }

        try {
            parsedData = JSON.parse(existingData.Body.toString('utf-8'));
        } catch (error) {
            console.error('Error parsing existing data:', error);
            parsedData = { participants_count: 0, results: [] }; // 데이터 파싱 오류 시 초기화
        }

        // 참가자 수 증가
        parsedData.participants_count = (parsedData.participants_count || 0) + 1;

        // 새 데이터를 기존 데이터에 병합
        console.log('Before merge:', parsedData.results.length);
        console.log('New data:', newResult.results.length);
        parsedData.results = parsedData.results.concat(newResult.results);
        console.log('After merge:', parsedData.results.length);

        // 업데이트된 데이터 저장
        const updatedData = JSON.stringify(parsedData, null, 2); // 보기 쉽게 저장
        await S3.putObject({
            ...params,
            Body: updatedData,
            ContentType: 'application/json',
        }).promise();

        res.status(200).json({ 
            message: 'Result saved and appended', 
            participants_count: parsedData.participants_count // 저장 후 참가자 수 반환
        });
    } catch (error) {
        console.error('Error saving result:', error);
        res.status(500).json({ error: 'Error saving result' });
    }
}