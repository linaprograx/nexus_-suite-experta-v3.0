export const SCENE_STYLES = {
    // Colors & Gradients
    gradients: {
        'main-bar': 'linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%)', // Cyan to Blue (Vibrant)
        'prep-room': 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)', // Emerald to Teal
        'dispatch-zone': 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.95) 100%)', // Violet
        'production': 'linear-gradient(135deg, rgba(234, 179, 8, 0.95) 0%, rgba(202, 138, 4, 0.95) 100%)', // Yellow to Amber
        'backbar': 'linear-gradient(135deg, rgba(148, 163, 184, 0.95) 0%, rgba(100, 116, 139, 0.95) 100%)', // Slate
    },
    shadows: {
        block: '0 20px 40px -5px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)', // Deep shadow + Highlight
        selected: '0 0 60px rgba(50, 200, 255, 0.4), 0 30px 60px -10px rgba(0, 0, 0, 0.6), inset 0 0 0 2px rgba(255,255,255,0.9)',
        worker: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
    },
    animations: {
        hover: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)', // Premium ease
        float: 'float 6s ease-in-out infinite',
        pulse: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }
};

export const ISO_CONSTANTS = {
    TILE_WIDTH: 220,
    TILE_HEIGHT: 110,
    ORIGIN_X: 450,
    ORIGIN_Y: 200,
    DEPTH_SCALE: 2.2, // Taller blocks for more "Game" feel
};
