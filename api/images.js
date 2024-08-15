const AWS = require('aws-sdk');

const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2'
});

export default async function handler(req, res) {
    try {
        const buckets = await S3.listBuckets().promise();
        console.log('Buckets:', buckets);
        res.status(200).json(buckets);
    } catch (err) {
        console.error('Error fetching buckets:', err);
        res.status(500).json({ error: 'Error fetching buckets', details: err.message });
    }
}
