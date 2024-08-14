import path from 'path';

export default function handler(req, res) {
    const file = path.join(process.cwd(), 'results.json');
    res.download(file, 'results.json', (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        }
    });
}
