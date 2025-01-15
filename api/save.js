import AWS from 'aws-sdk';

const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2', // S3 버킷이 위치한 리전
});

export default async function handler(req, res) {
    const newResult = req.body;

    // 디버깅 로그: API 호출 시 전달된 데이터 출력
    console.log('Save API called with data:', newResult);

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

        // 병합 시 중복 제거
        const mergedResults = mergeUnique(existingResults, newResult.results);

        const updatedData = JSON.stringify(mergedResults, null, 2);
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

function mergeUnique(existingResults, newResults) {
    const combined = [...existingResults, ...newResults];

    // JSON.stringify를 사용해 고유 키 생성
    const unique = combined.reduce((acc, item) => {
        const key = JSON.stringify(item); // 모든 필드를 기준으로 고유 키 생성
        if (!acc.seen.has(key)) {
            acc.seen.add(key);
            acc.results.push(item);
        }
        return acc;
    }, { seen: new Set(), results: [] });

    return unique.results;
}