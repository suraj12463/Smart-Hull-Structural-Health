import { Bell, Search, User, ShieldAlert, Clock } from "lucide-react";
import { useState, useEffect } from "react";

export function TopBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  };

  return (
    <header className="h-16 bg-navy-800 border-b border-navy-700 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-alert-red/10 border border-alert-red/50 px-3 py-1 rounded-sm">
          <ShieldAlert className="w-4 h-4 text-alert-red" />
          <span className="text-xs font-mono font-bold text-alert-red tracking-widest">TOP SECRET // NOFORN</span>
        </div>
        <div className="h-6 w-px bg-navy-700 mx-2" />
        <div className="text-sm font-mono text-slate-400">
          <span className="text-cyan-500">VESSEL:</span> INS-KHANDERI (S22)
        </div>
        <div className="h-4 w-px bg-navy-700" />
        <div className="text-sm font-mono text-slate-400">
          <span className="text-cyan-500">CLASS:</span> KALVARI
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm bg-navy-900 border border-cyan-500/30 px-3 py-1.5 rounded-md">
          <Clock className="w-4 h-4" />
          {formatTime(time)}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search telemetry..." 
            className="bg-navy-900 border border-navy-700 rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200 font-mono w-64"
          />
        </div>
        
        <button className="relative text-slate-400 hover:text-cyan-400 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-alert-red rounded-full animate-pulse" />
        </button>
        
        <div className="flex items-center gap-2 border-l border-navy-700 pl-6">
          <div className="w-8 h-8 rounded bg-navy-700 flex items-center justify-center text-cyan-500 border border-cyan-500/30">
            <User className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-200">CMDR. RAO</div>
            <div className="text-slate-500 font-mono">AUTH: L4</div>
          </div>
        </div>
      </div>
    </header>
  );
}
