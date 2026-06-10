import { Activity, Anchor, ShieldAlert, Settings, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    { icon: Activity, label: "Live Telemetry" },
    { icon: Anchor, label: "Hull Analysis" },
    { icon: ShieldAlert, label: "Coating Defects" },
    { icon: BarChart2, label: "Predictive Maintenance" },
    { icon: Settings, label: "System Config" },
  ];

  return (
    <aside className="w-64 bg-navy-800 border-r border-navy-700 flex flex-col h-full">
      <div className="p-6 border-b border-navy-700">
        <div className="flex items-center gap-3 text-cyan-500">
          <Anchor className="w-8 h-8" />
          <div>
            <h1 className="font-bold tracking-wider uppercase text-sm">Project</h1>
            <h2 className="font-mono text-xs text-cyan-400 opacity-80">VARUNA-DT</h2>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item, idx) => (
            <li key={idx}>
              <button
                onClick={() => onTabChange(item.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium",
                  activeTab === item.label 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" 
                    : "text-slate-400 hover:bg-navy-700 hover:text-slate-200"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-navy-700">
        <div className="bg-navy-900 rounded p-3 border border-navy-700">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">System Status</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-safe-green animate-pulse" />
            <span className="font-mono text-xs text-safe-green">ONLINE & SECURE</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
