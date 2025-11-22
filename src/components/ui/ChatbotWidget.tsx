import React from 'react';
import { GoogleGenAI } from "@google/genai";
import { Icon } from './Icon';
import { ICONS } from './icons';
import { Button } from './Button';
import { Input } from './Input';
import { Spinner } from './Spinner';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

type ChatMessage = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

export const ChatbotWidget: React.FC = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [input, setInput] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [...messages, userMessage],
            });
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text }] };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Lo siento, ha ocurrido un error." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 transition-transform hover:scale-110"
                aria-label="Open chatbot"
            >
                <Icon svg={ICONS.chat} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[60vh] bg-card border rounded-lg shadow-xl flex flex-col z-50">
            <header className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">Asistente Nexus</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    <Icon svg={ICONS.x} className="h-4 w-4" />
                </Button>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                            {msg.parts[0].text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                         <div className="max-w-[80%] p-3 rounded-lg bg-secondary flex items-center">
                            <Spinner className="w-4 h-4" />
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Pregunta algo..."
                        disabled={loading}
                    />
                    <Button onClick={handleSend} disabled={loading}>Enviar</Button>
                </div>
            </footer>
        </div>
    );
};
