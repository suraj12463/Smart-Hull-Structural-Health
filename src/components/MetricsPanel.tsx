import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Droplets, Shield, Thermometer, Waves, Wind, ArrowDown, ArrowUp, Gauge, CloudRain, Zap, Radio } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface MetricsPanelProps {
  depth: number;
  verticalSpeed: number;
  pressure: number;
  integrity: number;
  corrosion: number;
  temperature: number;
  internalTemp: number;
  internalPressure: number;
  oxygenLevel: number;
  humidity: number;
  waterDensity: number;
  soundVelocity: number;
  hullStress: number;
  cathodicProtection: number;
  galvanicPotential: number;
  seaState: number;
  salinity: number;
  history: { time: string; pressure: number; depth: number; temp: number }[];
}

export function MetricsPanel({ 
  depth, 
  verticalSpeed,
  pressure, 
  integrity, 
  corrosion, 
  temperature, 
  internalTemp,
  internalPressure,
  oxygenLevel,
  humidity,
  waterDensity,
  soundVelocity,
  hullStress,
  cathodicProtection,
  galvanicPotential,
  seaState, 
  salinity, 
  history 
}: MetricsPanelProps) {
  const stats = [
    { label: "Current Depth", value: `${depth.toFixed(1)} m`, icon: Droplets, color: "text-cyan-400" },
    { label: "Vertical Speed", value: `${Math.abs(verticalSpeed).toFixed(2)} m/s`, icon: verticalSpeed >= 0 ? ArrowDown : ArrowUp, color: "text-cyan-400" },
    { label: "Hydro Pressure", value: `${pressure.toFixed(2)} MPa`, icon: Activity, color: pressure > 6.5 ? "text-alert-red" : "text-warn-orange" },
    { label: "Hull Stress (Von Mises)", value: `${hullStress.toFixed(1)} MPa`, icon: Zap, color: hullStress > 550 ? "text-alert-red" : hullStress > 400 ? "text-warn-orange" : "text-safe-green" },
    { label: "Hull Integrity", value: `${integrity.toFixed(1)}%`, icon: Shield, color: integrity < 50 ? "text-alert-red" : "text-safe-green" },
    { label: "Ext. Temperature", value: `${temperature.toFixed(1)} °C`, icon: Thermometer, color: "text-cyan-500" },
    { label: "Water Density", value: `${waterDensity.toFixed(1)} kg/m³`, icon: Droplets, color: "text-cyan-400" },
    { label: "Sound Velocity", value: `${soundVelocity.toFixed(1)} m/s`, icon: Radio, color: "text-cyan-500" },
    { label: "Int. Temperature", value: `${internalTemp.toFixed(1)} °C`, icon: Thermometer, color: internalTemp > 35 || internalTemp < 10 ? "text-alert-red" : "text-safe-green" },
    { label: "Int. Pressure", value: `${internalPressure.toFixed(2)} atm`, icon: Gauge, color: internalPressure > 1.2 || internalPressure < 0.8 ? "text-alert-red" : "text-safe-green" },
    { label: "Oxygen Level", value: `${oxygenLevel.toFixed(1)}%`, icon: Wind, color: oxygenLevel < 19.5 ? "text-alert-red" : "text-safe-green" },
    { label: "Humidity", value: `${humidity.toFixed(1)}%`, icon: CloudRain, color: humidity > 80 ? "text-warn-orange" : "text-cyan-500" },
    { label: "Corrosion Index", value: `${corrosion.toFixed(3)}`, icon: Waves, color: corrosion > 0.5 ? "text-warn-orange" : "text-cyan-400" },
    { label: "Cathodic Protection", value: `${cathodicProtection.toFixed(1)}%`, icon: Shield, color: cathodicProtection < 80 ? "text-alert-red" : "text-safe-green" },
    { label: "Galvanic Potential", value: `${galvanicPotential.toFixed(0)} mV`, icon: Activity, color: galvanicPotential > -750 ? "text-alert-red" : "text-cyan-400" },
    { label: "Sea State", value: `Level ${seaState}`, icon: Wind, color: seaState > 5 ? "text-warn-orange" : "text-cyan-400" },
    { label: "Salinity", value: `${salinity.toFixed(1)} PSU`, icon: Droplets, color: "text-cyan-500" },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="bg-navy-800 border border-navy-700 p-3 rounded-lg flex flex-col gap-2 relative overflow-hidden group hover:border-cyan-500/50 transition-colors"
          >
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate mr-2">{stat.label}</span>
              <stat.icon className={cn("w-3 h-3 shrink-0", stat.color)} />
            </div>
            <div className={cn("text-lg font-mono font-bold tracking-tight", stat.color)}>
              {stat.value}
            </div>
            {/* Decorative bottom bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-navy-700 w-full">
              <div 
                className={cn("h-full transition-all duration-1000", stat.color.replace('text-', 'bg-'))} 
                style={{ width: `${Math.random() * 40 + 60}%` }} 
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Real-time Chart */}
      <div className="flex-1 bg-navy-800 border border-navy-700 rounded-lg p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono text-slate-300 uppercase tracking-wider">Pressure vs Depth Telemetry</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs font-mono text-cyan-500">LIVE</span>
          </div>
        </div>
        
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff9900" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff9900" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2a4f" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}MPa`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}m`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10, 17, 40, 0.9)', borderColor: '#1a2a4f', color: '#e2e8f0', backdropFilter: 'blur(4px)' }}
                itemStyle={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                labelStyle={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#94a3b8' }}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="pressure" 
                stroke="#ff9900" 
                fillOpacity={1} 
                fill="url(#colorPressure)"
                strokeWidth={2} 
                isAnimationActive={false}
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="depth" 
                stroke="#00f0ff" 
                fillOpacity={1} 
                fill="url(#colorDepth)"
                strokeWidth={2} 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
