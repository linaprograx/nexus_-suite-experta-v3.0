export const SCENE_STYLES = {
    // Colors & Gradients
    gradients: {
        'main-bar': 'linear-gradient(135deg, rgba(6, 182, 212, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)', // Cyan to Blue
        'production': 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)', // Emerald to Teal
        'dispatch': 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)', // Violet
        'backbar': 'linear-gradient(135deg, rgba(100, 116, 139, 0.9) 0%, rgba(71, 85, 105, 0.9) 100%)', // Slate
    },
    shadows: {
        block: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        selected: '0 0 40px rgba(6, 182, 212, 0.4), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        worker: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    },
    animations: {
        hover: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        float: 'float 6s ease-in-out infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }
};

export const ISO_CONSTANTS = {
    TILE_WIDTH: 220,
    TILE_HEIGHT: 110,
    ORIGIN_X: 450,
    ORIGIN_Y: 150,
    DEPTH_SCALE: 1.5, // How tall the blocks look
};
