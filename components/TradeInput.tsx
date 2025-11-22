
import React, { useState } from 'react';
import { Trade, TradeType, Transaction, UserSettings } from '../types';
import { parseTradeDataFromImage, parseTradeDataFromText } from '../services/geminiService';
import CapitalManager from './CapitalManager';

interface OperationsViewProps {
  onAddTrades: (trades: Trade[]) => void;
  onAddTransactions: (transactions: Transaction[]) => void;
  transactions: Transaction[];
  settings: UserSettings;
  onUpdateSettings: (s: UserSettings) => void;
  currentPnL: number;
}

const OperationsView: React.FC<OperationsViewProps> = ({ 
    onAddTrades, 
    onAddTransactions, 
    transactions, 
    settings, 
    onUpdateSettings, 
    currentPnL 
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai-import' | 'capital'>('manual');
  const [loading, setLoading] = useState(false);
  
  // AI Import State
  const [inputText, setInputText] = useState('');
  const [previewTrades, setPreviewTrades] = useState<Partial<Trade>[]>([]);
  const [previewTransactions, setPreviewTransactions] = useState<Partial<Transaction>[]>([]);

  // Manual Entry Spreadsheet State
  const [manualRows, setManualRows] = useState<Partial<Trade>[]>([
    { symbol: 'XAUUSD', type: TradeType.BUY, entryPrice: 0, exitPrice: 0, sl: 0, tp: 0, pips: 0, pnl: 0, lotSize: 0.01 }
  ]);

  // --- Helpers ---
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // --- AI Import Handlers ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const { trades, transactions } = await parseTradeDataFromImage(base64, file.type);
      setPreviewTrades(trades);
      setPreviewTransactions(transactions);
    } catch (err) {
      alert("Failed to analyze image. Ensure it's a clear chart or execution log.");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
          const text = evt.target?.result as string;
          try {
             const { trades, transactions } = await parseTradeDataFromText(text);
             setPreviewTrades(trades);
             setPreviewTransactions(transactions);
          } catch (err) {
              alert("Failed to parse CSV data.");
          } finally {
              setLoading(false);
          }
      };
      reader.readAsText(file);
  }

  const handleTextImport = async () => {
      if(!inputText.trim()) return;
      setLoading(true);
      try {
          const { trades, transactions } = await parseTradeDataFromText(inputText);
          setPreviewTrades(trades);
          setPreviewTransactions(transactions);
      } catch (err) {
          alert("Failed to parse text.");
      } finally {
          setLoading(false);
      }
  }

  const confirmImport = () => {
    const cleanTrades: Trade[] = previewTrades.map(t => ({
      id: crypto.randomUUID(),
      symbol: t.symbol || 'UNKNOWN',
      type: (t.type?.toString().toUpperCase() === 'SELL' ? TradeType.SELL : TradeType.BUY),
      entryPrice: Number(t.entryPrice) || 0,
      exitPrice: Number(t.exitPrice) || 0,
      sl: Number(t.sl) || 0,
      tp: Number(t.tp) || 0,
      pips: Number(t.pips) || 0,
      lotSize: Number(t.lotSize) || 0.01,
      pnl: Number(t.pnl) || 0,
      date: t.date || new Date().toISOString(),
      notes: t.notes || 'Imported via AI',
      status: (Number(t.pnl) || 0) > 0 ? 'WIN' : 'LOSS'
    }));
    
    const cleanTransactions: Transaction[] = previewTransactions.map(t => ({
        id: crypto.randomUUID(),
        type: (t.type === 'WITHDRAWAL' ? 'WITHDRAWAL' : 'DEPOSIT'),
        amount: Number(t.amount) || 0,
        date: t.date || new Date().toISOString(),
        note: t.note || 'Imported via AI'
    }));

    if (cleanTrades.length > 0) onAddTrades(cleanTrades);
    if (cleanTransactions.length > 0) onAddTransactions(cleanTransactions);

    setPreviewTrades([]);
    setPreviewTransactions([]);
    setInputText('');
    alert(`Imported: ${cleanTrades.length} Trades, ${cleanTransactions.length} Transactions.`);
  };

  // --- Manual Entry Handlers ---
  const updateRow = (index: number, field: keyof Trade, value: any) => {
    const newRows = [...manualRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setManualRows(newRows);
  };

  const addRow = () => {
    setManualRows([...manualRows, { symbol: 'XAUUSD', type: TradeType.BUY, entryPrice: 0, exitPrice: 0, sl: 0, tp: 0, pips: 0, pnl: 0, lotSize: 0.01 }]);
  };

  const removeRow = (index: number) => {
      if(manualRows.length === 1) return;
      const newRows = manualRows.filter((_, i) => i !== index);
      setManualRows(newRows);
  }

  const saveManualTrades = () => {
      const cleanTrades: Trade[] = manualRows.map(t => ({
        id: crypto.randomUUID(),
        symbol: t.symbol || 'UNKNOWN',
        type: t.type || TradeType.BUY,
        entryPrice: Number(t.entryPrice) || 0,
        exitPrice: Number(t.exitPrice) || 0,
        sl: Number(t.sl) || 0,
        tp: Number(t.tp) || 0,
        pips: Number(t.pips) || 0,
        lotSize: Number(t.lotSize) || 0.01,
        pnl: Number(t.pnl) || 0,
        date: new Date().toISOString(),
        status: (Number(t.pnl) || 0) > 0 ? 'WIN' : 'LOSS'
      }));
      onAddTrades(cleanTrades);
      setManualRows([{ symbol: 'XAUUSD', type: TradeType.BUY, entryPrice: 0, exitPrice: 0, sl: 0, tp: 0, pips: 0, pnl: 0, lotSize: 0.01 }]);
      alert('Trades saved successfully!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex border-b border-slate-700 bg-slate-800 rounded-t-xl overflow-hidden">
          <button 
             onClick={() => setActiveTab('manual')}
             className={`flex-1 p-4 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            <span className="material-icons">grid_on</span>
            Manual Entry
          </button>
          <button 
            onClick={() => setActiveTab('ai-import')}
            className={`flex-1 p-4 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'ai-import' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            <span className="material-icons">smart_toy</span>
            AI Import Center
          </button>
          <button 
            onClick={() => setActiveTab('capital')}
            className={`flex-1 p-4 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'capital' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            <span className="material-icons">account_balance</span>
            Capital & Goals
          </button>
        </div>

      <div className="bg-slate-800 rounded-b-xl border border-slate-700 border-t-0 overflow-hidden shadow-2xl">
        <div className="p-6">
            {activeTab === 'capital' && (
                <CapitalManager 
                    transactions={transactions} 
                    onAddTransaction={(t) => onAddTransactions([t])} 
                    settings={settings} 
                    onUpdateSettings={onUpdateSettings} 
                    currentPnL={currentPnL} 
                />
            )}

            {activeTab === 'manual' && (
                <div className="space-y-4">
                    <div className="overflow-x-auto border border-slate-700 rounded-lg">
                        <table className="w-full text-left text-sm text-slate-300 whitespace-nowrap">
                            <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                                <tr>
                                    <th className="p-3 min-w-[100px]">Pair (Symbol)</th>
                                    <th className="p-3 min-w-[100px]">Type</th>
                                    <th className="p-3 min-w-[100px]">Entry Price</th>
                                    <th className="p-3 min-w-[100px]">Exit Price</th>
                                    <th className="p-3 min-w-[100px]">Stop Loss</th>
                                    <th className="p-3 min-w-[100px]">Take Profit</th>
                                    <th className="p-3 min-w-[80px]">Pips</th>
                                    <th className="p-3 min-w-[100px]">Profit ($)</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700 bg-slate-800">
                                {manualRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
                                        <td className="p-2">
                                            <input 
                                                type="text" 
                                                value={row.symbol} 
                                                onChange={(e) => updateRow(idx, 'symbol', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1"
                                                placeholder="XAUUSD"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select 
                                                value={row.type}
                                                onChange={(e) => updateRow(idx, 'type', e.target.value)}
                                                className={`w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 ${row.type === TradeType.BUY ? 'text-emerald-400' : 'text-rose-400'}`}
                                            >
                                                <option value="BUY">BUY</option>
                                                <option value="SELL">SELL</option>
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input type="number" value={row.entryPrice} onChange={(e) => updateRow(idx, 'entryPrice', e.target.value)} className="w-full bg-slate-900/50 rounded border-none focus:ring-1 focus:ring-indigo-500 px-2 py-1" />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" value={row.exitPrice} onChange={(e) => updateRow(idx, 'exitPrice', e.target.value)} className="w-full bg-slate-900/50 rounded border-none focus:ring-1 focus:ring-indigo-500 px-2 py-1" />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" value={row.sl} onChange={(e) => updateRow(idx, 'sl', e.target.value)} className="w-full bg-slate-900/50 rounded border-none focus:ring-1 focus:ring-indigo-500 px-2 py-1 text-rose-400" />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" value={row.tp} onChange={(e) => updateRow(idx, 'tp', e.target.value)} className="w-full bg-slate-900/50 rounded border-none focus:ring-1 focus:ring-indigo-500 px-2 py-1 text-emerald-400" />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" value={row.pips} onChange={(e) => updateRow(idx, 'pips', e.target.value)} className="w-full bg-slate-900/50 rounded border-none focus:ring-1 focus:ring-indigo-500 px-2 py-1 font-mono text-indigo-300" />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" value={row.pnl} onChange={(e) => updateRow(idx, 'pnl', e.target.value)} className={`w-full bg-slate-900/50 rounded border-none focus:ring-1 focus:ring-indigo-500 px-2 py-1 font-bold ${Number(row.pnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => removeRow(idx)} className="text-slate-500 hover:text-rose-500">
                                                <span className="material-icons text-sm">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                            <span className="material-icons text-sm">add</span> Add Row
                        </button>
                        <button onClick={saveManualTrades} className="ml-auto flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 transition-transform active:scale-[0.98]">
                            <span className="material-icons text-sm">save</span> Save Trades
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'ai-import' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Image Upload */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-icons text-indigo-400">image</span>
                                <h3 className="text-lg font-semibold text-slate-200">Chart / Screenshot</h3>
                            </div>
                            <p className="text-sm text-slate-400 mb-4">Upload MT4/MT5 history, charts or Withdrawal Screenshots. Gemini will extract everything.</p>
                            <label className="block w-full cursor-pointer bg-slate-800 border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-lg p-8 text-center transition-all group">
                                <span className="material-icons text-4xl text-slate-500 group-hover:text-indigo-400 mb-2 block">cloud_upload</span>
                                <span className="text-slate-300 font-medium">Click to Upload Image</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                        </div>

                        {/* Text/CSV Upload */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-icons text-emerald-400">description</span>
                                <h3 className="text-lg font-semibold text-slate-200">CSV / Text Data</h3>
                            </div>
                             <p className="text-sm text-slate-400 mb-4">Upload a broker CSV file or paste raw history text.</p>
                            
                            <div className="flex gap-2 mb-4">
                                <label className="flex-1 cursor-pointer bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-center font-medium text-sm transition-colors flex items-center justify-center gap-2">
                                     <span className="material-icons text-sm">upload_file</span> Upload CSV
                                     <input type="file" accept=".csv,.txt" onChange={handleCsvUpload} className="hidden" />
                                </label>
                            </div>

                            <div className="relative">
                                <textarea 
                                    className="w-full h-24 bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Or paste text here: XAUUSD Buy 2000.00 or Withdrawal $500..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                                <button 
                                    onClick={handleTextImport}
                                    disabled={loading || !inputText}
                                    className="absolute bottom-3 right-3 bg-slate-600 hover:bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                                >
                                    Parse
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-8">
                             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-3"></div>
                             <span className="text-indigo-400 font-medium animate-pulse">Gemini is analyzing your data...</span>
                        </div>
                    )}

                    {/* Preview Section */}
                    {(previewTrades.length > 0 || previewTransactions.length > 0) && (
                        <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 shadow-xl">
                            <h4 className="text-emerald-400 font-medium mb-4 flex items-center gap-2">
                                <span className="material-icons">check_circle</span>
                                Found Data
                            </h4>
                            
                            {/* Trade Table */}
                            {previewTrades.length > 0 && (
                                <div className="overflow-x-auto mb-4 rounded-lg border border-slate-800">
                                    <h5 className="p-2 bg-slate-800 text-xs text-slate-400 uppercase">Trades</h5>
                                    <table className="w-full text-left text-sm text-slate-300">
                                        <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                                            <tr>
                                                <th className="p-3">Symbol</th>
                                                <th className="p-3">Type</th>
                                                <th className="p-3">PnL</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {previewTrades.map((t, idx) => (
                                                <tr key={idx} className="hover:bg-slate-800/50">
                                                    <td className="p-3 font-bold">{t.symbol}</td>
                                                    <td className={`p-3 font-bold ${t.type?.toString().toUpperCase() === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.type}</td>
                                                    <td className={`p-3 font-mono ${Number(t.pnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{t.pnl}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Transaction Table */}
                            {previewTransactions.length > 0 && (
                                <div className="overflow-x-auto mb-4 rounded-lg border border-slate-800">
                                    <h5 className="p-2 bg-slate-800 text-xs text-slate-400 uppercase">Transactions</h5>
                                    <table className="w-full text-left text-sm text-slate-300">
                                        <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                                            <tr>
                                                <th className="p-3">Type</th>
                                                <th className="p-3">Amount</th>
                                                <th className="p-3">Note</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {previewTransactions.map((t, idx) => (
                                                <tr key={idx} className="hover:bg-slate-800/50">
                                                    <td className="p-3 font-bold text-amber-400">{t.type}</td>
                                                    <td className="p-3 font-mono">${t.amount}</td>
                                                    <td className="p-3 text-slate-400">{t.note || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <button 
                                onClick={confirmImport}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-lg font-bold transition-all active:scale-[0.99] shadow-lg shadow-emerald-500/20"
                            >
                                Confirm & Add to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OperationsView;
