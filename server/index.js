import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Routes
import downloadRouter from './routes/download.js';
import translateRouter from './routes/translate.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create necessary directories
const dirs = ['uploads', 'temp', 'output'];
dirs.forEach(dir => {
    const dirPath = join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/output', express.static(join(__dirname, 'output')));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/download', downloadRouter);
app.use('/api/translate', translateRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Upload directory: ${join(__dirname, 'uploads')}`);
    console.log(`📁 Output directory: ${join(__dirname, 'output')}`);
});
