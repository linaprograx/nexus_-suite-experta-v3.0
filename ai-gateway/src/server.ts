import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { healthCheck } from './health.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, legacy devices, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:4173', // Vite preview
            process.env.FRONTEND_URL
        ].filter(Boolean) as string[];

        // Enhanced check
        const isAllowed = allowedOrigins.some(o => origin.startsWith(o)) || 
                         origin.includes('localhost');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`⚠️ Blocked CORS request from origin: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by AI Gateway CORS strategy`));
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

// ============================================
// API Routes (Frontend Compatibility)
// ============================================

app.post('/api/text', async (req: Request, res: Response) => {
    try {
        const { prompt, role = 'assistant' } = req.body;
        if (!prompt) {
            res.status(400).json({ error: "Missing 'prompt' in body" });
            return;
        }

        const { generateText } = await import('./vertex/client.js');
        const result = await generateText(prompt).catch((e: any) => {
            console.error("AI Gateway Fallback triggered:", e.message);
            // VITAL: Return JSON object, NOT a string, to avoid JSON.parse errors in frontend
            return {
                text: "✨ [NEXUS AI MOCK MODE ACTIVE]\n\nNo se han detectado credenciales de Google Cloud válidas. Sin embargo, el túnel de IA está OPERATIVO y listo.\n\nPara activar la IA real:\n1. Coloca tu 'service-account.json' en /ai-gateway/credentials/\n2. Reinicia el gateway.",
                mock: true
            };
        });
        res.json(result);

    } catch (error: any) {
        console.error("API Text Error:", error.message);
        res.status(502).json({ 
            text: `[API ERROR] ${error.message}. El Gateway está activo pero necesita credenciales.`,
            error: true 
        });
    }
});

app.post('/api/image', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            res.status(400).json({ error: "Missing 'prompt' in body" });
            return;
        }

        const { generateImage } = await import('./vertex/client.js');
        const result = await generateImage(prompt).catch(e => {
            return { 
                imageBase64: "MOCK_IMAGE_PLACEHOLDER", 
                mock: true, 
                message: "Imagen no disponible sin credenciales reales." 
            };
        });
        res.json(result);

    } catch (error: any) {
        console.error("API Image Error:", error.message);
        res.status(502).json({ error: error.message });
    }
});

// ============================================
// Vertex AI Endpoints (Direct Access)
// ============================================

app.post('/vertex/text', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            res.status(400).json({ error: "Missing 'prompt' in body" });
            return;
        }

        const { generateText } = await import('./vertex/client.js');
        const result = await generateText(prompt).catch((e: any) => {
            return { 
                text: `[API ERROR] ${e.message}. El Gateway está activo pero necesita credenciales.`,
                error: true 
            };
        });
        res.json(result);

    } catch (error: any) {
        console.error("Vertex Text Error:", error.message);
        res.status(502).json({ 
            text: `[API ERROR] ${error.message}`,
            error: true 
        });
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
    console.log(`\n📡 Frontend Routes:`);
    console.log(`   POST http://localhost:${PORT}/api/text`);
    console.log(`   POST http://localhost:${PORT}/api/image`);
    console.log(`\n🔧 Direct Vertex Routes:`);
    console.log(`   POST http://localhost:${PORT}/vertex/text`);
    console.log(`   POST http://localhost:${PORT}/vertex/search`);
    console.log(`   POST http://localhost:${PORT}/vertex/multimodal`);
    console.log(`   POST http://localhost:${PORT}/vertex/image\n`);
});
