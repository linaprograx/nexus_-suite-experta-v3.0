/**
 * Import Vision Service
 * Analyzes an image of a design (Canva, Miro, Figma, etc.) using the AI multimodal
 * endpoint and returns a list of BoardNode-compatible objects to place on the canvas.
 */

import { generateMultimodal } from '../../../services/ai/textService';
import { BoardNode } from './types';

export interface ImportedBoard {
    title: string;
    nodes: Omit<BoardNode, 'id'>[];
}

const SYSTEM_PROMPT = `You are a design-to-canvas parser.
Analyze the provided image of a design board (from Canva, Miro, Figma, or similar)
and extract all visible elements. Return a JSON object with this exact shape:

{
  "title": "short name for the board",
  "nodes": [
    {
      "type": "text" | "shape" | "image" | "card",
      "x": <number 0-2400>,
      "y": <number 0-1600>,
      "w": <number>,
      "h": <number>,
      "content": {
        "title": "<text content if type=text or card>",
        "body": "<additional body text if any>",
        "color": "<hex color of the element>",
        "backgroundColor": "<hex background color if visible>",
        "fontSize": <number or null>,
        "fontWeight": "normal" | "bold" | null,
        "align": "left" | "center" | "right" | null,
        "shapeType": "rectangle" | "circle" | "diamond" | null,
        "borderRadius": <number or null>,
        "borderColor": "<hex or null>",
        "borderWidth": <number or null>
      }
    }
  ]
}

Rules:
- Map the entire design to a 2400x1600 canvas coordinate space
- Every visible text block → type "text"
- Every image or photo → type "image"
- Every colored shape/frame/container → type "shape"
- Every card/sticky note → type "card"
- Estimate positions and sizes proportionally
- Include colors from the original design (hex)
- Return ONLY the JSON, no explanation, no markdown code blocks`;

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Strip the data:image/...;base64, prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function cleanJSON(raw: string): any | null {
    // Strip markdown code fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim();
    }
    try {
        return JSON.parse(cleaned);
    } catch {
        // Try to extract first JSON object
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
            try { return JSON.parse(match[0]); } catch { return null; }
        }
        return null;
    }
}

export async function analyzeDesignImage(file: File): Promise<ImportedBoard> {
    const base64 = await fileToBase64(file);
    const mimeType = file.type || 'image/png';

    const parts = [
        {
            inlineData: {
                mimeType,
                data: base64,
            }
        },
        { text: SYSTEM_PROMPT }
    ];

    const response = await generateMultimodal(parts);
    const parsed = cleanJSON(response.text);

    if (!parsed || !Array.isArray(parsed.nodes)) {
        throw new Error('La IA no pudo analizar el diseño. Intenta con una imagen más clara.');
    }

    return {
        title: parsed.title || 'Diseño importado',
        nodes: (parsed.nodes as any[]).map(n => ({
            type: n.type || 'card',
            x: Number(n.x) || 0,
            y: Number(n.y) || 0,
            w: Number(n.w) || 200,
            h: Number(n.h) || 100,
            zIndex: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            content: {
                title: n.content?.title || '',
                body: n.content?.body || '',
                color: n.content?.color || '#1e293b',
                backgroundColor: n.content?.backgroundColor || undefined,
                fontSize: n.content?.fontSize || undefined,
                fontWeight: n.content?.fontWeight || undefined,
                align: n.content?.align || undefined,
                shapeType: n.content?.shapeType || undefined,
                borderRadius: n.content?.borderRadius ?? 8,
                borderColor: n.content?.borderColor || undefined,
                borderWidth: n.content?.borderWidth || undefined,
            },
        })),
    };
}
