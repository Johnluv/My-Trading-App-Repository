
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ParsedData } from "../types";

// Initialize Gemini Client
// NOTE: API Key is injected via process.env.API_KEY automatically
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- 1. Intelligent Parsing (Screenshots & Text) ---

export const parseTradeDataFromImage = async (base64Image: string, mimeType: string): Promise<ParsedData> => {
  const prompt = `
    Analyze this trading chart/screenshot or history log. 
    1. Extract any visible completed trade execution details (Symbol, Buy/Sell, Entry, Exit, PnL).
    2. CRITICAL: Look for "Withdrawal" or "Deposit" transactions. Extract the amount and date.
    
    Return a JSON object with:
    - 'trades': array of trades.
    - 'transactions': array of deposits/withdrawals.
    
    Structure:
    trades: [{ symbol, type, entryPrice, exitPrice, sl, tp, pips, pnl, date }]
    transactions: [{ type: 'DEPOSIT'|'WITHDRAWAL', amount: number, date: string, note: string }]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // High intelligence for image analysis
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  type: { type: Type.STRING },
                  entryPrice: { type: Type.NUMBER },
                  exitPrice: { type: Type.NUMBER },
                  sl: { type: Type.NUMBER },
                  tp: { type: Type.NUMBER },
                  pips: { type: Type.NUMBER },
                  pnl: { type: Type.NUMBER },
                  date: { type: Type.STRING },
                }
              }
            },
            transactions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['DEPOSIT', 'WITHDRAWAL'] },
                        amount: { type: Type.NUMBER },
                        date: { type: Type.STRING },
                        note: { type: Type.STRING }
                    }
                }
            }
          }
        }
      }
    });
    
    const result = JSON.parse(response.text || "{}");
    return {
        trades: result.trades || [],
        transactions: result.transactions || []
    };
  } catch (error) {
    console.error("Error parsing image:", error);
    throw error;
  }
};

export const parseTradeDataFromText = async (textInput: string): Promise<ParsedData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest', // Fast model for text parsing
      contents: `Parse the following trading history text. Separate trading activity from capital movements (Deposits/Withdrawals).
      Input: "${textInput}".
      
      Output JSON with 'trades' and 'transactions' arrays.
      Transactions should strictly be DEPOSIT or WITHDRAWAL.
      Trades should include PnL.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
           properties: {
            trades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  type: { type: Type.STRING },
                  entryPrice: { type: Type.NUMBER },
                  exitPrice: { type: Type.NUMBER },
                  sl: { type: Type.NUMBER },
                  tp: { type: Type.NUMBER },
                  pips: { type: Type.NUMBER },
                  pnl: { type: Type.NUMBER },
                  date: { type: Type.STRING },
                }
              }
            },
            transactions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['DEPOSIT', 'WITHDRAWAL'] },
                        amount: { type: Type.NUMBER },
                        date: { type: Type.STRING },
                        note: { type: Type.STRING }
                    }
                }
            }
          }
        }
      }
    });
    const result = JSON.parse(response.text || "{}");
    return {
        trades: result.trades || [],
        transactions: result.transactions || []
    };
  } catch (error) {
    console.error("Error parsing text:", error);
    return { trades: [], transactions: [] };
  }
};

// --- 2. Technical Analysis (Patterns & Fibs) ---

export const analyzeChartPattern = async (base64Image: string, mimeType: string) => {
  const prompt = `
    Act as a professional technical analyst. Analyze this chart image.
    1. Identify specific candlestick patterns (e.g., Doji, Hammer, Engulfing, Morning Star).
    2. Identify any visible Fibonacci Retracement levels or support/resistance zones.
    3. Provide a directional bias (Bullish/Bearish/Neutral) based on these visual cues.
    
    Output valid JSON with the following structure:
    {
      "patterns": ["List of patterns found"],
      "fibonacci": "Description of fib levels if seen, or 'None visible'",
      "bias": "Bullish/Bearish/Neutral",
      "analysis": "A concise paragraph explaining the setup."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Best for Vision tasks
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing chart:", error);
    throw error;
  }
}

// --- 3. Market Search & Sentiment ---

export const getMarketSentiment = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a concise market sentiment summary for: ${query}. Focus on recent news and price action.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Error fetching market sentiment:", error);
    throw error;
  }
};

// --- 4. Chat Assistant & Portfolio Insight ---

export const chatWithAssistant = async (history: { role: string, parts: { text: string }[] }[], newMessage: string) => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: {
        systemInstruction: "You are 'Trade Like God', an elite trading mentor. Analyze risks, psychology, and technical setups with high precision.",
      }
    });
    
    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

export const generatePortfolioInsight = async (trades: any[], balance: number, goals: any) => {
    const prompt = `
    You are the intelligence layer of a Trading Analytics Dashboard (Trade Like God).
    Context:
    - Current Balance: $${balance}
    - Savings Goal: $${goals.savingsGoal}
    - Recent Trades: ${JSON.stringify(trades.slice(-10))}
    
    Your job is to generate a "Daily Briefing" following this format:
    1. **Dashboard Summary**: Quick state of the portfolio.
    2. **Actionable Insights**: Based on recent wins/losses.
    3. **Asset Ideas**: Recommend assets worth watching (Forex/Crypto/Stocks) based on general market knowledge.
    4. **Savings Feedback**: Progress towards the goal.

    Keep it concise, visual, and "God-like" in tone (professional, elite, calm).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Insight error:", error);
        throw error;
    }
};

// --- 5. Image Generation (Mindset/Visualization) ---

export const generateMindsetImage = async (prompt: string, aspectRatio: string) => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [{ text: prompt }]
        },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio as any, // 16:9, 1:1 etc
                imageSize: "1K"
            }
        }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
  } catch (error) {
      console.error("Image gen error:", error);
      throw error;
  }
};

// --- 6. Audio Features ---

export const transcribeAudio = async (audioBase64: string, mimeType: string) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: audioBase64, mimeType } },
                    { text: "Transcribe this audio note related to trading." }
                ]
            }
        });
        return response.text;
    } catch (error) {
        console.error("Transcription error:", error);
        throw error;
    }
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }
                    }
                }
            }
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated");
        
        // Decode base64 to ArrayBuffer
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    } catch (error) {
        console.error("TTS error:", error);
        throw error;
    }
}
