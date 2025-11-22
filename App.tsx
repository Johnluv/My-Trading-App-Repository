
import React, { useState, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import OperationsView from './components/TradeInput';
import Assistant from './components/Assistant';
import Tools from './components/Tools';
import MarketView from './components/MarketView';
import { Trade, Transaction, UserSettings } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'market' | 'operations' | 'intelligence'>('dashboard');
  
  // Trade Data
  const [trades, setTrades] = useState<Trade[]>([
    { id: '1', symbol: 'XAUUSD', type: 'BUY' as any, entryPrice: 2020, exitPrice: 2030, lotSize: 1, pnl: 1000, pips: 100, date: new Date().toISOString(), status: 'WIN' },
    { id: '2', symbol: 'BTCUSD', type: 'SELL' as any, entryPrice: 35000, exitPrice: 35500, lotSize: 0.1, pnl: -50, pips: -500, date: '2023-10-02', status: 'LOSS' },
    { id: '3', symbol: 'XAUUSD', type: 'BUY' as any, entryPrice: 2025, exitPrice: 2040, lotSize: 1, pnl: 1500, pips: 150, date: '2023-10-03', status: 'WIN' },
  ]);

  // Capital Data
  const [transactions, setTransactions] = useState<Transaction[]>([
      { id: 'init', type: 'DEPOSIT', amount: 5000, date: '2023-01-01', note: 'Initial Capital' }
  ]);

  // Settings
  const [settings, setSettings] = useState<UserSettings>({
      dailyLossLimit: 500,
      dailyTradeLimit: 5,
      maxDrawdownLimit: 2000,
      savingsGoal: 50000,
      currency: 'USD'
  });

  const currentPnL = useMemo(() => trades.reduce((acc, t) => acc + t.pnl, 0), [trades]);
  const currentBalance = useMemo(() => {
      const netTrans = transactions.reduce((acc, t) => t.type === 'DEPOSIT' ? acc + t.amount : acc - t.amount, 0);
      return netTrans + currentPnL;
  }, [transactions, currentPnL]);

  const addTrades = (newTrades: Trade[]) => {
    setTrades(prev => [...prev, ...newTrades]);
    // Don't auto switch view, stay in context
  };

  const addTransaction = (newTransactions: Transaction[]) => {
      setTransactions(prev => [...prev, ...newTransactions]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Custom Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
               <div className="font-black text-3xl tracking-tighter bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 text-transparent bg-clip-text drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Impact, sans-serif' }}>
                   TLG
               </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-6">
                <NavButton label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} icon="dashboard" />
                <NavButton label="Market & Alerts" active={view === 'market'} onClick={() => setView('market')} icon="candlestick_chart" />
                <NavButton label="Journal & Operations" active={view === 'operations'} onClick={() => setView('operations')} icon="history_edu" />
                <NavButton label="AI Intelligence" active={view === 'intelligence'} onClick={() => setView('intelligence')} icon="auto_awesome" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && <Dashboard trades={trades} transactions={transactions} settings={settings} />}
        {view === 'market' && <MarketView />}
        {view === 'operations' && (
            <OperationsView 
                onAddTrades={addTrades} 
                onAddTransactions={addTransaction} 
                transactions={transactions} 
                settings={settings} 
                onUpdateSettings={setSettings} 
                currentPnL={currentPnL} 
            />
        )}
        {view === 'intelligence' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Assistant trades={trades} balance={currentBalance} goals={settings} />
                </div>
                <div>
                    <Tools />
                </div>
            </div>
        )}
      </main>
      
      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 flex justify-around p-2 z-50 pb-6">
           <MobileNavButton icon="dashboard" onClick={() => setView('dashboard')} active={view === 'dashboard'} />
           <MobileNavButton icon="candlestick_chart" onClick={() => setView('market')} active={view === 'market'} />
           <MobileNavButton icon="history_edu" onClick={() => setView('operations')} active={view === 'operations'} />
           <MobileNavButton icon="auto_awesome" onClick={() => setView('intelligence')} active={view === 'intelligence'} />
      </div>

      {/* Material Icons */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    </div>
  );
};

const NavButton = ({ label, active, onClick, icon }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
      active 
      ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-amber-400'
    }`}
  >
    <span className="material-icons text-lg">{icon}</span>
    {label}
  </button>
);

const MobileNavButton = ({ icon, onClick, active }: any) => (
    <button onClick={onClick} className={`p-3 rounded-xl ${active ? 'text-amber-900 bg-amber-500' : 'text-slate-400'}`}>
        <span className="material-icons">{icon}</span>
    </button>
)

export default App;
