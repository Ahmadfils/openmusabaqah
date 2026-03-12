'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';

interface ScoringRow {
    id: string;
    tajweed: number | '';
    memorization: number | '';
}

interface ScoringTableProps {
    onTotalChange: (total: number) => void;
}

export default function ScoringTable({ onTotalChange }: ScoringTableProps) {
    const [rows, setRows] = useState<ScoringRow[]>([
        { id: Math.random().toString(36).substr(2, 9), tajweed: '', memorization: '' }
    ]);

    const maxTajweed = 30;
    const maxMemorization = 70;

    const addRow = () => {
        setRows([...rows, { id: Math.random().toString(36).substr(2, 9), tajweed: '', memorization: '' }]);
    };

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter(row => row.id !== id));
        } else {
            setRows([{ id: Math.random().toString(36).substr(2, 9), tajweed: '', memorization: '' }]);
        }
    };

    const updateRow = (id: string, field: 'tajweed' | 'memorization', value: string) => {
        const numValue = value === '' ? '' : parseFloat(value);
        
        // Prevent values that would make the total negative for that column
        // (Though deductions can be anything, usually they shouldn't exceed the max)
        
        setRows(rows.map(row => {
            if (row.id === id) {
                return { ...row, [field]: numValue };
            }
            return row;
        }));
    };

    const tajweedDeductions = rows.reduce((sum, row) => sum + (typeof row.tajweed === 'number' ? row.tajweed : 0), 0);
    const memorizationDeductions = rows.reduce((sum, row) => sum + (typeof row.memorization === 'number' ? row.memorization : 0), 0);

    const tajweedScore = Math.max(0, maxTajweed - tajweedDeductions);
    const memorizationScore = Math.max(0, maxMemorization - memorizationDeductions);
    const totalScore = tajweedScore + memorizationScore;

    useEffect(() => {
        onTotalChange(totalScore);
    }, [totalScore, onTotalChange]);

    return (
        <div className="glass-card p-4 space-y-4">
            <h2 className="flex items-center gap-2 text-white font-bold mb-2 text-xs">
                <Calculator size={14} className="text-gold-400" /> Interactive Scoring
            </h2>

            <div className="overflow-x-auto max-h-[300px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="py-2 px-1 text-[9px] text-turquoise-500 font-bold uppercase tracking-widest w-8">#</th>
                            <th className="py-2 px-1 text-[9px] text-turquoise-500 font-bold uppercase tracking-widest text-center">Tajweed (30)</th>
                            <th className="py-2 px-1 text-[9px] text-turquoise-500 font-bold uppercase tracking-widest text-center">Memorization (70)</th>
                            <th className="py-2 px-1 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {rows.map((row, index) => (
                            <tr key={row.id} className="group hover:bg-white/5 transition-colors">
                                <td className="py-2 px-1 text-turquoise-400 font-mono text-xs">{index + 1}</td>
                                <td className="py-2 px-1">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={row.tajweed}
                                        onChange={(e) => updateRow(row.id, 'tajweed', e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-turquoise-900/40 border border-turquoise-700/30 rounded-lg px-2 py-2.5 text-white text-center focus:outline-none focus:border-gold-500/50 transition-all text-sm font-bold"
                                    />
                                </td>
                                <td className="py-2 px-1">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={row.memorization}
                                        onChange={(e) => updateRow(row.id, 'memorization', e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-turquoise-900/40 border border-turquoise-700/30 rounded-lg px-2 py-2.5 text-white text-center focus:outline-none focus:border-gold-500/50 transition-all text-sm font-bold"
                                    />
                                </td>
                                <td className="py-2 px-1 text-right">
                                    <button
                                        onClick={() => removeRow(row.id)}
                                        className="text-turquoise-700 hover:text-red-400 transition-colors p-1"
                                        title="Remove row"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button
                onClick={addRow}
                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-turquoise-800/40 rounded-xl text-turquoise-500 hover:border-gold-500/40 hover:text-gold-400 transition-all text-[10px] font-bold uppercase tracking-widest bg-turquoise-950/20"
            >
                <Plus size={14} /> Add Deduction Row
            </button>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                <div className="text-center p-2 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[8px] text-turquoise-500 font-bold uppercase tracking-widest mb-0.5">Tajweed</p>
                    <p className="text-lg font-black text-white">{tajweedScore.toFixed(1)}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[8px] text-turquoise-500 font-bold uppercase tracking-widest mb-0.5">Memorization</p>
                    <p className="text-lg font-black text-white">{memorizationScore.toFixed(1)}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-gold-500/10 border border-gold-500/30">
                    <p className="text-[8px] text-gold-500 font-bold uppercase tracking-widest mb-0.5">Total</p>
                    <p className="text-xl font-black text-gold-400">{totalScore.toFixed(1)}</p>
                </div>
            </div>
        </div>
    );
}
