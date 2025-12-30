
import { BoardStructure, BoardZone as StructureZone } from './types';


export const STRUCTURE_TEMPLATES: Record<string, BoardStructure> = {
    'cocktail-recipe-structure': {
        id: 'cocktail-recipe-structure',
        name: 'Cocktail Recipe',
        description: 'Standard technical sheet for cocktail development.',
        zones: [
            // Header Image (Left)
            { id: 'photo', label: 'Photo', x: 0.05, y: 0.05, w: 0.35, h: 0.4, defaultType: 'image', style: { dashed: true } },
            // Title (Right Top)
            { id: 'name', label: 'Cocktail Name', x: 0.45, y: 0.05, w: 0.5, h: 0.1, defaultType: 'text', content: { text: 'COCKTAIL NAME' } },
            // Story/Desc (Right Mid)
            { id: 'desc', label: 'Concept / Story', x: 0.45, y: 0.18, w: 0.5, h: 0.2, defaultType: 'text', content: { text: 'Concept description...' } },

            // Ingredients Col (Left Bottom)
            { id: 'ingredients', label: 'Ingredients', x: 0.05, y: 0.5, w: 0.28, h: 0.45, defaultType: 'list', content: { text: '• 50ml Spirit\n• 20ml Acid\n• 15ml Syrup' } },
            // Technique Col (Mid Bottom)
            { id: 'technique', label: 'Technique & Glass', x: 0.36, y: 0.5, w: 0.28, h: 0.45, defaultType: 'list', content: { text: 'Method: Shake\nGlass: Coupe\nIce: None' } },
            // Cost/Garnish (Right Bottom)
            { id: 'specs', label: 'Garnish & Cost', x: 0.67, y: 0.5, w: 0.28, h: 0.45, defaultType: 'list', content: { text: 'Garnish: Lemon Twist\n\nCost: $2.50\nPrice: $12.00' } },
        ]
    },

    'menu-layout-structure': {
        id: 'menu-layout-structure',
        name: 'Menu Layout',
        description: 'Vertical list layout for menu design.',
        zones: [
            { id: 'header', label: 'Menu Section', x: 0.1, y: 0.12, w: 0.8, h: 0.08, defaultType: 'text', content: { text: 'SIGNATURE COCKTAILS' } },
            // Item 1
            { id: 'item1_name', label: 'Item 1', x: 0.1, y: 0.22, w: 0.6, h: 0.05, defaultType: 'text', content: { text: 'Cocktail Name' }, style: {} },
            { id: 'item1_price', label: 'Price', x: 0.8, y: 0.22, w: 0.1, h: 0.05, defaultType: 'text', content: { text: '12€' } },
            { id: 'item1_desc', label: 'Desc', x: 0.1, y: 0.28, w: 0.8, h: 0.05, defaultType: 'text', content: { text: 'Description of ingredients and flavor profile.' }, style: { shading: '#f8fafc' } },
            // Item 2
            { id: 'item2_name', label: 'Item 2', x: 0.1, y: 0.35, w: 0.6, h: 0.05, defaultType: 'text', content: { text: 'Cocktail Name' } },
            { id: 'item2_price', label: 'Price', x: 0.8, y: 0.35, w: 0.1, h: 0.05, defaultType: 'text', content: { text: '12€' } },
            { id: 'item2_desc', label: 'Desc', x: 0.1, y: 0.41, w: 0.8, h: 0.05, defaultType: 'text', content: { text: 'Description of ingredients and flavor profile.' }, style: { shading: '#f8fafc' } },
            // Item 3
            { id: 'item3_name', label: 'Item 3', x: 0.1, y: 0.50, w: 0.6, h: 0.05, defaultType: 'text', content: { text: 'Cocktail Name' } },
            { id: 'item3_price', label: 'Price', x: 0.8, y: 0.50, w: 0.1, h: 0.05, defaultType: 'text', content: { text: '12€' } },
            { id: 'item3_desc', label: 'Desc', x: 0.1, y: 0.56, w: 0.8, h: 0.05, defaultType: 'text', content: { text: 'Description of ingredients and flavor profile.' }, style: { shading: '#f8fafc' } },
        ]
    },

    'storytelling-structure': {
        id: 'storytelling-structure',
        name: 'Storytelling',
        description: 'Asymmetric layout for narrative/concept presentation.',
        zones: [
            { id: 'hero', label: 'Hero Image', x: 0, y: 0, w: 0.6, h: 1, defaultType: 'image', style: { shading: '#f1f5f9' }, content: { text: '' } },
            { id: 'title', label: 'Title', x: 0.65, y: 0.1, w: 0.3, h: 0.15, defaultType: 'text', content: { text: 'THE VISION' } },
            { id: 'body', label: 'Body Text', x: 0.65, y: 0.3, w: 0.3, h: 0.4, defaultType: 'text', content: { text: 'Narrative text that explains the concept, inspiration, or history behind the collection.' } },
            { id: 'detail', label: 'Detail', x: 0.65, y: 0.75, w: 0.3, h: 0.2, defaultType: 'image', content: { text: '' } }
        ]
    },

    'comparison-structure': {
        id: 'comparison-structure',
        name: 'Comparison',
        description: '3-Column layout for comparing versions or providers.',
        zones: [
            { id: 'col1', label: 'Option A', x: 0.05, y: 0.1, w: 0.26, h: 0.8, defaultType: 'list', style: { shading: '#f8fafc' }, content: { text: '• Feature 1\n• Feature 2' } },
            { id: 'col2', label: 'Option B', x: 0.37, y: 0.1, w: 0.26, h: 0.8, defaultType: 'list', style: { shading: '#f8fafc' }, content: { text: '• Feature 1\n• Feature 2' } },
            { id: 'col3', label: 'Option C', x: 0.69, y: 0.1, w: 0.26, h: 0.8, defaultType: 'list', style: { shading: '#f8fafc' }, content: { text: '• Feature 1\n• Feature 2' } }
        ]
    },

    'technical-grid-structure': {
        id: 'technical-grid-structure',
        name: 'Technical Grid',
        description: '2x2 Matrix for SWOT/DAFO or Quadrant analysis.',
        zones: [
            { id: 'q1', label: 'Strengths', x: 0.05, y: 0.05, w: 0.425, h: 0.425, defaultType: 'list', content: { text: '• Strength 1' } },
            { id: 'q2', label: 'Weaknesses', x: 0.525, y: 0.05, w: 0.425, h: 0.425, defaultType: 'list', content: { text: '• Weakness 1' } },
            { id: 'q3', label: 'Opportunities', x: 0.05, y: 0.525, w: 0.425, h: 0.425, defaultType: 'list', content: { text: '• Opportunity 1' } },
            { id: 'q4', label: 'Threats', x: 0.525, y: 0.525, w: 0.425, h: 0.425, defaultType: 'list', content: { text: '• Threat 1' } }
        ]
    },

    'visual-moodboard-structure': {
        id: 'visual-moodboard-structure',
        name: 'Moodboard',
        description: 'Freeform guided structure for inspiration.',
        zones: [
            // Mosaic
            { id: 'z1', label: 'Img', x: 0, y: 0, w: 0.33, h: 0.5, defaultType: 'image', content: { text: '' } },
            { id: 'z2', label: 'Img', x: 0.33, y: 0, w: 0.33, h: 0.5, defaultType: 'image', content: { text: '' } },
            { id: 'z3', label: 'Img', x: 0.66, y: 0, w: 0.34, h: 0.5, defaultType: 'image', content: { text: '' } },
            { id: 'z4', label: 'Img', x: 0, y: 0.5, w: 0.5, h: 0.5, defaultType: 'image', content: { text: '' } },
            { id: 'z5', label: 'Img', x: 0.5, y: 0.5, w: 0.5, h: 0.5, defaultType: 'image', content: { text: '' } }
        ]
    },
    'menu-design-structure': {
        id: 'menu-design-structure',
        name: 'Menu Design Intelligence',
        description: 'Conceptual space for menu design and engineering.',
        zones: [
            { id: 'section-header', label: 'Section Header', x: 0.05, y: 0.05, w: 0.9, h: 0.1, defaultType: 'menu-section' },
            { id: 'items-grid', label: 'Menu Items', x: 0.05, y: 0.2, w: 0.9, h: 0.7, defaultType: 'grid' }
        ]
    }
};
