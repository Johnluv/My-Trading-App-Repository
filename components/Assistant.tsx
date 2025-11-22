
import React, { useState, useRef, useEffect } from 'react';
import { chatWithAssistant, getMarketSentiment, generatePortfolioInsight } from '../services/geminiService';
import { ChatMessage, SearchResult } from '../types';

// Mock props for demo - normally passed from App state
interface AssistantProps {
    trades?: any[];
    balance?: number;
    goals?: any;
}

const Assistant: React.FC<AssistantProps> = ({ trades = [], balance = 0, goals = {} }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I am your AI Trading Assistant. Ask me about your strategy, psychology, or live market sentiment.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchData, setSearchData] = useState<{ text: string, sources: any[] } | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (input.toLowerCase().includes('news') || input.toLowerCase().includes('sentiment') || input.toLowerCase().includes('price of')) {
         const sentiment = await getMarketSentiment(input);
         setSearchData(sentiment); 
         const botMsg: ChatMessage = { 
             id: (Date.now() + 1).toString(), 
             role: 'model', 
             text: sentiment.text, 
             timestamp: Date.now() 
         };
         setMessages(prev => [...prev, botMsg]);
      } else {
         setSearchData(null);
         const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
         const responseText = await chatWithAssistant(history, userMsg.text);
         const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
         setMessages(prev => [...prev, botMsg]);
      }
    } catch (err) {
      const errorMsg: ChatMessage = { id: Date.now().toString(), role: 'model', text: "Sorry, I encountered an error. Please try again.", timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleDailyBriefing = async () => {
      setLoading(true);
      try {
          const briefing = await generatePortfolioInsight(trades, balance, goals);
          const botMsg: ChatMessage = { id: Date.now().toString(), role: 'model', text: briefing, timestamp: Date.now() };
          setMessages(prev => [...prev, botMsg]);
      } catch(err) {
          alert("Could not generate briefing.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-4 animate-fade-in">
        {/* Chat Area */}
        <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden shadow-lg">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                            m.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-slate-700 text-slate-200 rounded-tl-none'
                        }`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-700 p-3 rounded-2xl rounded-tl-none flex gap-2">
                             <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                             <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>
            
            <div className="p-4 bg-slate-900 border-t border-slate-700">
                <div className="flex gap-2 mb-2">
                    <button 
                        onClick={handleDailyBriefing}
                        className="text-xs bg-amber-900/50 text-amber-400 border border-amber-700/50 px-3 py-1 rounded-full hover:bg-amber-900 transition-colors"
                    >
                        ✨ Generate Daily Briefing
                    </button>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about XAUUSD strategies or recent news..."
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>

        {/* Search Grounding Panel (Dynamic) */}
        {searchData && searchData.sources.length > 0 && (
            <div className="w-80 bg-slate-800 rounded-xl border border-slate-700 p-4 overflow-y-auto hidden lg:block shadow-lg">
                <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                    <span className="material-icons">public</span> Live Sources
                </h3>
                <div className="space-y-3">
                    {searchData.sources.map((chunk, idx) => {
                        const web = chunk.web;
                        if (!web) return null;
                        return (
                             <a 
                                key={idx} 
                                href={web.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className="block p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-indigo-500 transition-colors group"
                             >
                                <div className="text-xs text-indigo-400 mb-1 truncate">{web.uri}</div>
                                <div className="text-sm text-slate-200 font-medium leading-tight group-hover:text-indigo-300">
                                    {web.title}
                                </div>
                             </a>
                        );
                    })}
                </div>
            </div>
        )}
    </div>
  );
};

export default Assistant;
