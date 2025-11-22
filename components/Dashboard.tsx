
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line, Treemap, ScatterChart, Scatter } from 'recharts';
import { Trade, TradeMetrics, Transaction, UserSettings } from '../types';

interface DashboardProps {
  trades: Trade[];
  transactions: Transaction[];
  settings: UserSettings;
}

// Custom Content for Treemap
const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, colors, name, value } = props;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth < 2 ? colors[Math.floor((index / root.children.length) * 6)] : 'none',
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {depth === 1 ? (
        <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={14} fontWeight="bold">
          {name}
        </text>
      ) : null}
    </g>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ trades, transactions, settings }) => {
  
  // --- Metrics Calculation ---
  const metrics = useMemo<TradeMetrics>(() => {
      const wins = trades.filter(t => t.pnl > 0);
      const losses = trades.filter(t => t.pnl <= 0);
      const totalDeposits = transactions.filter(t => t.type === 'DEPOSIT').reduce((acc, t) => acc + t.amount, 0);
      const totalWithdrawals = transactions.filter(t => t.type === 'WITHDRAWAL').reduce((acc, t) => acc + t.amount, 0);
      const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
      
      // Sort for DD
      let runningPnL = 0;
      let maxPk = -Infinity;
      let maxDD = 0;
      const timeSorted = [...trades].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      timeSorted.forEach(t => {
        runningPnL += t.pnl;
        if (runningPnL > maxPk) maxPk = runningPnL;
        const dd = maxPk - runningPnL;
        if (dd > maxDD) maxDD = dd;
      });

      return {
        totalTrades: trades.length,
        winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
        totalPnL,
        totalPips: trades.reduce((acc, t) => acc + (t.pips || 0), 0),
        profitFactor: 0, 
        averageWin: wins.length ? wins.reduce((acc,t) => acc + t.pnl, 0) / wins.length : 0,
        averageLoss: losses.length ? Math.abs(losses.reduce((acc,t) => acc + t.pnl, 0)) / losses.length : 0,
        maxDrawdown: maxDD,
        bestTrade: Math.max(...trades.map(t => t.pnl), 0),
        worstTrade: Math.min(...trades.map(t => t.pnl), 0),
        roi: totalDeposits > 0 ? (totalPnL / totalDeposits) * 100 : 0,
        currentBalance: (totalDeposits - totalWithdrawals) + totalPnL
      };
  }, [trades, transactions]);

  // --- Alerts Logic ---
  const alerts = useMemo(() => {
      const activeAlerts = [];
      const today = new Date().toDateString();
      const todaysTrades = trades.filter(t => new Date(t.date).toDateString() === today);
      const dailyLoss = todaysTrades.reduce((acc, t) => t.pnl < 0 ? acc + t.pnl : acc, 0);

      if (settings.dailyTradeLimit > 0 && todaysTrades.length >= settings.dailyTradeLimit) {
          activeAlerts.push({ type: 'danger', message: `DAILY LIMIT REACHED: ${todaysTrades.length} trades taken.` });
      }
      if (settings.dailyLossLimit > 0 && Math.abs(dailyLoss) >= settings.dailyLossLimit) {
           activeAlerts.push({ type: 'danger', message: `DAILY LOSS LIMIT HIT: Loss of $${Math.abs(dailyLoss).toFixed(2)} exceeds limit.` });
      }
      if (settings.maxDrawdownLimit > 0 && metrics.maxDrawdown >= settings.maxDrawdownLimit) {
           activeAlerts.push({ type: 'danger', message: `MAX DRAWDOWN WARNING: Drawdown of $${metrics.maxDrawdown.toFixed(2)} detected.` });
      }

      return activeAlerts;
  }, [trades, settings, metrics.maxDrawdown]);

  // --- Chart Data ---
  const chartData = useMemo(() => {
      let equity = 0;
      let pips = 0;
      return trades.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((t, i) => {
          equity += t.pnl;
          pips += (t.pips || 0);
          return {
              name: i + 1,
              equity,
              pips,
              tradePnl: t.pnl
          };
      });
  }, [trades]);
  
  // --- Losing Trades Analysis ---
  const losingTrades = useMemo(() => trades.filter(t => t.pnl < 0).sort((a,b) => a.pnl - b.pnl), [trades]);
  const lossChartData = useMemo(() => losingTrades.map((t, i) => ({ name: i+1, loss: Math.abs(t.pnl) })), [losingTrades]);

  // --- Heatmap Data ---
  const heatmapData = useMemo(() => {
      const map: Record<string, number> = {};
      trades.forEach(t => {
          const sym = t.symbol || "Unknown";
          map[sym] = (map[sym] || 0) + Math.abs(t.pnl) + 10;
      });
      return Object.keys(map).map(k => ({ name: k, size: map[k] }));
  }, [trades]);

  const COLORS = ['#fbbf24', '#818cf8', '#34d399', '#f43f5e', '#a78bfa', '#60a5fa'];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Alerts Section */}
      {alerts.length > 0 && (
          <div className="space-y-2">
              {alerts.map((alert, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-rose-500/50 bg-rose-950/50 text-rose-200 flex items-center gap-3 shadow-lg animate-pulse">
                      <span className="material-icons text-2xl">gpp_bad</span>
                      <div className="font-bold">{alert.message}</div>
                  </div>
              ))}
          </div>
      )}

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-10"><span className="material-icons text-6xl text-emerald-500">payments</span></div>
               <h3 className="text-slate-400 text-xs font-bold uppercase">Current Balance</h3>
               <p className="text-2xl font-bold text-slate-100 mt-1">${metrics.currentBalance.toFixed(2)}</p>
           </div>
           <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800">
               <h3 className="text-slate-400 text-xs font-bold uppercase">ROI</h3>
               <p className={`text-2xl font-bold mt-1 ${metrics.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{metrics.roi.toFixed(1)}%</p>
           </div>
           <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800">
               <h3 className="text-slate-400 text-xs font-bold uppercase">Win Rate</h3>
               <p className="text-2xl font-bold text-amber-400 mt-1">{metrics.winRate.toFixed(1)}%</p>
           </div>
           <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800">
               <h3 className="text-slate-400 text-xs font-bold uppercase">Max Drawdown</h3>
               <p className="text-2xl font-bold mt-1 text-rose-400">
                 ${metrics.maxDrawdown.toFixed(2)}
               </p>
           </div>
      </div>

      {/* Loss Analytics Section (New) */}
      <div className="bg-rose-950/10 p-6 rounded-xl border border-rose-900/50 shadow-lg">
          <h3 className="text-lg font-semibold text-rose-200 mb-4 flex items-center gap-2">
              <span className="material-icons text-rose-500">trending_down</span>
              Loss Analytics
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Loss Distribution */}
             <div className="h-[250px] bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                  <h4 className="text-xs text-slate-400 uppercase mb-2">Trading Loss Magnitude</h4>
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lossChartData}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                           <XAxis dataKey="name" hide />
                           <YAxis stroke="#94a3b8" />
                           <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#f43f5e' }} />
                           <Bar dataKey="loss" fill="#f43f5e" />
                      </BarChart>
                  </ResponsiveContainer>
             </div>

             {/* Drawdown List (Worst Trades) */}
             <div className="lg:col-span-2 bg-slate-900/50 rounded-lg p-4 border border-slate-800 overflow-hidden flex flex-col">
                  <h4 className="text-xs text-slate-400 uppercase mb-2">Worst Losing Trades (Review Required)</h4>
                  <div className="overflow-y-auto flex-1">
                      <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-slate-800 text-slate-500 text-xs uppercase sticky top-0">
                              <tr>
                                  <th className="p-2">Symbol</th>
                                  <th className="p-2">Type</th>
                                  <th className="p-2">Loss ($)</th>
                                  <th className="p-2">Pips</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                              {losingTrades.slice(0, 5).map((t, i) => (
                                  <tr key={i} className="hover:bg-rose-900/20">
                                      <td className="p-2 font-bold">{t.symbol}</td>
                                      <td className="p-2 text-rose-400">{t.type}</td>
                                      <td className="p-2 font-bold text-rose-500">${t.pnl.toFixed(2)}</td>
                                      <td className="p-2 text-slate-400">{t.pips}</td>
                                  </tr>
                              ))}
                              {losingTrades.length === 0 && (
                                  <tr><td colSpan={4} className="p-4 text-center text-slate-500">No losses recorded. Excellent!</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
             </div>
          </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Pips Timeline */}
          <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-amber-100 flex items-center gap-2">
                      <span className="material-icons text-amber-500">timeline</span>
                      PIPs Growth
                  </h3>
              </div>
              <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="name" hide />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#fbbf24' }} />
                          <Line type="monotone" dataKey="pips" stroke="#fbbf24" strokeWidth={3} dot={false} />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Equity Curve */}
          <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-lg">
               <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="material-icons text-emerald-400">show_chart</span>
                  Equity Curve
              </h3>
              <div className="h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                        <linearGradient id="colorEq" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#34d399' }} />
                        <Area type="monotone" dataKey="equity" stroke="#34d399" fillOpacity={1} fill="url(#colorEq)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
