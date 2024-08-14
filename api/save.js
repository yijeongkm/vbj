import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const result = req.body;
    const resultsFile = path.join(process.cwd(), 'results.json');

    fs.appendFile(resultsFile, JSON.stringify(result) + '\n', (err) => {
        if (err) {
            console.error('Error saving result:', err);
            return res.status(500).json({ error: 'Error saving result' });
        }
        res.status(200).json({ message: 'Result saved' });
    });
}
