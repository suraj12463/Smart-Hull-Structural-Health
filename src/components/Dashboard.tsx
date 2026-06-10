import { useState, useEffect, useCallback } from 'react';
import { HullVisualizer } from './HullVisualizer';
import { MetricsPanel } from './MetricsPanel';
import { AlertsPanel } from './AlertsPanel';
import { PredictiveMaintenancePanel } from './PredictiveMaintenancePanel';
import { SystemConfigPanel } from './SystemConfigPanel';
import { Play, Square, AlertOctagon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardProps {
  activeTab: string;
}

export function Dashboard({ activeTab }: DashboardProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCatastrophic, setIsCatastrophic] = useState(false);
  const [isManualDepth, setIsManualDepth] = useState(false);
  const [targetDepth, setTargetDepth] = useState(15);
  const [failureDepthSetting, setFailureDepthSetting] = useState(1000);
  
  // Simulation State
  const [depth, setDepth] = useState(15); // meters
  const [pressure, setPressure] = useState(0.15); // MPa
  const [integrity, setIntegrity] = useState(100); // %
  const [corrosion, setCorrosion] = useState(0.02); // index
  const [temperature, setTemperature] = useState(24.5); // Celsius
  const [seaState, setSeaState] = useState(3); // Douglas Sea Scale (0-9)
  const [salinity, setSalinity] = useState(35.0); // PSU (Practical Salinity Unit)
  const [verticalSpeed, setVerticalSpeed] = useState(0); // m/s
  const [internalPressure, setInternalPressure] = useState(1.0); // atm
  const [internalTemp, setInternalTemp] = useState(22.0); // Celsius
  const [oxygenLevel, setOxygenLevel] = useState(21.0); // %
  const [humidity, setHumidity] = useState(45.0); // %
  const [waterDensity, setWaterDensity] = useState(1023.6); // kg/m³
  const [soundVelocity, setSoundVelocity] = useState(1500.0); // m/s
  const [hullStress, setHullStress] = useState(0.0); // MPa
  const [cathodicProtection, setCathodicProtection] = useState(100.0); // % effectiveness
  const [galvanicPotential, setGalvanicPotential] = useState(-850.0); // mV (vs Ag/AgCl)
  
  const [history, setHistory] = useState<{ time: string; pressure: number; depth: number; temp: number }[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Reset Simulation
  const resetSimulation = useCallback(() => {
    setIsSimulating(false);
    setIsCatastrophic(false);
    setIsManualDepth(false);
    setTargetDepth(15);
    setDepth(15);
    setPressure(0.15);
    setIntegrity(100);
    setCorrosion(0.02);
    setTemperature(24.5);
    setSeaState(3);
    setSalinity(35.0);
    setVerticalSpeed(0);
    setInternalPressure(1.0);
    setInternalTemp(22.0);
    setOxygenLevel(21.0);
    setHumidity(45.0);
    setWaterDensity(1023.6);
    setSoundVelocity(1500.0);
    setHullStress(0.0);
    setCathodicProtection(100.0);
    setGalvanicPotential(-850.0);
    setHistory([]);
    setAlerts([]);
  }, []);

  // Simulation Loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      setDepth(prev => {
        if (isManualDepth) {
          const rate = isCatastrophic ? 5.0 : 2.0;
          const newDepth = Math.min(Math.max(prev + (targetDepth - prev) * 0.1 * rate, 0), 12000);
          setVerticalSpeed(newDepth - prev);
          return newDepth;
        }
        // Smooth dive profile using targeted easing
        const target = isCatastrophic ? failureDepthSetting : 15 + Math.abs(Math.sin(Date.now() / 20000)) * 600; // Dive deeper to show pressure effects
        const rate = isCatastrophic ? 5.0 : 0.5;
        const newDepth = Math.min(Math.max(prev + (target - prev) * 0.1 * rate, 0), 12000);
        setVerticalSpeed(newDepth - prev);
        return newDepth;
      });

      setInternalPressure(prev => {
        if (integrity < 30) {
           return prev + (pressure * 9.869 - prev) * 0.1; // 1 MPa ≈ 9.869 atm
        }
        return 1.0 + (Math.random() * 0.02 - 0.01);
      });

      setInternalTemp(prev => {
        const target = integrity < 30 ? temperature : 22.0;
        return prev + (target - prev) * 0.05 + (Math.random() * 0.1 - 0.05);
      });

      setOxygenLevel(prev => {
        const target = integrity < 50 ? 18.0 : 21.0;
        return prev + (target - prev) * 0.02 + (Math.random() * 0.05 - 0.025);
      });

      setHumidity(prev => {
        const target = integrity < 30 ? 95.0 : 45.0;
        return prev + (target - prev) * 0.05 + (Math.random() * 1.0 - 0.5);
      });

      setTemperature(prev => {
        // Realistic ocean thermocline simulation: rapid drop in first 200m, then slow decay
        const targetTemp = depth < 200 ? 24.5 - (depth / 200) * 10 : 14.5 - ((depth - 200) / 800) * 10.5;
        return prev + (targetTemp - prev) * 0.1 + (Math.random() * 0.05 - 0.025);
      });

      setSeaState(prev => {
        // Slowly fluctuate sea state
        const change = Math.random() > 0.95 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(0, Math.min(9, prev + change));
      });

      setSalinity(prev => {
        // Halocline: Salinity varies slightly with depth
        const targetSalinity = 35.0 + (depth / 1000) * 0.6;
        return prev + (targetSalinity - prev) * 0.1 + (Math.random() * 0.01 - 0.005);
      });

      setWaterDensity(prev => {
        // Simplified UNESCO equation of state for seawater density
        const target = 1027 + (depth * 0.0046) - (temperature * 0.15) + (salinity - 35) * 0.78;
        return prev + (target - prev) * 0.1;
      });

      setSoundVelocity(prev => {
        // Mackenzie (1981) sound speed equation
        const T = temperature;
        const S = salinity;
        const z = depth;
        const c = 1448.96 + 4.591 * T - 0.05304 * T * T + 2.374e-4 * T * T * T + 1.340 * (S - 35) + 0.01630 * z + 1.675e-7 * z * z - 0.01025 * T * (S - 35) - 7.139e-13 * T * z * z * z;
        return prev + (c - prev) * 0.1;
      });

      setPressure(prev => {
        // Highly accurate hydrostatic pressure: P = ρ * g * h
        const exactPressureMPa = (waterDensity * 9.80665 * depth) / 1000000;
        // Add realistic sensor noise (±0.005 MPa)
        return exactPressureMPa + (Math.random() * 0.01 - 0.005);
      });

      setHullStress(prev => {
        // Hoop stress approximation for cylindrical pressure hull: sigma = P * r / t
        // Assume radius r = 3.5m, thickness t = 0.045m (45mm HY-80 steel) -> multiplier = 77.7
        const hoopStress = pressure * 77.7;
        // Add dynamic stress from vertical speed and sea state
        const dynamicStress = Math.abs(verticalSpeed) * 2.5 + (depth < 50 ? seaState * 1.2 : 0);
        return hoopStress + dynamicStress + (Math.random() * 2 - 1);
      });

      setCathodicProtection(prev => {
        // CP degrades slightly over time, drops sharply if catastrophic or high stress
        const drop = isCatastrophic ? Math.random() * 5 : (hullStress > 400 ? 0.1 : 0.01);
        return Math.max(0, prev - drop);
      });

      setGalvanicPotential(prev => {
        // Optimal is -850mV. As CP drops, potential becomes less negative (more corrosive)
        const target = -850 + ((100 - cathodicProtection) * 3); // Drops to ~ -550mV if CP is 0
        return prev + (target - prev) * 0.1 + (Math.random() * 5 - 2.5);
      });

      setCorrosion(prev => {
        // Corrosion accelerates with depth (pressure), temperature, salinity, and time
        const pressureFactor = 1 + (pressure / 10);
        const tempFactor = 1 + (temperature / 25);
        const salinityFactor = 1 + ((salinity - 35) / 10); // Higher salinity = faster corrosion
        
        // CP effectiveness (100% = 0.1 multiplier, 0% = 5.0 multiplier)
        const cpFactor = Math.max(0.1, 5.0 - (cathodicProtection / 100) * 4.9);
        
        // Galvanic potential difference (deviation from optimal -850mV)
        const galvanicPenalty = Math.max(0, (galvanicPotential + 850) / 100); // Positive if potential > -850

        const baseIncrease = 0.0002;
        const increase = isCatastrophic 
          ? 0.08 
          : baseIncrease * pressureFactor * tempFactor * salinityFactor * cpFactor * (1 + galvanicPenalty);
          
        return Math.min(prev + increase, 1.0);
      });

      setIntegrity(prev => {
        // HY-80 Yield Strength is ~550 MPa. Ultimate Tensile Strength is ~690 MPa.
        const yieldStrength = 550;
        const stressRatio = hullStress / yieldStrength;
        
        // Base micro-fatigue
        let drop = 0;
        if (stressRatio > 0.3) drop += 0.001 * stressRatio;
        if (stressRatio > 0.8) drop += 0.05 * Math.pow(stressRatio, 4); // Rapid fatigue near yield
        if (stressRatio > 1.0) drop += 2.5; // Yield exceeded, plastic deformation
        
        const corrosionPenalty = corrosion * 2;
        drop += corrosionPenalty * 0.05;

        if (isCatastrophic) drop += Math.random() * 2 + 1;
        
        return Math.max(prev - drop, 0);
      });

      setHistory(prev => {
        const newHistory = [...prev, { time: timeStr, pressure, depth, temp: temperature }];
        if (newHistory.length > 30) newHistory.shift(); // Keep more history for smoother charts
        return newHistory;
      });

      setAlerts(prev => {
        let newAlerts = [...prev];
        
        if (integrity < 30 && !prev.some(a => a.id === 'crit-int')) {
          newAlerts = [{
            id: 'crit-int',
            type: 'critical',
            message: 'CRITICAL YIELD STRESS EXCEEDED. HULL BREACH IMMINENT.',
            timestamp: timeStr,
            location: 'AFT PRESSURE HULL (FRAME 42-48)'
          }, ...newAlerts];
        } else if (integrity < 75 && !prev.some(a => a.id === 'warn-int')) {
          newAlerts = [{
            id: 'warn-int',
            type: 'warning',
            message: 'Acoustic emissions detected. Micro-fracture propagation in outer hull.',
            timestamp: timeStr,
            location: 'PORT BOW (FRAME 12-15)'
          }, ...newAlerts];
        }

        if (corrosion > 0.65 && !prev.some(a => a.id === 'warn-corr')) {
          newAlerts = [{
            id: 'warn-corr',
            type: 'warning',
            message: 'Galvanic signature anomaly. Anechoic tile delamination detected.',
            timestamp: timeStr,
            location: 'STARBOARD FLANK (FRAME 22-30)'
          }, ...newAlerts];
        }
        
        return newAlerts;
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, isCatastrophic, isManualDepth, targetDepth, failureDepthSetting, depth, pressure, corrosion, integrity, temperature, seaState, salinity]);

  // Calculate stress level for visualizer (0-100)
  const stressLevel = Math.min(100, Math.max(0, (100 - integrity) + (hullStress / 550 * 50) + (corrosion * 20)));

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto min-h-full">
      {/* Controls Header */}
      <div className="flex items-center justify-between bg-navy-800 border border-navy-700 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-mono font-bold text-slate-200 uppercase tracking-widest">
            Digital Twin Telemetry
          </h2>
          <div className="h-6 w-px bg-navy-700" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">STATUS:</span>
            <span className={cn(
              "text-xs font-mono font-bold px-2 py-1 rounded border",
              isSimulating ? (isCatastrophic ? "bg-alert-red/20 text-alert-red border-alert-red/50 animate-pulse" : "bg-cyan-500/20 text-cyan-400 border-cyan-500/50") : "bg-slate-800 text-slate-400 border-slate-700"
            )}>
              {isSimulating ? (isCatastrophic ? "CATASTROPHIC FAILURE SIM" : "ACTIVE MONITORING") : "STANDBY"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-mono text-sm font-bold transition-all border",
              isSimulating 
                ? "bg-navy-900 text-warn-orange border-warn-orange/50 hover:bg-warn-orange/10" 
                : "bg-cyan-500/10 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/20"
            )}
          >
            {isSimulating ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isSimulating ? "PAUSE" : "START SIMULATION"}
          </button>
          
          <button
            onClick={resetSimulation}
            className="flex items-center gap-2 px-4 py-2 rounded-md font-mono text-sm font-bold bg-navy-900 text-slate-300 border border-navy-700 hover:bg-navy-800 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            RESET
          </button>

          <div className="h-6 w-px bg-navy-700 mx-2" />

          <div className="flex items-center gap-2 bg-navy-900 border border-alert-red/30 rounded-md p-1 pl-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Breach Depth:</span>
              <input 
                type="number" 
                value={failureDepthSetting} 
                onChange={e => setFailureDepthSetting(Number(e.target.value))}
                className="bg-navy-800 text-alert-red font-mono text-sm w-16 px-1 py-1 text-center rounded border border-navy-700 focus:outline-none focus:border-alert-red/50 mx-1"
                min="0"
                max="12000"
              />
              <span className="text-xs font-mono text-slate-500 mr-1">m</span>
            </div>
            <button
              onClick={() => {
                setIsSimulating(true);
                setIsCatastrophic(true);
                setIsManualDepth(true);
                setTargetDepth(failureDepthSetting);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded font-mono text-sm font-bold bg-alert-red/10 text-alert-red hover:bg-alert-red/20 transition-all"
            >
              <AlertOctagon className="w-4 h-4" />
              TRIGGER CATASTROPHE
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Column: Visualizer & Metrics */}
        <div className="col-span-12 xl:col-span-8 flex gap-4 min-h-0">
          {/* Vertical Depth Scroller */}
          <div className="w-20 bg-navy-800 border border-navy-700 rounded-lg flex flex-col items-center py-4 gap-4 shrink-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest rotate-180" style={{ writingMode: 'vertical-rl' }}>Depth Control</span>
            
            <label className="flex flex-col items-center gap-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isManualDepth}
                onChange={(e) => setIsManualDepth(e.target.checked)}
                className="accent-cyan-500 w-3 h-3"
              />
              <span className="text-[8px] font-mono text-cyan-400 uppercase">Manual</span>
            </label>

            <div className="flex flex-col gap-2 w-full px-2">
              <button onClick={() => { setIsManualDepth(true); setTargetDepth(15); }} className="text-[9px] font-mono bg-navy-900 border border-cyan-500/30 text-cyan-400 py-1 rounded hover:bg-cyan-500/20 transition-colors">15m</button>
              <button onClick={() => { setIsManualDepth(true); setTargetDepth(350); }} className="text-[9px] font-mono bg-navy-900 border border-warn-orange/30 text-warn-orange py-1 rounded hover:bg-warn-orange/20 transition-colors">350m</button>
              <button onClick={() => { setIsManualDepth(true); setTargetDepth(1000); }} className="text-[9px] font-mono bg-navy-900 border border-alert-red/30 text-alert-red py-1 rounded hover:bg-alert-red/20 transition-colors">1000m</button>
            </div>

            <div className="flex-1 w-full flex justify-center relative py-2 min-h-[220px]">
              <input 
                type="range" 
                min="0" 
                max="6000" 
                value={isManualDepth ? targetDepth : depth}
                onChange={(e) => {
                  if (!isManualDepth) setIsManualDepth(true);
                  setTargetDepth(Number(e.target.value));
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-2 bg-navy-900 rounded-lg appearance-none cursor-pointer accent-cyan-500 -rotate-90"
                style={{ transformOrigin: 'center' }}
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono font-bold text-cyan-400">{Math.round(depth)}</span>
              <span className="text-[10px] font-mono text-slate-500">meters</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6 min-h-0">
            <div className="min-h-[300px] h-[50%]">
              <HullVisualizer stressLevel={stressLevel} isSimulating={isCatastrophic} alerts={alerts} activeTab={activeTab} corrosion={corrosion} history={history} />
            </div>
            <div className="min-h-[300px] h-[50%]">
            {activeTab === 'Predictive Maintenance' ? (
              <PredictiveMaintenancePanel integrity={integrity} corrosion={corrosion} pressure={pressure} />
            ) : activeTab === 'System Config' ? (
              <SystemConfigPanel />
            ) : (
              <MetricsPanel 
                depth={depth} 
                verticalSpeed={verticalSpeed}
                pressure={pressure} 
                integrity={integrity} 
                corrosion={corrosion} 
                temperature={temperature}
                internalTemp={internalTemp}
                internalPressure={internalPressure}
                oxygenLevel={oxygenLevel}
                humidity={humidity}
                waterDensity={waterDensity}
                soundVelocity={soundVelocity}
                hullStress={hullStress}
                cathodicProtection={cathodicProtection}
                galvanicPotential={galvanicPotential}
                seaState={seaState}
                salinity={salinity}
                history={history} 
              />
            )}
          </div>
        </div>
      </div>

        {/* Right Column: Alerts */}
        <div className="col-span-12 xl:col-span-4 min-h-[400px]">
          <AlertsPanel alerts={alerts} integrity={integrity} corrosion={corrosion} />
        </div>
      </div>
    </div>
  );
}
