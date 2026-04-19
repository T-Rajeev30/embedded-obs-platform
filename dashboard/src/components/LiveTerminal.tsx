"use client"; // Required for real-time updates
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function LiveTerminal() {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        // Connect to your Node.js Relay (Port 4000)
        const socket = io('http://localhost:4000');

        socket.on('new-log', (log) => {
            // Add new log to the top and keep only the last 50
            setLogs(prev => [log, ...prev].slice(0, 50));
        });

        return () => { socket.disconnect(); };
    }, []);

    return (
        <div className="w-full bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">REMOTE_CONSOLE v1.0</span>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
            </div>
            <div className="p-4 h-[400px] overflow-y-auto font-mono text-sm space-y-1 scrollbar-hide">
                {logs.length === 0 && <p className="text-slate-600 animate-pulse">Awaiting device connection...</p>}
                {logs.map((log, index) => (
                    <div key={index} className="flex gap-3 border-b border-slate-900/50 pb-1">
                        <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                        <span className={log.lvl === 'ERROR' ? 'text-red-400' : 'text-blue-400 font-bold'}>
                            {log.lvl}
                        </span>
                        <span className="text-slate-300 italic">[{log.sid}]</span>
                        <span className="text-slate-100">{log.msg}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}