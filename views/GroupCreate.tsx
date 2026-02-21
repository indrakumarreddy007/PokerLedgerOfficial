import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { Users, ChevronLeft, Loader2 } from 'lucide-react';

interface GroupCreateProps {
    user: User;
    navigate: (path: string) => void;
}

export default function GroupCreate({ user, navigate }: GroupCreateProps) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        setError('');

        const res = await api.createGroup(name, user.id);
        if (res.success && res.group) {
            navigate(`group/${res.group.id}`);
        } else {
            setError(res.error || 'Failed to create group');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto animate-slide">
            <div className="flex items-center gap-4 mb-8 text-slate-400">
                <button
                    onClick={() => navigate('home')}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-black text-slate-200">New Group</h1>
            </div>

            <div className="glass p-8 rounded-3xl">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 mx-auto mb-6">
                    <Users className="w-8 h-8" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Group Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Friday Night Poker"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium placeholder:text-slate-600"
                            maxLength={30}
                            autoFocus
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim() || loading}
                        className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Group'}
                    </button>

                    {error && (
                        <div className="bg-rose-500/10 text-rose-400 p-3 rounded-xl border border-rose-500/20 text-xs font-bold text-center">
                            {error}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
