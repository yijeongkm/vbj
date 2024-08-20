import AWS from 'aws-sdk';

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

export default async function handler(req, res) {
    const params = {
        Bucket: 'declinesurvey',
        Prefix: 'images/' // 이미지가 들어 있는 폴더 경로
    };

    try {
        // 모든 객체를 가져오기 위한 반복 로직
        let imageFiles = [];
        let isTruncated = true; // 더 많은 파일이 있는지 확인하는 플래그
        let continuationToken = null;

        while (isTruncated) {
            const data = await S3.listObjectsV2({
                ...params,
                ContinuationToken: continuationToken // 이어서 파일을 가져오기 위한 토큰
            }).promise();

            imageFiles = imageFiles.concat(data.Contents.filter(item => /\.(jpg|jpeg|png|gif)$/.test(item.Key)));

            isTruncated = data.IsTruncated; // 더 많은 파일이 있으면 true
            continuationToken = data.NextContinuationToken; // 다음 호출을 위한 토큰 설정
        }

        // 배열을 랜덤하게 섞음
        const shuffledImages = shuffleArray(imageFiles); // 셔플된 이미지 배열

        // 랜덤으로 두 개의 이미지를 선택
        const selectedImages = shuffledImages.slice(0, 2); // 두 개의 이미지 선택

        // 선택된 이미지의 URL 생성
        const imageUrls = selectedImages.map(image => `https://${params.Bucket}.s3.${S3.config.region}.amazonaws.com/${image.Key}`);

        // 클라이언트에 두 개의 이미지 URL 반환
        res.status(200).json({ imageUrls });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching image URLs' });
    }
}
