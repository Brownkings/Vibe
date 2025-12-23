import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabase.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: './.env' }); // Load from root

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Endpoints

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        res.json({ token: 'admin-token-123' }); // Simple token for demo
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Get all articles
app.get('/api/articles', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform snake_case to camelCase for frontend
        const transformedData = (data || []).map(article => ({
            id: article.id,
            title: article.title,
            content: article.content,
            category: article.category,
            author: article.author,
            imageUrl: article.image_url,
            createdAt: article.created_at
        }));

        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create article
app.post('/api/articles', async (req, res) => {
    try {
        const { title, content, category, author, imageUrl } = req.body;
        console.log('Received article data:', { title, category, author });

        const { data, error } = await supabase
            .from('articles')
            .insert([{
                title,
                content,
                category,
                author,
                image_url: imageUrl
            }])
            .select();

        if (error) throw error;

        console.log('Article saved to Supabase with ID:', data[0].id);
        res.status(201).json({ id: data[0].id, message: 'Article saved successfully' });
    } catch (error) {
        console.error('Error saving article to Supabase:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all videos
app.get('/api/videos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform snake_case to camelCase for frontend
        const transformedData = (data || []).map(video => ({
            id: video.id,
            title: video.title,
            youtubeUrl: video.youtube_url,
            thumbnailUrl: video.thumbnail_url,
            thumbnailPublicId: video.thumbnail_public_id,
            category: video.category,
            createdAt: video.created_at
        }));

        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create video record
app.post('/api/videos', async (req, res) => {
    try {
        const { title, youtubeUrl, thumbnailUrl, thumbnailPublicId, category } = req.body;
        console.log('Received video data:', { title, youtubeUrl, thumbnailUrl, category });

        const { data, error } = await supabase
            .from('videos')
            .insert([{
                title,
                youtube_url: youtubeUrl,
                thumbnail_url: thumbnailUrl,
                thumbnail_public_id: thumbnailPublicId,
                category: category || 'General'
            }])
            .select();

        if (error) throw error;

        console.log('Video saved to Supabase with ID:', data[0].id);
        res.status(201).json({ id: data[0].id, message: 'Video saved successfully' });
    } catch (error) {
        console.error('Error saving video to Supabase:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update article
app.put('/api/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, author, imageUrl } = req.body;

        const { data, error } = await supabase
            .from('articles')
            .update({
                title,
                content,
                category,
                author,
                image_url: imageUrl
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        console.log('Article updated:', id);
        res.json({ message: 'Article updated successfully', data: data[0] });
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete article
app.delete('/api/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('articles')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log('Article deleted:', id);
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update video
app.put('/api/videos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, youtubeUrl, thumbnailUrl, thumbnailPublicId, category } = req.body;

        const { data, error } = await supabase
            .from('videos')
            .update({
                title,
                youtube_url: youtubeUrl,
                thumbnail_url: thumbnailUrl,
                thumbnail_public_id: thumbnailPublicId,
                category
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        console.log('Video updated:', id);
        res.json({ message: 'Video updated successfully', data: data[0] });
    } catch (error) {
        console.error('Error updating video:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete video
app.delete('/api/videos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('videos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log('Video deleted:', id);
        res.json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload article image to Supabase Storage
app.post('/api/upload/article-image', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
        const { data, error } = await supabase.storage.from('article-images').upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('article-images').getPublicUrl(fileName);
        res.json({ url: publicUrl, path: fileName });
    } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

// Upload video thumbnail
app.post('/api/upload/video-thumbnail', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
        const { data, error } = await supabase.storage.from('video-thumbnails').upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('video-thumbnails').getPublicUrl(fileName);
        res.json({ url: publicUrl, path: fileName });
    } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
