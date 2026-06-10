import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { X, Cpu, Wrench } from "lucide-react";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const getRecommendedAction = (alert: any) => {
  if (alert.id === 'crit-int') {
    return "Initiate emergency blow to surface immediately. Isolate affected compartments and deploy damage control teams.";
  }
  if (alert.id === 'warn-corr') {
    return "Schedule ROV inspection of affected coating at next safe opportunity. Adjust cathodic protection system output to compensate for localized degradation.";
  }
  if (alert.id === 'warn-int') {
    return "Decrease depth by 150m and reduce speed to 10 knots. Monitor acoustic emissions for further fracture propagation.";
  }
  return "Log for routine maintenance review. No immediate action required.";
};

const getShortAction = (alert: any) => {
  if (alert.id === 'crit-int') return "EMERGENCY SURFACE";
  if (alert.id === 'warn-corr') return "SCHEDULE ROV INSP";
  if (alert.id === 'warn-int') return "DECREASE DEPTH";
  return "LOG MAINTENANCE";
};

const getZoneForAlert = (alert: any) => {
  if (!alert || !alert.location) return null;
  const loc = alert.location.toUpperCase();
  if (loc.includes('AFT')) return 'aft';
  if (loc.includes('BOW')) return 'bow';
  if (loc.includes('SAIL')) return 'sail';
  return 'midship';
};

const getCorrosionAnalysis = (intensity: number) => {
  if (intensity > 75) {
    return { 
      type: "Galvanic Corrosion", 
      degradation: "Severe pitting detected. Substrate exposed. 45% localized thickness reduction.", 
      action: "Immediate recoating required." 
    };
  }
  if (intensity > 45) {
    return { 
      type: "Crevice Corrosion", 
      degradation: "Moderate delamination of anechoic tiles. 15% thickness reduction.", 
      action: "Schedule inspection." 
    };
  }
  return { 
    type: "Uniform Surface Rust", 
    degradation: "Superficial oxidation. Coating integrity largely maintained.", 
    action: "Monitor." 
  };
};

interface HullVisualizerProps {
  stressLevel: number; // 0 to 100
  isSimulating: boolean;
  alerts?: any[];
  activeTab?: string;
  corrosion?: number;
  history?: { time: string; pressure: number; depth: number; temp: number }[];
}

