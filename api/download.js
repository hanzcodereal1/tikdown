const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Gunakan POST.' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL TikTok tidak boleh kosong!' });
    }

    try {
        const params = new URLSearchParams();
        params.append('url', url);
        params.append('hd', '1');

        const response = await axios.post('https://www.tikwm.com/api/', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const resData = response.data;

        if (resData.code !== 0 || !resData.data) {
            return res.status(400).json({
                error: "Gagal mengambil data. Pastikan URL valid, akun tidak privat, dan coba lagi."
            });
        }

        const data = resData.data;

        const result = {
            success: true,
            data: {
                username: data.author.unique_id,
                nickname: data.author.nickname,
                avatar: data.author.avatar,
                description: data.title || "Tidak ada deskripsi.",
                thumbnail: data.cover,
                stats: {
                    likes: data.digg_count || 0,
                    comments: data.comment_count || 0,
                    shares: data.share_count || 0,
                    views: data.play_count || 0
                },
                type: data.images && data.images.length > 0 ? 'photo' : 'video',
                downloads: {
                    nowm: data.play ? [data.play] : [],
                    wm: data.wmplay ? [data.wmplay] : []
                },
                mp3: data.music ? [data.music] : [],
                slides: data.images ? data.images.map((img, index) => ({
                    url: img,
                    index: index + 1
                })) : []
            }
        };

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({ 
            success: false,
            error: `Server Error: ${error.message}` 
        });
    }
};
