import AWS from 'aws-sdk';

const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2', // S3 버킷이 위치한 리전
});

const INITIAL_DATA = { participants_count: 0, results: [] };

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
                return { Body: JSON.stringify(INITIAL_DATA) }; // 파일이 없을 경우 초기 데이터
            } else {
                throw error;
            }
        });

        let parsedData; 
        try {
            parsedData = JSON.parse(existingData.Body.toString('utf-8'));
        } catch (error) {
            console.error('Error parsing existing data:', error);
            return res.status(500).json({ error: 'Failed to parse existing data' });
        }

        // 참가자 ID 생성
        if (!newResult.participantId) {
            newResult.participantId = parsedData.participants_count + 1; // 임시 ID
        }

        const participantId = newResult.participantId;

        // responseId  추가
        const resultsWithId = newResult.results.map((result, index) => ({
            ...result,
            participantId, // 참가자 고유 ID
            responseId: `${participantId}-${index + 1}`,
        }));

        // 새 데이터를 기존 데이터에 병합
        const existingIds = new Set(parsedData.results.map(r => r.responseId));
        const uniqueResults = resultsWithId.filter(result => !existingIds.has(result.responseId));

        if (uniqueResults.length === 0) {
            return res.status(409).json({ error: 'Duplicate results detected, no new data saved.' });
        }

        parsedData.results = [...parsedData.results, ...uniqueResults];

        // 업데이트된 데이터 저장
        const updatedData = JSON.stringify(parsedData, null, 2); // 보기 쉽게 저장
        await S3.putObject({
            ...params,
            Body: updatedData,
            ContentType: 'application/json',
        }).promise();

        // 저장 성공 후에만 participants_count 증가
        parsedData.participants_count += 1;

        res.status(200).json({ 
            message: 'Result saved and appended', 
            participants_count: parsedData.participants_count,
            participantId, // 저장 후 참가자 수 반환
        });
    } catch (error) {
        console.error('Error saving result:', error);
        res.status(500).json({ error: 'Error saving result' });
    }
    }