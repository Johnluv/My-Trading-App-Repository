import React, { useState, useEffect } from 'react';
import { generateMindsetImage, transcribeAudio, generateSpeech, analyzeChartPattern } from '../services/geminiService';

const Tools: React.FC = () => {
    // --- Tab State ---
    const [activeTool, setActiveTool] = useState<'chart' | 'mindset' | 'journal'>('chart');

    // --- Chart Analysis State ---
    const [chartAnalysis, setChartAnalysis] = useState<any>(null);
    const [chartLoading, setChartLoading] = useState(false);
    
    // --- Image Gen State ---
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [imgLoading, setImgLoading] = useState(false);
    const [apiKeyValid, setApiKeyValid] = useState(false);

    // --- Audio State ---
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [transcription, setTranscription] = useState('');
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [ttsText, setTtsText] = useState('');

    // Check API Key
    useEffect(() => {
        const checkKey = async () => {
             if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
                 const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                 setApiKeyValid(hasKey);
             } else {
                 setApiKeyValid(true);
             }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            setApiKeyValid(true);
        }
    };

    // --- Chart Analysis Handler ---
    const handleChartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setChartLoading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const base64 = (evt.target?.result as string).split(',')[1];
            try {
                const result = await analyzeChartPattern(base64, file.type);
                setChartAnalysis(result);
            } catch (err) {
                alert("Analysis failed.");
            } finally {
                setChartLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // --- Image Gen Handler ---
    const handleGenerateImage = async () => {
        if (!prompt) return;
        setImgLoading(true);
        try {
            const imgData = await generateMindsetImage(prompt, aspectRatio);
            if (imgData) setGeneratedImage(imgData);
        } catch (e) {
            alert("Image generation failed.");
        } finally {
            setImgLoading(false);
        }
    };

    // --- Audio Handlers ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                handleTranscribe(blob);
            };
            recorder.start();
            setMediaRecorder(recorder);
            setRecording(true);
        } catch (err) {
            alert("Microphone access denied.");
        }
    };

    const stopRecording = () => {
        mediaRecorder?.stop();
        setRecording(false);
    };

    const handleTranscribe = async (blob: Blob) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64data = (reader.result as string).split(',')[1];
            try {
                const text = await transcribeAudio(base64data, 'audio/webm');
                setTranscription(text || "No speech detected.");
            } catch (e) {
                setTranscription("Error transcribing audio.");
            }
        };
    };

    const handleTTS = async () => {
        if (!ttsText) return;
        try {
            const audioBuffer = await generateSpeech(ttsText);
            const ctx = new AudioContext();
            const buffer = await ctx.decodeAudioData(audioBuffer);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
        } catch (e) {
            alert("TTS Failed");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Sub-nav */}
            <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
                <button onClick={() => setActiveTool('chart')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTool === 'chart' ? 'bg-slate-700 text-amber-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}>AI Tech Analysis</button>
                <button onClick={() => setActiveTool('mindset')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTool === 'mindset' ? 'bg-slate-700 text-indigo-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}>Mindset Vision</button>
                <button onClick={() => setActiveTool('journal')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTool === 'journal' ? 'bg-slate-700 text-rose-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}>Voice Journal</button>
            </div>

            {activeTool === 'chart' && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                         <span className="material-icons text-amber-400 text-3xl">candlestick_chart</span>
                         <div>
                             <h2 className="text-xl font-bold text-slate-100">God-Eye Analysis</h2>
                             <p className="text-sm text-slate-400">Upload a chart to detect Candles, Fibs & Bias</p>
                         </div>
                    </div>

                    <label className="block w-full cursor-pointer bg-slate-900 border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-8 text-center transition-all group mb-8">
                        <span className="material-icons text-4xl text-slate-500 group-hover:text-amber-400 mb-2 block">add_a_photo</span>
                        <span className="text-slate-300 font-medium">Upload TradingView/MT4 Chart</span>
                        <input type="file" accept="image/*" onChange={handleChartUpload} className="hidden" />
                    </label>

                    {chartLoading && (
                         <div className="flex flex-col items-center justify-center py-8">
                             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-3"></div>
                             <span className="text-amber-400 font-medium animate-pulse">Analyzing Technical Structure...</span>
                        </div>
                    )}

                    {chartAnalysis && (
                        <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Analysis Results</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${chartAnalysis.bias === 'Bullish' ? 'bg-emerald-900 text-emerald-400' : chartAnalysis.bias === 'Bearish' ? 'bg-rose-900 text-rose-400' : 'bg-slate-700 text-slate-300'}`}>
                                    {chartAnalysis.bias}
                                </span>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Candlestick Patterns</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {chartAnalysis.patterns?.map((p: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-indigo-900/50 text-indigo-300 rounded border border-indigo-700 text-sm">{p}</span>
                                        )) || <span className="text-slate-500 text-sm">No clear patterns detected</span>}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Fibonacci & Levels</h4>
                                    <p className="text-slate-300 text-sm leading-relaxed">{chartAnalysis.fibonacci}</p>
                                </div>

                                <div className="p-4 bg-slate-800 rounded-lg border-l-4 border-amber-500">
                                    <p className="text-slate-200 text-sm">{chartAnalysis.analysis}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTool === 'mindset' && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="material-icons text-indigo-400 text-3xl">psychology</span>
                        <h2 className="text-xl font-bold text-slate-100">Mindset Visualizer</h2>
                    </div>
                    {/* Existing Mindset Code ... */}
                     {!apiKeyValid ? (
                     <div className="text-center p-8 bg-slate-900 rounded-lg">
                         <p className="mb-4 text-slate-400">Paid API Key required for Pro Image Generation.</p>
                         <button onClick={handleSelectKey} className="bg-indigo-600 text-white px-4 py-2 rounded">Select API Key</button>
                     </div>
                ) : (
                    <div className="space-y-4">
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your ideal trading setup, a motivational poster, or a chart pattern visualization..."
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                        />
                        <div className="flex gap-4">
                            <select 
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white outline-none"
                            >
                                <option value="16:9">16:9</option>
                                <option value="1:1">1:1</option>
                            </select>
                            <button 
                                onClick={handleGenerateImage}
                                disabled={imgLoading || !prompt}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all"
                            >
                                {imgLoading ? 'Generating...' : 'Generate Visualization'}
                            </button>
                        </div>
                        {generatedImage && (
                            <div className="mt-4 rounded-lg overflow-hidden border border-slate-600">
                                <img src={generatedImage} alt="Generated" className="w-full h-auto" />
                            </div>
                        )}
                    </div>
                )}
                </div>
            )}

            {activeTool === 'journal' && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="material-icons text-rose-400 text-3xl">mic</span>
                        <h2 className="text-xl font-bold text-slate-100">Voice Journal</h2>
                    </div>
                    
                     <div className="space-y-6">
                        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-center">
                            <button 
                                onClick={recording ? stopRecording : startRecording}
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                                    recording ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-110' : 'bg-slate-700 hover:bg-slate-600'
                                }`}
                            >
                                {recording ? (
                                    <div className="w-6 h-6 bg-white rounded-sm" />
                                ) : (
                                    <span className="material-icons text-white text-3xl">mic</span>
                                )}
                            </button>
                            <p className="mt-3 text-sm text-slate-400">{recording ? 'Recording...' : 'Tap to record entry'}</p>
                        </div>

                        {transcription && (
                             <div className="p-3 bg-slate-700/30 rounded border border-slate-600">
                                 <p className="text-xs text-slate-400 uppercase mb-1">Transcription</p>
                                 <p className="text-slate-200 italic">"{transcription}"</p>
                             </div>
                        )}
                        
                        <div className="flex gap-2">
                             <input 
                                type="text" 
                                value={ttsText}
                                onChange={(e) => setTtsText(e.target.value)}
                                placeholder="Text to read..."
                                className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white"
                             />
                             <button onClick={handleTTS} disabled={!ttsText} className="bg-emerald-600 text-white px-4 py-2 rounded">Speak</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tools;