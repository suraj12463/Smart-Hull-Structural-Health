import { AlertTriangle, Info, CheckCircle, Clock, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  location: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  integrity: number;
  corrosion: number;
}

export function AlertsPanel({ alerts, integrity, corrosion }: AlertsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-alert-red" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warn-orange" />;
      case 'info': return <Info className="w-4 h-4 text-cyan-400" />;
      default: return <CheckCircle className="w-4 h-4 text-safe-green" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'critical': return "bg-alert-red/10 border-alert-red/30";
      case 'warning': return "bg-warn-orange/10 border-warn-orange/30";
      case 'info': return "bg-cyan-500/10 border-cyan-500/30";
      default: return "bg-navy-800 border-navy-700";
    }
  };

  const getMaintenanceDays = () => {
    if (integrity < 40 || corrosion > 0.8) return "IMMEDIATE";
    if (integrity < 70 || corrosion > 0.5) return "IN 2 DAYS";
    if (integrity < 90 || corrosion > 0.2) return "IN 7 DAYS";
    return "IN 14 DAYS";
  };

  const maintenanceDays = getMaintenanceDays();
  const maintenanceColor = maintenanceDays === "IMMEDIATE" ? "text-alert-red" : (maintenanceDays === "IN 14 DAYS" ? "text-safe-green" : "text-warn-orange");

  const filteredAlerts = alerts.filter(alert => filter === 'all' || alert.type === filter);

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 border-b border-navy-700 pb-2">
        <h3 className="text-sm font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warn-orange" />
          System Diagnostics
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-navy-900 rounded border border-navy-700 p-0.5">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "px-2 py-0.5 text-xs font-mono rounded transition-colors",
                filter === 'all' ? "bg-navy-700 text-white" : "text-slate-400 hover:text-slate-300"
              )}
            >
              ALL
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={cn(
                "px-2 py-0.5 text-xs font-mono rounded transition-colors",
                filter === 'critical' ? "bg-alert-red/20 text-alert-red" : "text-slate-400 hover:text-alert-red"
              )}
            >
              CRIT
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={cn(
                "px-2 py-0.5 text-xs font-mono rounded transition-colors",
                filter === 'warning' ? "bg-warn-orange/20 text-warn-orange" : "text-slate-400 hover:text-warn-orange"
              )}
            >
              WARN
            </button>
            <button
              onClick={() => setFilter('info')}
              className={cn(
                "px-2 py-0.5 text-xs font-mono rounded transition-colors",
                filter === 'info' ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-cyan-400"
              )}
            >
              INFO
            </button>
          </div>
          <span className="bg-navy-900 border border-navy-700 px-2 py-0.5 rounded text-xs font-mono text-slate-400">
            {filteredAlerts.length} EVENTS
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <CheckCircle className="w-8 h-8 text-safe-green opacity-50" />
            <span className="text-sm font-mono uppercase">All Systems Nominal</span>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={cn(
                "p-3 rounded border flex flex-col gap-2 transition-colors",
                getBgColor(alert.type)
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(alert.type)}
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    {alert.type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 text-[10px] font-mono">
                  <Clock className="w-3 h-3" />
                  {alert.timestamp}
                </div>
              </div>
              
              <p className="text-sm text-slate-300 leading-snug">
                {alert.message}
              </p>
              
              <div className="flex justify-end">
                <span className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-wider bg-navy-900 px-2 py-0.5 rounded border border-navy-700">
                  LOC: {alert.location}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-navy-700">
        <div className="bg-navy-900 rounded p-3 border border-navy-700 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400">PREDICTIVE MAINTENANCE</div>
          <div className={`text-xs font-mono font-bold ${maintenanceColor}`}>{maintenanceDays}</div>
        </div>
      </div>
    </div>
  );
}
