
import React, { useState, useMemo } from 'react';
import { Transaction, UserSettings } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface CapitalManagerProps {
    transactions: Transaction[];
    onAddTransaction: (t: Transaction) => void;
    settings: UserSettings;
    onUpdateSettings: (s: UserSettings) => void;
    currentPnL: number;
}

const CapitalManager: React.FC<CapitalManagerProps> = ({ transactions, onAddTransaction, settings, onUpdateSettings, currentPnL }) => {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
    const [note, setNote] = useState('');
    
    // Projection State
    const [investAmount, setInvestAmount] = useState(1000);
    const [investRate, setInvestRate] = useState(5); // Monthly %
    const [investMonths, setInvestMonths] = useState(12);

    const stats = useMemo(() => {
        const deposits = transactions.filter(t => t.type === 'DEPOSIT').reduce((acc, t) => acc + t.amount, 0);
        const withdrawals = transactions.filter(t => t.type === 'WITHDRAWAL').reduce((acc, t) => acc + t.amount, 0);
        const netCapital = deposits - withdrawals;
        const currentBalance = netCapital + currentPnL;
        const roi = deposits > 0 ? (currentPnL / deposits) * 100 : 0;
        const savingsProgress = settings.savingsGoal > 0 ? Math.min((currentBalance / settings.savingsGoal) * 100, 100) : 0;

        return { deposits, withdrawals, netCapital, currentBalance, roi, savingsProgress };
    }, [transactions, currentPnL, settings.savingsGoal]);

    const projectionData = useMemo(() => {
        const data = [];
        let balance = investAmount;
        for (let i = 0; i <= investMonths; i++) {
            data.push({ month: i, balance: Math.round(balance) });
            balance = balance * (1 + investRate / 100);
        }
        return data;
    }, [investAmount, investRate, investMonths]);

    const handleSubmit = () => {
        if (!amount) return;
        onAddTransaction({
            id: crypto.randomUUID(),
            type,
            amount: Number(amount),
            date: new Date().toISOString(),
            note
        });
        setAmount('');
        setNote('');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-lg">
                    <h3 className="text-slate-400 text-xs font-bold uppercase">Total Deposits</h3>
                    <p className="text-2xl font-bold text-emerald-400 mt-2">${stats.deposits.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-lg">
                    <h3 className="text-slate-400 text-xs font-bold uppercase">Total Withdrawals</h3>
                    <p className="text-2xl font-bold text-rose-400 mt-2">${stats.withdrawals.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-lg">
                    <h3 className="text-slate-400 text-xs font-bold uppercase">Current Balance</h3>
                    <p className="text-2xl font-bold text-indigo-400 mt-2">${stats.currentBalance.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-lg">
                    <h3 className="text-slate-400 text-xs font-bold uppercase">ROI (Net P&L / Dep)</h3>
                    <p className={`text-2xl font-bold mt-2 ${stats.roi >= 0 ? 'text-amber-400' : 'text-rose-500'}`}>{stats.roi.toFixed(2)}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Transaction Form */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-icons text-amber-400">account_balance_wallet</span>
                        Capital Management
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setType('DEPOSIT')}
                                className={`p-3 rounded-lg font-medium border transition-all ${type === 'DEPOSIT' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                            >
                                Deposit
                            </button>
                            <button 
                                onClick={() => setType('WITHDRAWAL')}
                                className={`p-3 rounded-lg font-medium border transition-all ${type === 'WITHDRAWAL' ? 'bg-rose-900/50 border-rose-500 text-rose-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                            >
                                Withdrawal
                            </button>
                        </div>
                        <input 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            placeholder="Amount ($)" 
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <input 
                            type="text" 
                            value={note} 
                            onChange={(e) => setNote(e.target.value)} 
                            placeholder="Note (e.g., Monthly savings)" 
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button 
                            onClick={handleSubmit} 
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            Submit Transaction
                        </button>
                    </div>
                </div>

                {/* Savings Goal & Settings */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-icons text-indigo-400">savings</span>
                        Savings & Goals
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm text-slate-400 mb-2">
                                <span>Progress to ${settings.savingsGoal.toLocaleString()}</span>
                                <span>{stats.savingsProgress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                                    style={{ width: `${stats.savingsProgress}%` }}
                                ></div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Target Goal ($)</label>
                                <input 
                                    type="number" 
                                    value={settings.savingsGoal} 
                                    onChange={(e) => onUpdateSettings({...settings, savingsGoal: Number(e.target.value)})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 mt-1 text-white"
                                />
                            </div>
                             <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Daily Loss Limit ($)</label>
                                <input 
                                    type="number" 
                                    value={settings.dailyLossLimit} 
                                    onChange={(e) => onUpdateSettings({...settings, dailyLossLimit: Number(e.target.value)})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 mt-1 text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Projection */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-icons text-emerald-400">trending_up</span>
                    "If You Invested..." Simulator
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-400">Initial Amount ($)</label>
                            <input type="number" value={investAmount} onChange={(e) => setInvestAmount(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="text-sm text-slate-400">Monthly Return (%)</label>
                            <input type="number" value={investRate} onChange={(e) => setInvestRate(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="text-sm text-slate-400">Duration (Months)</label>
                            <input type="number" value={investMonths} onChange={(e) => setInvestMonths(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                        </div>
                        <div className="p-4 bg-slate-900 rounded border border-slate-600">
                            <span className="text-slate-400 block text-xs uppercase">Projected Total</span>
                            <span className="text-2xl font-bold text-emerald-400">${projectionData[projectionData.length - 1].balance.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-2 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={projectionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="month" stroke="#94a3b8" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                                <Line type="monotone" dataKey="balance" stroke="#34d399" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CapitalManager;
