import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabase.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

dotenv.config({ path: './.env' });

// Validate required environment variables
const requiredEnvVars = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`ERROR: Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'];

// Security: Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.youtube.com", "https://www.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", process.env.SUPABASE_URL || ""],
            frameSrc: ["https://www.youtube.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Security: CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '1mb' })); // Limit body size

// Security: Rate limiting for login endpoint
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Security: Rate limiting for general API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.'
});

app.use('/api/', apiLimiter);

// Security: File upload configuration with validation
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow images
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
        }
    }
});

// Middleware: Authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Validation rules
const articleValidation = [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('content').trim().isLength({ min: 1, max: 50000 }).withMessage('Content must be 1-50000 characters'),
    body('category').isIn(['Politics', 'Culture', 'Economy', 'Society', 'Education', 'Faith']).withMessage('Invalid category'),
    body('author').trim().isLength({ min: 1, max: 100 }).withMessage('Author must be 1-100 characters'),
    body('imageUrl').optional().isURL().withMessage('Invalid image URL')
];

const videoValidation = [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('youtubeUrl').matches(/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/).withMessage('Invalid YouTube URL'),
    body('category').optional().isIn(['Politics', 'Culture', 'Economy', 'Society', 'Education', 'Faith']).withMessage('Invalid category'),
    body('thumbnailUrl').optional().isURL().withMessage('Invalid thumbnail URL')
];

// Helper: Check validation results
function checkValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

// API Endpoints

// Login - with rate limiting and bcrypt
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Check username
        if (username !== process.env.ADMIN_USERNAME) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if password is hashed (starts with $2b$) or plain text
        let isValid = false;
        if (process.env.ADMIN_PASSWORD.startsWith('$2b$')) {
            // Password is hashed, use bcrypt
            isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);
        } else {
            // Legacy: plain text comparison (for backward compatibility)
            // WARN: User should update to hashed password
            isValid = password === process.env.ADMIN_PASSWORD;
            if (isValid) {
                console.warn('WARNING: Using plain text password. Please hash your password and update .env');
            }
        }

        if (isValid) {
            // Generate JWT token
            const token = jwt.sign(
                { username: username, role: 'admin' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all articles (public)
app.get('/api/articles', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

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

// Create article (protected)
app.post('/api/articles', authenticateToken, articleValidation, checkValidation, async (req, res) => {
    try {
        const { title, content, category, author, imageUrl } = req.body;

        const { data, error } = await supabase
            .from('articles')
            .insert([{
                title,
                content,
                category,
                author,
                image_url: imageUrl || null
            }])
            .select();

        if (error) throw error;

        console.log('Article created by:', req.user.username, 'ID:', data[0].id);
        res.status(201).json({ id: data[0].id, message: 'Article saved successfully' });
    } catch (error) {
        console.error('Error saving article:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update article (protected)
app.put('/api/articles/:id', authenticateToken, articleValidation, checkValidation, async (req, res) => {
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

        console.log('Article updated by:', req.user.username, 'ID:', id);
        res.json({ message: 'Article updated successfully', data: data[0] });
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete article (protected)
app.delete('/api/articles/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('articles')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log('Article deleted by:', req.user.username, 'ID:', id);
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all videos (public)
app.get('/api/videos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

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

// Create video (protected)
app.post('/api/videos', authenticateToken, videoValidation, checkValidation, async (req, res) => {
    try {
        const { title, youtubeUrl, thumbnailUrl, thumbnailPublicId, category } = req.body;

        const { data, error } = await supabase
            .from('videos')
            .insert([{
                title,
                youtube_url: youtubeUrl,
                thumbnail_url: thumbnailUrl || null,
                thumbnail_public_id: thumbnailPublicId || null,
                category: category || 'General'
            }])
            .select();

        if (error) throw error;

        console.log('Video created by:', req.user.username, 'ID:', data[0].id);
        res.status(201).json({ id: data[0].id, message: 'Video saved successfully' });
    } catch (error) {
        console.error('Error saving video:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update video (protected)
app.put('/api/videos/:id', authenticateToken, videoValidation, checkValidation, async (req, res) => {
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

        console.log('Video updated by:', req.user.username, 'ID:', id);
        res.json({ message: 'Video updated successfully', data: data[0] });
    } catch (error) {
        console.error('Error updating video:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete video (protected)
app.delete('/api/videos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('videos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log('Video deleted by:', req.user.username, 'ID:', id);
        res.json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload article image (protected)
app.post('/api/upload/article-image', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileExt = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;

        const { data, error } = await supabase.storage
            .from('article-images')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600'
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('article-images')
            .getPublicUrl(fileName);

        console.log('Article image uploaded by:', req.user.username);
        res.json({ url: publicUrl, path: fileName });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload video thumbnail (protected)
app.post('/api/upload/video-thumbnail', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileExt = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;

        const { data, error } = await supabase.storage
            .from('video-thumbnails')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600'
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('video-thumbnails')
            .getPublicUrl(fileName);

        console.log('Video thumbnail uploaded by:', req.user.username);
        res.json({ url: publicUrl, path: fileName });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: err.message });
    }

    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS policy: Origin not allowed' });
    }

    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Security features enabled:');
    console.log('- Helmet security headers');
    console.log('- JWT authentication');
    console.log('- Rate limiting');
    console.log('- Input validation');
    console.log('- File upload restrictions');
    console.log('- CORS policy');
});