export function HullVisualizer({ stressLevel, isSimulating, alerts = [], activeTab = "Live Telemetry", corrosion = 0, history = [] }: HullVisualizerProps) {
  // Generate random stress points that intensify with stressLevel
  const [points, setPoints] = useState<{ x: number; y: number; intensity: number }[]>([]);
  const [corrosionPoints, setCorrosionPoints] = useState<{ x: number; y: number; baseIntensity: number; intensity: number }[]>([]);
  const [acousticPoints, setAcousticPoints] = useState<{ x: number; y: number; intensity: number }[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [stressHeatmapOpacity, setStressHeatmapOpacity] = useState<number>(100);
  const [showAcoustic, setShowAcoustic] = useState<boolean>(true);
  const [hoveredCorrosionPoint, setHoveredCorrosionPoint] = useState<{ x: number; y: number; intensity: number } | null>(null);
  const [selectedCorrosionPoint, setSelectedCorrosionPoint] = useState<{ x: number; y: number; intensity: number } | null>(null);
  const [sensors, setSensors] = useState<{ id: string; x: number; y: number; status: 'nominal' | 'warning' | 'offline' }[]>([
    { id: 'S-AFT-1', x: 20, y: 50, status: 'nominal' },
    { id: 'S-AFT-2', x: 30, y: 30, status: 'nominal' },
    { id: 'S-MID-1', x: 45, y: 70, status: 'nominal' },
    { id: 'S-MID-2', x: 55, y: 40, status: 'nominal' },
    { id: 'S-BOW-1', x: 75, y: 60, status: 'nominal' },
    { id: 'S-BOW-2', x: 85, y: 45, status: 'nominal' },
    { id: 'S-SAIL-1', x: 48, y: 15, status: 'nominal' },
  ]);
  const [corrosionHistory, setCorrosionHistory] = useState<{ time: string; corrosionTrend: number }[]>([]);

  const hullZones = [
    {
      id: 'aft',
      name: 'Aft Section',
      type: 'rect',
      x: 100, y: 50, width: 250, height: 200,
      stressFactor: (stressLevel * 1.2 / 10).toFixed(2),
      fatiguePoints: 'Propulsion shaft seal, Rudder assembly joints',
      dimensions: '25m x 12m',
      material: 'HY-80 High-Yield Steel',
      sensors: 'Acoustic, Vibration, Strain Gauge',
    },
    {
      id: 'midship',
      name: 'Midship Section',
      type: 'rect',
      x: 350, y: 50, width: 300, height: 200,
      stressFactor: (stressLevel * 0.9 / 10).toFixed(2),
      fatiguePoints: 'Pressure hull welds, Ballast tank bulkheads',
      dimensions: '45m x 12m',
      material: 'HY-100 High-Yield Steel',
      sensors: 'Pressure, Temperature, Strain Gauge',
    },
    {
      id: 'bow',
      name: 'Bow Section',
      type: 'rect',
      x: 650, y: 50, width: 300, height: 200,
      stressFactor: (stressLevel * 1.5 / 10).toFixed(2),
      fatiguePoints: 'Torpedo tube doors, Sonar dome casing',
      dimensions: '30m x 12m',
      material: 'Titanium Alloy / HY-80',
      sensors: 'Active Sonar, Passive Array, Impact',
    },
    {
      id: 'sail',
      name: 'Sail / Conning Tower',
      type: 'path',
      d: 'M 400 50 L 420 10 L 520 10 L 550 50 Z',
      stressFactor: (stressLevel * 1.1 / 10).toFixed(2),
      fatiguePoints: 'Mast penetrations, Sail planes',
      dimensions: '15m x 8m x 4m',
      material: 'Composite / HY-80',
      sensors: 'Radar, ESM, Periscope Optics',
    }
  ];

  // Initialize static corrosion points
  useEffect(() => {
    const basePoints = Array.from({ length: 25 }).map(() => ({
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      baseIntensity: Math.random()
    }));
    setCorrosionPoints(basePoints.map(p => ({ ...p, intensity: 0 })));
  }, []);

  // Update corrosion intensities
  useEffect(() => {
    if (activeTab !== 'Coating Defects') return;
    const interval = setInterval(() => {
      setCorrosionPoints(prev => prev.map(p => ({
        ...p,
        intensity: p.baseIntensity * corrosion * 100 + (Math.random() * 15)
      })));
    }, 1500);
    return () => clearInterval(interval);
  }, [corrosion, activeTab]);

  // Track corrosion history for the trend graph
  useEffect(() => {
    if (isSimulating) {
      setCorrosionHistory(prev => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        const newHist = [...prev, { time: timeStr, corrosionTrend: corrosion * 100 }];
        if (newHist.length > 3600) newHist.shift(); // Keep up to 1 hour of data (assuming 1 tick/sec)
        return newHist;
      });
    }
  }, [corrosion, isSimulating]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newPoints = Array.from({ length: 15 }).map(() => ({
        x: Math.random() * 80 + 10, // 10% to 90% width
        y: Math.random() * 60 + 20, // 20% to 80% height
        intensity: Math.random() * stressLevel,
      }));
      setPoints(newPoints);
    }, 1000);
    return () => clearInterval(interval);
  }, [stressLevel]);

  // Update acoustic emissions
  useEffect(() => {
    if (activeTab !== 'Hull Analysis' || !selectedZone) {
      setAcousticPoints([]);
      return;
    }

    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    if (selectedZone === 'aft') {
      minX = 10; maxX = 35; minY = 16.6; maxY = 83.3;
    } else if (selectedZone === 'midship') {
      minX = 35; maxX = 65; minY = 16.6; maxY = 83.3;
    } else if (selectedZone === 'bow') {
      minX = 65; maxX = 95; minY = 16.6; maxY = 83.3;
    } else if (selectedZone === 'sail') {
      minX = 40; maxX = 55; minY = 3.3; maxY = 16.6;
    }

    // Initialize points
    const initialPoints = Array.from({ length: 25 }).map(() => ({
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
      intensity: Math.random() * 100
    }));
    setAcousticPoints(initialPoints);

    const interval = setInterval(() => {
      setAcousticPoints(prev => prev.map(p => ({
        ...p,
        intensity: Math.max(0, Math.min(100, p.intensity + (Math.random() * 40 - 20))),
        x: Math.max(minX, Math.min(maxX, p.x + (Math.random() * 2 - 1))),
        y: Math.max(minY, Math.min(maxY, p.y + (Math.random() * 2 - 1)))
      })));
    }, 400);

    return () => clearInterval(interval);
  }, [activeTab, selectedZone]);

  // Update sensor health
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => prev.map(s => {
        const rand = Math.random();
        let status: 'nominal' | 'warning' | 'offline' = 'nominal';
        if (stressLevel > 80 || corrosion > 0.8) {
          status = rand > 0.6 ? 'offline' : rand > 0.2 ? 'warning' : 'nominal';
        } else if (stressLevel > 50 || corrosion > 0.5) {
          status = rand > 0.8 ? 'offline' : rand > 0.5 ? 'warning' : 'nominal';
        } else {
          status = rand > 0.95 ? 'offline' : rand > 0.85 ? 'warning' : 'nominal';
        }
        return { ...s, status };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [stressLevel, corrosion]);

  // Determine color based on intensity
  const getColor = (intensity: number) => {
    if (intensity > 80) return "rgba(255, 51, 51, 0.8)"; // Alert Red
    if (intensity > 50) return "rgba(255, 153, 0, 0.7)"; // Warn Orange
    if (intensity > 20) return "rgba(255, 255, 0, 0.5)"; // Yellow
    return "rgba(0, 240, 255, 0.3)"; // Cyan
  };

  const getCorrosionColor = (intensity: number) => {
    if (intensity > 70) return "rgba(210, 105, 30, 0.7)"; // Rust
    if (intensity > 40) return "rgba(184, 134, 11, 0.6)"; // DarkGoldenRod
    if (intensity > 20) return "rgba(154, 205, 50, 0.4)"; // YellowGreen
    return "rgba(46, 139, 87, 0.2)"; // SeaGreen
  };

  const getDefectPosition = (location: string) => {
    if (location.includes('AFT')) return { left: '80%', top: '50%' };
    if (location.includes('PORT')) return { left: '50%', top: '60%' };
    if (location.includes('STARBOARD')) return { left: '20%', top: '45%' };
    return { left: '50%', top: '50%' };
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-navy-900 rounded-xl border border-navy-700 overflow-hidden flex items-center justify-center p-8 scanlines grid-bg">
      {/* Radar Sweep */}
      <div className="radar-line" />

      {/* Submarine Outline SVG */}
      <div className="relative w-full max-w-4xl aspect-[3/1]">
        <svg
          viewBox="0 0 1000 300"
          className="w-full h-full drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <clipPath id="hull-clip">
              <path d="M 100 150 C 100 80, 250 50, 500 50 C 750 50, 900 80, 950 150 C 900 220, 750 250, 500 250 C 250 250, 100 220, 100 150 Z" />
            </clipPath>
          </defs>

          {/* Base Hull */}
          <path
            d="M 100 150 C 100 80, 250 50, 500 50 C 750 50, 900 80, 950 150 C 900 220, 750 250, 500 250 C 250 250, 100 220, 100 150 Z"
            fill={activeTab === 'Hull Analysis' ? "rgba(10, 17, 40, 0.4)" : "rgba(10, 17, 40, 0.8)"}
            stroke="rgba(0, 240, 255, 0.6)"
            strokeWidth={activeTab === 'Hull Analysis' ? "1" : "3"}
          />
          {/* Sail / Conning Tower */}
          <path
            d="M 400 50 L 420 10 L 520 10 L 550 50 Z"
            fill={activeTab === 'Hull Analysis' ? "rgba(10, 17, 40, 0.4)" : "rgba(10, 17, 40, 0.8)"}
            stroke="rgba(0, 240, 255, 0.6)"
            strokeWidth={activeTab === 'Hull Analysis' ? "1" : "3"}
          />
          {/* Propeller Area */}
          <path
            d="M 100 150 L 50 130 L 50 170 Z"
            fill={activeTab === 'Hull Analysis' ? "rgba(10, 17, 40, 0.4)" : "rgba(10, 17, 40, 0.8)"}
            stroke="rgba(0, 240, 255, 0.6)"
            strokeWidth={activeTab === 'Hull Analysis' ? "1" : "3"}
          />
          
          {/* Structural Ribs (Visible in Hull Analysis) */}
          {activeTab === 'Hull Analysis' && (
            <g stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1" fill="none">
              {Array.from({ length: 20 }).map((_, i) => {
                const x = 150 + i * 40;
                // Approximate ellipse height at x
                const rx = 400;
                const ry = 100;
                const cx = 500;
                const dx = x - cx;
                const yOffset = ry * Math.sqrt(1 - (dx * dx) / (rx * rx)) || 0;
                
                return (
                  <ellipse key={i} cx={x} cy={150} rx={10} ry={yOffset} strokeDasharray="2,2" />
                );
              })}
              <line x1="100" y1="150" x2="950" y2="150" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="2" />
            </g>
          )}

          {/* Interactive Zones for Hull Analysis & Alert Highlighting */}
          {(activeTab === 'Hull Analysis' || selectedAlert) && (
            <>
              <g clipPath="url(#hull-clip)">
                {hullZones.filter(z => z.type === 'rect').map((zone) => {
                  const isAlertZone = selectedAlert && getZoneForAlert(selectedAlert) === zone.id;
                  const isSelected = activeTab === 'Hull Analysis' && selectedZone === zone.id;
                  const isHovered = activeTab === 'Hull Analysis' && hoveredZone === zone.id;
                  
                  let fill = "transparent";
                  let stroke = "transparent";
                  
                  if (isAlertZone) {
                    fill = selectedAlert.type === 'critical' ? "rgba(255, 50, 50, 0.2)" : selectedAlert.type === 'warning' ? "rgba(255, 150, 50, 0.2)" : "rgba(0, 240, 255, 0.2)";
                    stroke = selectedAlert.type === 'critical' ? "rgba(255, 50, 50, 0.8)" : selectedAlert.type === 'warning' ? "rgba(255, 150, 50, 0.8)" : "rgba(0, 240, 255, 0.8)";
                  } else if (activeTab === 'Hull Analysis') {
                    fill = isSelected ? "rgba(0, 240, 255, 0.3)" : isHovered ? "rgba(0, 240, 255, 0.15)" : "transparent";
                    stroke = isSelected ? "rgba(0, 240, 255, 0.8)" : "transparent";
                  }

                  return (
                    <g key={zone.id}>
                      <rect
                        x={zone.x}
                        y={zone.y}
                        width={zone.width}
                        height={zone.height}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="2"
                        className={`transition-all duration-300 ${activeTab === 'Hull Analysis' ? 'cursor-pointer' : 'pointer-events-none'}`}
                        onMouseEnter={() => activeTab === 'Hull Analysis' && setHoveredZone(zone.id)}
                        onMouseLeave={() => activeTab === 'Hull Analysis' && setHoveredZone(null)}
                        onClick={() => activeTab === 'Hull Analysis' && setSelectedZone(selectedZone === zone.id ? null : zone.id)}
                      />
                      {activeTab === 'Hull Analysis' && (
                        <text
                          x={zone.x + zone.width / 2}
                          y={zone.y + zone.height / 2}
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          fill={isSelected ? "rgba(0, 240, 255, 0.9)" : "rgba(0, 240, 255, 0.4)"}
                          className="font-mono text-2xl font-bold tracking-[0.2em] pointer-events-none transition-all duration-300"
                          style={{ textShadow: isSelected ? '0 0 10px rgba(0,240,255,0.5)' : 'none' }}
                        >
                          {zone.name.split(' ')[0].toUpperCase()}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
              {hullZones.filter(z => z.type === 'path').map((zone) => {
                const isAlertZone = selectedAlert && getZoneForAlert(selectedAlert) === zone.id;
                const isSelected = activeTab === 'Hull Analysis' && selectedZone === zone.id;
                const isHovered = activeTab === 'Hull Analysis' && hoveredZone === zone.id;
                
                let fill = "transparent";
                let stroke = "transparent";
                
                if (isAlertZone) {
                  fill = selectedAlert.type === 'critical' ? "rgba(255, 50, 50, 0.2)" : selectedAlert.type === 'warning' ? "rgba(255, 150, 50, 0.2)" : "rgba(0, 240, 255, 0.2)";
                  stroke = selectedAlert.type === 'critical' ? "rgba(255, 50, 50, 0.8)" : selectedAlert.type === 'warning' ? "rgba(255, 150, 50, 0.8)" : "rgba(0, 240, 255, 0.8)";
                } else if (activeTab === 'Hull Analysis') {
                  fill = isSelected ? "rgba(0, 240, 255, 0.3)" : isHovered ? "rgba(0, 240, 255, 0.15)" : "transparent";
                  stroke = isSelected ? "rgba(0, 240, 255, 0.8)" : "transparent";
                }

                return (
                  <g key={zone.id}>
                    <path
                      d={zone.d}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="2"
                      className={`transition-all duration-300 ${activeTab === 'Hull Analysis' ? 'cursor-pointer' : 'pointer-events-none'}`}
                      onMouseEnter={() => activeTab === 'Hull Analysis' && setHoveredZone(zone.id)}
                      onMouseLeave={() => activeTab === 'Hull Analysis' && setHoveredZone(null)}
                      onClick={() => activeTab === 'Hull Analysis' && setSelectedZone(selectedZone === zone.id ? null : zone.id)}
                    />
                    {activeTab === 'Hull Analysis' && (
                      <text
                        x={475}
                        y={35}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill={isSelected ? "rgba(0, 240, 255, 0.9)" : "rgba(0, 240, 255, 0.4)"}
                        className="font-mono text-xl font-bold tracking-[0.2em] pointer-events-none transition-all duration-300"
                        style={{ textShadow: isSelected ? '0 0 10px rgba(0,240,255,0.5)' : 'none' }}
                      >
                        SAIL
                      </text>
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* Grid lines on hull */}
          {activeTab !== 'Hull Analysis' && (
            <>
              <path d="M 300 60 L 300 240 M 500 50 L 500 250 M 700 60 L 700 240" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="1" strokeDasharray="5,5" />
              <path d="M 150 100 L 900 100 M 120 150 L 930 150 M 150 200 L 900 200" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="1" strokeDasharray="5,5" />
            </>
          )}
        </svg>

        {/* Heatmap Overlay */}
        <div 
          className={`absolute inset-0 pointer-events-none transition-opacity duration-500`} 
          style={{ 
            mixBlendMode: "screen", 
            opacity: activeTab === 'Coating Defects' ? (stressHeatmapOpacity / 100) * 0.3 : (stressHeatmapOpacity / 100) 
          }}
        >
          {points.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full blur-xl"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: p.intensity > 10 ? 0.8 : 0, 
                scale: p.intensity > 50 ? 2 : 1 
              }}
              transition={{ duration: 1 }}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${Math.max(40, p.intensity * 1.5)}px`,
                height: `${Math.max(40, p.intensity * 1.5)}px`,
                backgroundColor: getColor(p.intensity),
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        {/* Acoustic Emissions Overlay */}
        {activeTab === 'Hull Analysis' && selectedZone && showAcoustic && (
          <div className="absolute inset-0 pointer-events-none transition-opacity duration-500" style={{ mixBlendMode: "screen" }}>
            {acousticPoints.map((p, i) => (
              <motion.div
                key={`ac-${i}`}
                className="absolute rounded-full blur-xl"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: p.intensity > 50 ? 0.8 : 0.3, 
                  scale: p.intensity > 80 ? 1.5 : 1 
                }}
                transition={{ duration: 0.4 }}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: '60px',
                  height: '60px',
                  backgroundColor: `rgba(180, 50, 255, ${p.intensity / 100})`, // Purple/Magenta for acoustic
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}
          </div>
        )}

        {/* Corrosion Heatmap Overlay */}
        {activeTab === 'Coating Defects' && (
          <div className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: "hard-light" }}>
            {corrosionPoints.map((p, i) => (
              <motion.div
                key={`corr-${i}`}
                className={`absolute rounded-full blur-xl ${p.intensity > 30 ? 'pointer-events-auto cursor-pointer' : ''}`}
                onMouseEnter={() => p.intensity > 30 && setHoveredCorrosionPoint(p)}
                onMouseLeave={() => setHoveredCorrosionPoint(null)}
                onClick={() => p.intensity > 30 && setSelectedCorrosionPoint(p)}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: p.intensity > 5 ? 0.8 : 0, 
                  scale: p.intensity > 30 ? 1.5 : 1 
                }}
                transition={{ duration: 1.5 }}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${Math.max(50, p.intensity * 1.5)}px`,
                  height: `${Math.max(50, p.intensity * 1.5)}px`,
                  backgroundColor: getCorrosionColor(p.intensity),
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
          </div>
        )}

        {/* Corrosion Tooltip */}
        {activeTab === 'Coating Defects' && hoveredCorrosionPoint && !selectedCorrosionPoint && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-50 bg-navy-900/95 border border-warn-orange/50 p-3 rounded shadow-xl backdrop-blur-md w-64 pointer-events-none"
            style={{ 
              left: `${hoveredCorrosionPoint.x}%`, 
              top: `${hoveredCorrosionPoint.y}%`,
              transform: 'translate(-50%, -120%)'
            }}
          >
            <div className="text-[10px] text-cyan-500/80 font-mono uppercase mb-1 flex items-center gap-1">
              <Cpu className="w-3 h-3" /> AI Diagnostics
            </div>
            <div className="text-warn-orange font-bold font-mono text-sm mb-2">
              {getCorrosionAnalysis(hoveredCorrosionPoint.intensity).type}
            </div>
            <div className="text-xs text-slate-300 mb-1">
              <span className="text-slate-500 font-mono text-[10px] uppercase">Degradation:</span><br/>
              {getCorrosionAnalysis(hoveredCorrosionPoint.intensity).degradation}
            </div>
            <div className="text-xs text-slate-300">
              <span className="text-slate-500 font-mono text-[10px] uppercase">Action:</span><br/>
              {getCorrosionAnalysis(hoveredCorrosionPoint.intensity).action}
            </div>
          </motion.div>
        )}

        {/* Breach Simulation Overlay */}
        {isSimulating && stressLevel > 90 && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            <div className="text-alert-red font-mono font-bold text-4xl border-4 border-alert-red px-8 py-4 bg-navy-900/80 backdrop-blur-sm transform -rotate-12">
              CRITICAL HULL BREACH DETECTED
            </div>
          </motion.div>
        )}

        {/* Sensor Health Indicators */}
        {(activeTab === 'Coating Defects' || activeTab === 'Hull Analysis') && sensors.map((sensor) => {
          let bgClass = 'bg-safe-green';
          let borderClass = 'border-safe-green/50';
          let glowClass = 'shadow-[0_0_8px_rgba(0,255,150,0.6)]';
          
          if (sensor.status === 'warning') {
            bgClass = 'bg-warn-orange';
            borderClass = 'border-warn-orange/50';
            glowClass = 'shadow-[0_0_8px_rgba(255,153,0,0.6)]';
          } else if (sensor.status === 'offline') {
            bgClass = 'bg-alert-red';
            borderClass = 'border-alert-red/50';
            glowClass = 'shadow-[0_0_8px_rgba(255,51,51,0.6)]';
          }

          return (
            <div
              key={sensor.id}
              className="absolute z-10 flex flex-col items-center justify-center group"
              style={{ left: `${sensor.x}%`, top: `${sensor.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className={`w-3 h-3 rounded-full border ${bgClass} ${borderClass} ${glowClass} ${sensor.status === 'offline' ? 'animate-pulse' : ''}`} />
              
              {/* Sensor Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center w-24 p-1.5 bg-navy-900/95 border border-cyan-500/30 rounded shadow-xl backdrop-blur-md z-30 pointer-events-none">
                <span className="text-[9px] font-mono text-slate-300">{sensor.id}</span>
                <span className={`text-[9px] font-mono font-bold uppercase ${sensor.status === 'nominal' ? 'text-safe-green' : sensor.status === 'warning' ? 'text-warn-orange' : 'text-alert-red'}`}>
                  {sensor.status}
                </span>
              </div>
            </div>
          );
        })}

        {/* Defect Markers Overlay */}
        {activeTab === 'Coating Defects' && alerts.map((alert) => {
          const pos = getDefectPosition(alert.location);
          const isCritical = alert.type === 'critical';
          const isCorrosion = alert.id === 'warn-corr';
          
          let bgClass = 'bg-cyan-400';
          let textClass = 'text-cyan-400';
          let borderClass = 'border-cyan-400/50';
          let glowClass = 'shadow-[0_0_10px_rgba(0,240,255,0.8)]';
          
          if (isCritical) {
            bgClass = 'bg-alert-red';
            textClass = 'text-alert-red';
            borderClass = 'border-alert-red/50';
            glowClass = 'shadow-[0_0_15px_rgba(255,51,51,0.9)]';
          } else if (isCorrosion) {
            bgClass = 'bg-warn-orange';
            textClass = 'text-warn-orange';
            borderClass = 'border-warn-orange/50';
            glowClass = 'shadow-[0_0_10px_rgba(255,153,0,0.8)]';
          }

          return (
            <motion.div
              key={alert.id}
              className="absolute z-20 flex flex-col items-center justify-center group cursor-pointer"
              style={{ left: pos.left, top: pos.top, transform: 'translate(-50%, -50%)' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              onClick={() => setSelectedAlert(alert)}
            >
              <span className="relative flex h-6 w-6 items-center justify-center">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${bgClass}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${bgClass} ${glowClass}`}></span>
              </span>
              <div className={`mt-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded border bg-navy-900/90 backdrop-blur-sm ${textClass} ${borderClass}`}>
                {isCorrosion ? 'COATING DELAM' : (isCritical ? 'CRITICAL BREACH' : 'MICRO-FRACTURE')}
              </div>
              
              {/* Hover Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-start w-48 p-3 bg-navy-900/95 border border-cyan-500/50 rounded shadow-xl backdrop-blur-md z-30 pointer-events-none">
                <span className={`text-xs font-bold mb-1 ${textClass}`}>{alert.message}</span>
                <span className="text-[10px] text-slate-400 font-mono">SEVERITY: {alert.type === 'critical' ? 'Critical' : alert.type === 'warning' ? 'Warning' : 'Info'}</span>
                <span className="text-[10px] text-slate-400 font-mono">ACTION: {getShortAction(alert)}</span>
                <span className="text-[10px] text-slate-400 font-mono">LOC: {alert.location}</span>
                <span className="text-[10px] text-slate-400 font-mono">TIME: {alert.time}</span>
                <div className="w-full h-px bg-cyan-500/20 my-1" />
                <span className="text-[9px] text-cyan-500/80 uppercase">AI Diagnostics Active</span>
              </div>
            </motion.div>
          );
        })}

        {/* Selected Zone Overlay Data */}
        {activeTab === 'Hull Analysis' && selectedZone && (
          <div className="absolute inset-0 pointer-events-none z-30">
            {hullZones.filter(z => z.id === selectedZone).map(zone => {
              const left = zone.type === 'rect' ? (zone.x / 1000) * 100 : 40;
              const top = zone.type === 'rect' ? (zone.y / 300) * 100 : 3.3;
              const width = zone.type === 'rect' ? (zone.width / 1000) * 100 : 15;
              const height = zone.type === 'rect' ? (zone.height / 300) * 100 : 13.3;
              
              const zonePrefix = zone.id === 'midship' ? 'MID' : zone.id.toUpperCase();
              const zoneSensors = sensors.filter(s => s.id.includes(zonePrefix));
              const activeSensors = zoneSensors.filter(s => s.status === 'nominal').length;

              return (
                <motion.div
                  key={`overlay-${zone.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute flex flex-col items-center justify-center"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                  }}
                >
                  <div className="bg-navy-900/90 backdrop-blur-md border border-cyan-500/50 p-2.5 rounded shadow-xl flex flex-col gap-1.5 items-center pointer-events-auto">
                    <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold tracking-wider">{zone.name} LIVE</span>
                    
                    <div className="flex gap-3 text-[8px] font-mono text-slate-400 mb-1">
                      <span>{zone.dimensions}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-600 self-center" />
                      <span className="truncate max-w-[100px]">{zone.material}</span>
                    </div>

                    <div className="flex gap-4 text-[9px] font-mono text-slate-300">
                      <div className="flex flex-col items-center">
                        <span className="text-slate-500 mb-0.5">STRESS</span>
                        <span className={`font-bold ${parseFloat(zone.stressFactor) > 8 ? 'text-alert-red' : parseFloat(zone.stressFactor) > 5 ? 'text-warn-orange' : 'text-safe-green'}`}>
                          {zone.stressFactor} Kt
                        </span>
                      </div>
                      <div className="w-px bg-navy-700" />
                      <div className="flex flex-col items-center">
                        <span className="text-slate-500 mb-0.5">TEMP</span>
                        <span className="font-bold">{(24.5 - (parseFloat(zone.stressFactor) * 0.5)).toFixed(1)}°C</span>
                      </div>
                      <div className="w-px bg-navy-700" />
                      <div className="flex flex-col items-center">
                        <span className="text-slate-500 mb-0.5">SENSORS</span>
                        <span className={`font-bold ${activeSensors < zoneSensors.length ? 'text-warn-orange' : 'text-safe-green'}`}>
                          {activeSensors}/{zoneSensors.length} ACT
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overlay Stats */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-navy-800/80 border border-cyan-500/30 px-3 py-1.5 rounded text-xs font-mono text-cyan-400 backdrop-blur-sm">
          VIEW: STARBOARD PROFILE
        </div>
        <div className="bg-navy-800/80 border border-cyan-500/30 px-3 py-1.5 rounded text-xs font-mono text-cyan-400 backdrop-blur-sm">
          SENSOR ARRAY: ACTIVE
        </div>
        
        {/* Stress Heatmap Opacity Slider */}
        <div className="bg-navy-800/80 border border-cyan-500/30 px-3 py-2 rounded text-xs font-mono text-cyan-400 backdrop-blur-sm flex flex-col gap-1 pointer-events-auto mt-2">
          <div className="flex justify-between items-center w-full">
            <span>STRESS HEATMAP</span>
            <span>{stressHeatmapOpacity}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={stressHeatmapOpacity} 
            onChange={(e) => setStressHeatmapOpacity(parseInt(e.target.value))}
            className="w-full h-1 bg-navy-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-1"
          />
        </div>
      </div>

      {/* Selected Corrosion Point Side Panel */}
      {activeTab === 'Coating Defects' && selectedCorrosionPoint && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 bg-navy-800/95 border border-warn-orange/50 rounded-lg shadow-xl backdrop-blur-md p-4 w-80 z-50"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-warn-orange font-mono font-bold uppercase text-sm">
              <Wrench className="w-4 h-4" />
              Defect Analysis
            </div>
            <button onClick={() => setSelectedCorrosionPoint(null)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">Defect Type</div>
              <div className="text-sm text-slate-200 font-mono font-bold">
                {getCorrosionAnalysis(selectedCorrosionPoint.intensity).type}
              </div>
            </div>
            
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">Degradation Level</div>
              <div className="text-xs text-slate-300 leading-relaxed">
                {getCorrosionAnalysis(selectedCorrosionPoint.intensity).degradation}
              </div>
              <div className="mt-2 w-full bg-navy-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-warn-orange h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, selectedCorrosionPoint.intensity)}%` }}
                />
              </div>
              <div className="text-[10px] text-right text-warn-orange font-mono mt-1">
                {selectedCorrosionPoint.intensity.toFixed(1)}% Severity
              </div>
            </div>

            <div className="w-full h-px bg-navy-700" />

            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">Recommended Action</div>
              <div className="text-xs text-cyan-400 leading-relaxed font-mono bg-cyan-500/10 p-2 rounded border border-cyan-500/20">
                {getCorrosionAnalysis(selectedCorrosionPoint.intensity).action}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-navy-900/50 p-2 rounded border border-navy-700">
                <div className="text-[9px] text-slate-400 font-mono uppercase mb-1">Location X</div>
                <div className="text-xs text-slate-200 font-mono">{selectedCorrosionPoint.x.toFixed(2)}</div>
              </div>
              <div className="bg-navy-900/50 p-2 rounded border border-navy-700">
                <div className="text-[9px] text-slate-400 font-mono uppercase mb-1">Location Y</div>
                <div className="text-xs text-slate-200 font-mono">{selectedCorrosionPoint.y.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Zone Side Panel */}
      {activeTab === 'Hull Analysis' && selectedZone && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 bg-navy-800/95 border border-cyan-500/50 rounded-lg shadow-xl backdrop-blur-md p-4 w-80 z-50"
        >
          {hullZones.filter(z => z.id === selectedZone).map(zone => (
            <div key={zone.id} className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold uppercase text-sm">
                  {zone.name}
                </div>
                <button onClick={() => setSelectedZone(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-navy-900/50 p-2 rounded border border-navy-700">
                  <div className="text-[9px] text-slate-400 font-mono uppercase mb-1">Stress Factor</div>
                  <div className={`text-lg font-mono font-bold ${parseFloat(zone.stressFactor) > 8 ? 'text-alert-red' : parseFloat(zone.stressFactor) > 5 ? 'text-warn-orange' : 'text-safe-green'}`}>
                    {zone.stressFactor} <span className="text-xs text-slate-500">Kt</span>
                  </div>
                </div>
                <div className="bg-navy-900/50 p-2 rounded border border-navy-700">
                  <div className="text-[9px] text-slate-400 font-mono uppercase mb-1">Status</div>
                  <div className={`text-sm font-mono font-bold mt-1 ${parseFloat(zone.stressFactor) > 8 ? 'text-alert-red' : parseFloat(zone.stressFactor) > 5 ? 'text-warn-orange' : 'text-safe-green'}`}>
                    {parseFloat(zone.stressFactor) > 8 ? 'CRITICAL' : parseFloat(zone.stressFactor) > 5 ? 'WARNING' : 'NOMINAL'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-400 font-mono uppercase mb-1">Potential Fatigue Points</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {zone.fatiguePoints}
                </p>
              </div>

              <div className="w-full h-px bg-navy-700" />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[9px] text-slate-400 font-mono uppercase mb-1">Dimensions</div>
                  <div className="text-xs text-slate-200 font-mono">{zone.dimensions}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-mono uppercase mb-1">Material</div>
                  <div className="text-xs text-slate-200 font-mono">{zone.material}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[9px] text-slate-400 font-mono uppercase mb-1">Embedded Sensors</div>
                  <div className="text-xs text-slate-200 font-mono">{zone.sensors}</div>
                </div>
              </div>

              <div className="w-full h-px bg-navy-700" />
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Acoustic Emissions</span>
                <button
                  onClick={() => setShowAcoustic(!showAcoustic)}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${showAcoustic ? 'bg-cyan-500' : 'bg-navy-700'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showAcoustic ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Corrosion Trend Graph */}
      {activeTab === 'Coating Defects' && corrosionHistory.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 right-4 bg-navy-800/95 border border-warn-orange/50 rounded-lg shadow-xl backdrop-blur-md p-3 w-80 z-40"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">Corrosion Trend (1h)</span>
            <span className="text-[10px] font-mono text-warn-orange font-bold">{(corrosion * 100).toFixed(1)}%</span>
          </div>
          <div className="h-24 w-full overflow-x-auto overflow-y-hidden">
            <div style={{ width: Math.max(300, corrosionHistory.length * 2), height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={corrosionHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCorrosion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff9900" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff9900" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10, 17, 40, 0.9)', borderColor: '#ff9900', color: '#e2e8f0', backdropFilter: 'blur(4px)', padding: '4px' }}
                    itemStyle={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }}
                    labelStyle={{ display: 'none' }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Corrosion']}
                  />
                  <Area type="monotone" dataKey="corrosionTrend" stroke="#ff9900" fillOpacity={1} fill="url(#colorCorrosion)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sensor Summary Panel */}
      {(activeTab === 'Coating Defects' || activeTab === 'Hull Analysis') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 bg-navy-800/95 border border-cyan-500/50 rounded-lg shadow-xl backdrop-blur-md p-3 z-40 flex items-center gap-4"
        >
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
            Sensor Array Status
          </div>
          <div className="h-4 w-px bg-navy-700" />
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-safe-green shadow-[0_0_5px_rgba(0,255,150,0.6)]" />
              <span className="text-xs font-mono text-slate-300">{sensors.filter(s => s.status === 'nominal').length} NOMINAL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-warn-orange shadow-[0_0_5px_rgba(255,153,0,0.6)]" />
              <span className="text-xs font-mono text-slate-300">{sensors.filter(s => s.status === 'warning').length} WARNING</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-alert-red shadow-[0_0_5px_rgba(255,51,51,0.6)] animate-pulse" />
              <span className="text-xs font-mono text-slate-300">{sensors.filter(s => s.status === 'offline').length} OFFLINE</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Detailed Alert Modal */}
      {selectedAlert && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-navy-800 border border-cyan-500/50 rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className={`p-4 border-b flex justify-between items-center ${
              selectedAlert.type === 'critical' ? 'bg-alert-red/20 border-alert-red/50' :
              selectedAlert.id === 'warn-corr' ? 'bg-warn-orange/20 border-warn-orange/50' :
              'bg-cyan-500/20 border-cyan-500/50'
            }`}>
              <h3 className={`font-mono font-bold text-lg uppercase ${
                selectedAlert.type === 'critical' ? 'text-alert-red' :
                selectedAlert.id === 'warn-corr' ? 'text-warn-orange' :
                'text-cyan-400'
              }`}>
                {selectedAlert.id === 'warn-corr' ? 'Coating Delamination' : (selectedAlert.type === 'critical' ? 'Critical Breach' : 'Micro-Fracture')}
              </h3>
              <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Severity</div>
                  <div className={`text-sm font-bold ${
                    selectedAlert.type === 'critical' ? 'text-alert-red' :
                    selectedAlert.id === 'warn-corr' ? 'text-warn-orange' :
                    'text-cyan-400'
                  }`}>{selectedAlert.type === 'critical' ? 'Critical' : selectedAlert.type === 'warning' ? 'Warning' : 'Info'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Time of Detection</div>
                  <div className="text-sm text-slate-200 font-mono">{selectedAlert.timestamp}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Exact Location</div>
                  <div className="text-sm text-slate-200 font-mono">{selectedAlert.location}</div>
                </div>
              </div>
              
              <div className="w-full h-px bg-navy-700" />
              
              <div>
                <div className="text-[10px] text-cyan-500/80 font-mono uppercase mb-2 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> AI Analysis
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedAlert.message}
                  {selectedAlert.type === 'critical' && " Immediate evasive maneuvers and damage control protocols recommended. Structural integrity compromised beyond safe operational limits."}
                  {selectedAlert.id === 'warn-corr' && " Galvanic signature indicates accelerated anechoic tile degradation. Acoustic stealth capabilities may be reduced by up to 14% in this sector."}
                  {selectedAlert.id === 'warn-int' && " Acoustic emission sensors detect micro-fracture propagation. Recommend reducing depth to alleviate hydrostatic pressure on the affected frame."}
                </p>
              </div>

              <div className="w-full h-px bg-navy-700" />
              
              <div>
                <div className="text-[10px] text-warn-orange/80 font-mono uppercase mb-2 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> Recommended Action
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-mono">
                  {getRecommendedAction(selectedAlert)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
