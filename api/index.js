export default async function handler(req, res) {
    const { method } = req;

    // API 요청을 처리하는 로직
    if (method === 'GET') {
        // 예시: /api/images와 같은 GET 요청 처리
        res.status(200).json({ message: 'GET request received!' });
    } else if (method === 'POST') {
        // 예시: /api/save와 같은 POST 요청 처리
        res.status(200).json({ message: 'POST request received!' });
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
