import React, { useState } from 'react';
import { generateImage } from '../../services/ai/imageService';

export const ImageGeneratorTest: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setError(null);
        setImageSrc(null);

        try {
            const result = await generateImage(prompt);
            setImageSrc(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            maxWidth: '500px',
            fontFamily: 'sans-serif',
            backgroundColor: '#1a1a1a',
            color: '#fff'
        }}>
            <h3 style={{ marginTop: 0 }}>Gateway Image Test</h3>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter image prompt..."
                    style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #444',
                        backgroundColor: '#333',
                        color: 'white'
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    style={{
                        padding: '8px 16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        backgroundColor: loading ? '#666' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                >
                    {loading ? 'Generating...' : 'Go'}
                </button>
            </div>

            {error && (
                <div style={{
                    color: '#ff6b6b',
                    marginBottom: '10px',
                    fontSize: '14px',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    padding: '8px',
                    borderRadius: '4px'
                }}>
                    Error: {error}
                </div>
            )}

            {imageSrc && (
                <div style={{ textAlign: 'center' }}>
                    <img
                        src={imageSrc}
                        alt="Generated"
                        style={{
                            maxWidth: '100%',
                            borderRadius: '4px',
                            border: '1px solid #444'
                        }}
                    />
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                        Generated from Vertex AI
                    </p>
                </div>
            )}
        </div>
    );
};
