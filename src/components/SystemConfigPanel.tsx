import { Settings, Sliders, Database, Cpu, Network } from 'lucide-react';
import { motion } from 'motion/react';

export function SystemConfigPanel() {
  const configs = [
    { label: "AI Diagnostic Engine", status: "ONLINE", icon: Cpu, color: "text-cyan-400" },
    { label: "Telemetry Data Stream", status: "STABLE", icon: Network, color: "text-safe-green" },
    { label: "Historical DB Sync", status: "SYNCED", icon: Database, color: "text-cyan-400" },
    { label: "Predictive Model", status: "v2.1.4-beta", icon: Sliders, color: "text-warn-orange" },
  ];

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6 border-b border-navy-700 pb-4">
        <h3 className="text-lg font-mono text-slate-200 uppercase tracking-widest flex items-center gap-3">
          <Settings className="w-5 h-5 text-cyan-400" />
          System Configuration
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {configs.map((config, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-navy-900 border border-navy-700 p-4 rounded-lg flex flex-col justify-center gap-2"
          >
            <div className="flex items-center gap-2 mb-2">
              <config.icon className={`w-4 h-4 ${config.color}`} />
              <span className="text-xs font-mono text-slate-400 uppercase">{config.label}</span>
            </div>
            <div className={`text-lg font-mono font-bold ${config.color}`}>
              {config.status}
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-4 flex justify-end">
        <button className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 px-4 py-2 rounded font-mono text-xs hover:bg-cyan-500/20 transition-colors">
          RUN FULL DIAGNOSTIC
        </button>
      </div>
    </div>
  );
}
