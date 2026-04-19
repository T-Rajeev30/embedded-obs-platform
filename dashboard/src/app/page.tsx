"use client";
import LiveTerminal from '../components/LiveTerminal';
import { Cpu, Activity, Zap } from 'lucide-react';
import MetricChart from '../components/MetricChart';
import { io } from 'socket.io-client';

export default function Home() {
  const socket = io('http://localhost:4000');

  const triggerReset = () => {
    if (confirm("Are you sure you want to remotely reboot the ESP32?")) {
      socket.emit('cmd-reset', 'ESP32-BWH-01');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Embedded<span className="text-blue-500">Obs</span></h1>
            <p className="text-slate-500 text-sm mt-1">Real-time hardware observability for BWH-Systems</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/20">
            <Activity size={18} />
            <span className="text-sm font-medium">Relay: Active</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                <Cpu size={14} /> Device Identification
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Device Name</span>
                  <span className="text-sm font-mono text-blue-400">ESP32-BWH-01</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                <Zap size={14} /> Quick Actions
              </h3>
              <button 
                onClick={triggerReset}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-xl border border-red-500/20 transition-all font-semibold active:scale-95"
              >
                Trigger Remote Reset
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <MetricChart />
            <LiveTerminal />
          </div>
        </div>
      </div>
    </div>
  );
}