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

        let parsedData; 
        try {
            parsedData = JSON.parse(existingData.Body.toString('utf-8'));
        } catch (error) {
            console.error('Error parsing existing data:', error);
            parsedData = { participants_count: 0, results: [] }; // 데이터 파싱 오류 시 초기화
        }

        // 새로운 설문조사를 시작하며 참가자 번호를 부여
        parsedData.participants_count = parsedData.participants_count || 0;
        const participantId = parsedData.participants_count;

        // 새로운 설문 결과에 고유 번호를 추가
        const resultsWithId = newResult.results.map((result, index) => ({
            ...result,
            participantId, // 참가자 고유 번호
            responseId: `${participantId}-${index + 1}`, // 응답 고유 번호 (옵션)
        }));

        // 참가자 수 증가 (한 번만 증가)
        parsedData.participants_count = participantId;

        // 새 데이터를 기존 데이터에 병합
        parsedData.results = [...parsedData.results, ...resultsWithId];

        // 업데이트된 데이터 저장
        const updatedData = JSON.stringify(parsedData, null, 2); // 보기 쉽게 저장
        await S3.putObject({
            ...params,
            Body: updatedData,
            ContentType: 'application/json',
        }).promise();

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