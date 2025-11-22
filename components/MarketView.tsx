
import React, { useEffect, useRef, useState } from 'react';
import { MarketAlert } from '../types';

const MarketView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [newAlertSymbol, setNewAlertSymbol] = useState('XAUUSD');
  const [newAlertCondition, setNewAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  // --- TradingView Widget Setup ---
  useEffect(() => {
    if (!containerRef.current) return;
    
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": "OANDA:XAUUSD",
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "light", // White Background as requested
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "withdateranges": true,
      "hide_side_toolbar": false,
      "allow_symbol_change": true,
      "details": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "overrides": {
        // Custom Candle Colors: Green (Bullish) & Black (Bearish)
        "mainSeriesProperties.candleStyle.upColor": "#22c55e",     // Green
        "mainSeriesProperties.candleStyle.downColor": "#000000",   // Black
        "mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
        "mainSeriesProperties.candleStyle.borderDownColor": "#000000",
        "mainSeriesProperties.candleStyle.wickUpColor": "#22c55e",
        "mainSeriesProperties.candleStyle.wickDownColor": "#000000",
        "paneProperties.background": "#ffffff",
        "paneProperties.vertGridProperties.color": "#e2e8f0",
        "paneProperties.horzGridProperties.color": "#e2e8f0",
      }
    });

    const widgetContainer = document.createElement('div');
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";
    
    containerRef.current.appendChild(widgetContainer);
    containerRef.current.appendChild(script);
  }, []);

  // --- Alert Handlers ---
  const handleAddAlert = () => {
      if (!newAlertPrice) return;
      const alert: MarketAlert = {
          id: crypto.randomUUID(),
          symbol: newAlertSymbol.toUpperCase(),
          price: Number(newAlertPrice),
          condition: newAlertCondition,
          active: true,
          createdAt: Date.now()
      };
      setAlerts([...alerts, alert]);
      setNewAlertPrice('');
      // Simulate a notification for confirmation
      alertUser(`Alert set for ${alert.symbol} ${alert.condition} ${alert.price}`);
  };

  const alertUser = (msg: string) => {
      // In a real app, this would call the backend email/sms service
      console.log(`Sending SMS to +233554165325: ${msg}`);
      console.log(`Sending Email to johnetwi@gmail.com: ${msg}`);
  };

  const deleteAlert = (id: string) => {
      setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 animate-fade-in">
       
       {/* Chart Area */}
       <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xl relative">
          <div className="tradingview-widget-container h-full w-full" ref={containerRef}>
              <div className="tradingview-widget-container__widget h-full w-full"></div>
          </div>
       </div>

       {/* Alert Manager Sidebar */}
       <div className="w-full lg:w-80 bg-slate-900 rounded-xl border border-slate-700 flex flex-col shadow-xl">
            <div className="p-5 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="material-icons text-amber-400">notifications_active</span>
                    Alert Manager
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                    Notifications enabled for:
                </p>
                <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 p-1.5 rounded">
                        <span className="material-icons text-[14px]">email</span>
                        johnetwi@gmail.com
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 p-1.5 rounded">
                        <span className="material-icons text-[14px]">smartphone</span>
                        +233554165325
                    </div>
                </div>
            </div>

            <div className="p-5 border-b border-slate-800 bg-slate-800/50">
                <h4 className="text-sm font-bold text-slate-300 mb-3">New Price Alert</h4>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-500 uppercase">Symbol</label>
                        <input 
                            type="text" 
                            value={newAlertSymbol} 
                            onChange={(e) => setNewAlertSymbol(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase">Condition</label>
                        <select 
                            value={newAlertCondition} 
                            onChange={(e) => setNewAlertCondition(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
                        >
                            <option value="ABOVE">Price Goes Above</option>
                            <option value="BELOW">Price Goes Below</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase">Price Level</label>
                        <input 
                            type="number" 
                            value={newAlertPrice} 
                            onChange={(e) => setNewAlertPrice(e.target.value)} 
                            placeholder="e.g. 2050.50"
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
                        />
                    </div>
                    <button 
                        onClick={handleAddAlert}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-icons text-sm">add_alert</span>
                        Set Alert
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Active Alerts ({alerts.length})</h4>
                <div className="space-y-2">
                    {alerts.length === 0 ? (
                        <div className="text-center py-8 text-slate-600 text-sm italic">
                            No alerts active.
                        </div>
                    ) : (
                        alerts.map(alert => (
                            <div key={alert.id} className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center group hover:border-amber-500/50 transition-colors">
                                <div>
                                    <div className="font-bold text-white text-sm">{alert.symbol}</div>
                                    <div className="text-xs text-slate-400">
                                        {alert.condition === 'ABOVE' ? '>' : '<'} <span className="text-amber-400">{alert.price}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => deleteAlert(alert.id)}
                                    className="text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <span className="material-icons text-sm">delete</span>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
       </div>
    </div>
  );
};

export default MarketView;
