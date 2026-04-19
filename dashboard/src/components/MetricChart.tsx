"use client";
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MetricChart() {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const socket = io('http://localhost:4000');
        
        socket.on('new-log', (log) => {
            // Only plot if the message contains our heap data
            if (log.type === "METRIC" && log.msg.includes("heap_kb")) {
                const numericValue = parseFloat(log.msg.split(':')[1]);
                
                const point = {
                    time: new Date().toLocaleTimeString().split(' ')[0],
                    val: numericValue
                };

                setData(prev => [...prev.slice(-29), point]); // Show last 30 points
            }
        });

        return () => { socket.disconnect(); };
    }, []);

    return (
        <div className="w-full bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-inner" style={{ height: '350px' }}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Memory Telemetry (KB)</h3>
                <span className="text-[10px] text-blue-500 font-mono animate-pulse">LIVE STREAM</span>
            </div>
            <ResponsiveContainer width="100%" height="80%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#3b82f6', fontSize: '12px' }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="val" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }} 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}