import AWS from 'aws-sdk';

// DynamoDB 클라이언트 생성
const dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'ap-northeast-2' // 리전 설정
});

// S3 인스턴스 생성
const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2' // 서울 리전
});

// 배열을 랜덤하게 섞는 함수
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// S3에서 파일 목록을 가져와 DynamoDB에 저장하는 함수
async function loadFilesToDynamoDB() {
    const params = {
        Bucket: 'declinesurvey',
        Prefix: 'images/' // 이미지가 들어 있는 폴더 경로
    };

    try {

        console.log("S3에서 파일 목록을 가져오는 중...");

        let imageFiles = [];
        let isTruncated = true;
        let continuationToken = null;

        while (isTruncated) {
            const data = await S3.listObjectsV2({
                ...params,
                ContinuationToken: continuationToken
            }).promise();

            imageFiles = imageFiles.concat(data.Contents.filter(item => /\.(jpg|jpeg|png|gif)$/.test(item.Key)));
            console.log(`현재까지 로드된 파일 수: ${imageFiles.length}`);
            isTruncated = data.IsTruncated;
            continuationToken = data.NextContinuationToken;
        }

        console.log(`총 ${imageFiles.length}개의 파일이 발견되었습니다. 이제 DynamoDB에 저장합니다.`);


        // 파일 목록을 BatchWrite로 DynamoDB에 저장
        const BATCH_SIZE = 25; // DynamoDB BatchWrite는 한 번에 최대 25개 항목만 처리 가능

        for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
            const batch = imageFiles.slice(i, i + BATCH_SIZE).map(file => ({
                PutRequest: {
                    Item: {
                        images: file.Key
                    }
                }
            }));

            const batchParams = {
                RequestItems: {
                    'Decline-survey-Imagefiles': batch
                }
            };

            try {
                await dynamoDb.batchWrite(batchParams).promise();
                console.log(`${i + batch.length}개의 파일이 DynamoDB에 저장되었습니다.`);
            } catch (err) {
                console.error(`DynamoDB에 저장 중 오류 발생 (파일 범위: ${i}-${i + batch.length}): `, err);
            }            
        }

        console.log('DynamoDB에 파일 목록 저장 완료');
    } catch (err) {
        console.error('DynamoDB에 파일 목록 저장 중 오류: ', err);
    }
}   

// DynamoDB에서 랜덤한 두 개의 파일을 가져오는 함수
async function getRandomImagesFromDynamoDB() {
    try {
        // DynamoDB에서 모든 파일 목록을 불러오기
        const data = await dynamoDb.scan({
            TableName: 'Decline-survey-Imagefiles'
        }).promise();

        const imageFiles = data.Items.map(item => item.images);

        if (imageFiles.length < 2) {
            throw new Error('Not enough images in DynamoDB');
        }

        // 배열을 랜덤하게 섞음
        const shuffledImages = shuffleArray(imageFiles);

        // 랜덤으로 두 개의 이미지를 선택
        return shuffledImages.slice(0, 2);
    } catch (err) {
        console.error('DynamoDB에서 이미지 가져오기 오류: ', err);
        throw err;
    }
}

// 서버가 시작될 때 S3에서 파일 목록을 로드하고 DynamoDB에 저장 (필요할 때만 호출)
loadFilesToDynamoDB();

export default async function handler(req, res) {
    try {
        // DynamoDB에서 랜덤한 두 개의 이미지를 가져오기
        const selectedImages = await getRandomImagesFromDynamoDB();

        // CloudFront 배포 도메인 이름을 여기에 넣으세요.
        const cloudFrontDomain = 'd2icbqhqqbhym1.cloudfront.net'; // CloudFront 도메인

        const imageUrls = selectedImages.map(image => `https://${cloudFrontDomain}/${image}`);

        // 클라이언트에 두 개의 이미지 URL 반환
        res.status(200).json({ imageUrls });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching image URLs' });
    }
}