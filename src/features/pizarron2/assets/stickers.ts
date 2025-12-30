export interface StickerDef {
    id: string;
    url: string; // or component
    label: string;
    tags: string[];
}

export const STICKER_LIBRARY: StickerDef[] = [
    { id: 'star_gold', url: '/stickers/star_gold.svg', label: 'Gold Star', tags: ['rating', 'star'] },
    { id: 'check_green', url: '/stickers/check_green.svg', label: 'Green Check', tags: ['status', 'done'] },
    { id: 'warning_red', url: '/stickers/warning_red.svg', label: 'Warning', tags: ['alert', 'warning'] },
    // More to be added
];
