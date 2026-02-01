import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { healthCheck } from './health.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration - Secure for production
const allowedOrigins = [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // Alternative dev port
    'https://nexus-suite.vercel.app',  // Production domain (update with your actual domain)
    process.env.FRONTEND_URL  // Dynamic origin from env
].filter(Boolean);  // Remove undefined values

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️ Blocked CORS request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.get('/health', healthCheck);

app.get('/auth/check', async (req: Request, res: Response) => {
    try {
        const { getAccessToken } = await import('./vertex/auth.js');
        const authData = await getAccessToken();

        res.json({
            auth: "ok",
            projectId: authData.projectId,
            scopes: ["cloud-platform"],
            tokenPreview: authData.token.substring(0, 5) + "..."
        });
    } catch (error: any) {
        res.status(500).json({
            auth: "error",
            message: error.message
        });
    }
});

// Vertex AI Endpoints
app.post('/vertex/text', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            res.status(400).json({ error: "Missing 'prompt' in body" });
            return;
        }

        const { generateText } = await import('./vertex/client.js');
        const result = await generateText(prompt);
        res.json(result);

    } catch (error: any) {
        console.error("Vertex Text Error:", error.message);
        res.status(502).json({ error: error.message });
    }
});

app.post('/vertex/search', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            res.status(400).json({ error: "Missing 'prompt' in body" });
            return;
        }

        const { generateWithSearch } = await import('./vertex/client.js');
        const result = await generateWithSearch(prompt);
        res.json(result);

    } catch (error: any) {
        console.error("Vertex Search Error:", error.message);
        res.status(502).json({ error: error.message });
    }
});

app.post('/vertex/multimodal', async (req: Request, res: Response) => {
    try {
        const { parts } = req.body;
        if (!parts || !Array.isArray(parts)) {
            res.status(400).json({ error: "Missing 'parts' array in body" });
            return;
        }

        const { generateMultimodal } = await import('./vertex/client.js');
        const result = await generateMultimodal(parts);
        res.json(result);

    } catch (error: any) {
        console.error("Vertex Multimodal Error:", error.message);
        res.status(502).json({ error: error.message });
    }
});

app.post('/vertex/image', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            res.status(400).json({ error: "Missing 'prompt' in body" });
            return;
        }

        const { generateImage } = await import('./vertex/client.js');
        const result = await generateImage(prompt);
        res.json(result);

    } catch (error: any) {
        console.error("Vertex Image Error:", error.message);
        res.status(502).json({ error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 AI Gateway running locally at http://localhost:${PORT}`);
    console.log(`👉 Health Check: http://localhost:${PORT}/health`);
    console.log(`👉 Auth Check:   http://localhost:${PORT}/auth/check`);
    console.log(`👉 Text Gen:     POST http://localhost:${PORT}/vertex/text`);
    console.log(`👉 Image Gen:    POST http://localhost:${PORT}/vertex/image\n`);
});
