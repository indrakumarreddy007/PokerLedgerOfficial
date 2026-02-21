import React, { useState, useEffect } from 'react';
import { User, Session, Group } from '../types';
import { api } from '../services/api';
import { Users, ChevronLeft, Key, PlusCircle, Trophy, Activity, Loader2 } from 'lucide-react';

interface GroupDashboardProps {
    user: User;
    groupId: string;
    navigate: (path: string) => void;
}

export default function GroupDashboard({ user, groupId, navigate }: GroupDashboardProps) {
    const [group, setGroup] = useState<Group | null>(null);
    const [activeSessions, setActiveSessions] = useState<Session[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningSession, setJoiningSession] = useState(false);
    const [hostingSession, setHostingSession] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');
    const [blindValue, setBlindValue] = useState('10/20');

    // Tab state for switching between active tables and leaderboard
    const [activeTab, setActiveTab] = useState<'tables' | 'leaderboard'>('tables');

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const res = await api.getGroupDetails(groupId);
            if (res.success && res.group) {
                setGroup(res.group);
                setActiveSessions(res.activeSessions || []);
                setLeaderboard(res.leaderboard || []);
            } else {
                navigate('home');
            }
            setLoading(false);
        };
        fetchDetails();
    }, [groupId, navigate]);

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSessionName.trim()) return;
        const res = await api.createSession(newSessionName, blindValue, user.id, groupId);
        if (res.success && res.session) {
            navigate(`admin/${res.session.sessionCode}`);
        }
    };

    const handleJoinSession = async (sessionCode: string) => {
        setJoiningSession(true);
        const result = await api.joinSession(sessionCode, user.id);
        if (result.success && result.sessionId) {
            navigate(`player/${sessionCode}`);
        }
        setJoiningSession(false);
    };

    if (loading || !group) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto animate-slide space-y-6">
            {/* Header */}
            <div className="glass p-6 rounded-3xl border-t border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                        <button
                            onClick={() => navigate('home')}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-400 transition-colors flex items-center gap-1"
                        >
                            <ChevronLeft className="w-3 h-3" /> Back
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Group Code:</span>
                            <span className="px-2 py-1 bg-sky-500/10 text-sky-400 font-mono font-bold rounded">{group.joinCode}</span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between mt-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-100 tracking-tight">{group.name}</h1>
                            <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-2">
                                <Users className="w-4 h-4" /> {leaderboard.length} Members
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="glass p-1.5 rounded-2xl flex gap-1">
                <button
                    onClick={() => setActiveTab('tables')}
                    className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${activeTab === 'tables' ? 'bg-sky-500/10 text-sky-400 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Activity className="w-4 h-4" /> Active Tables
                </button>
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${activeTab === 'leaderboard' ? 'bg-amber-500/10 text-amber-500 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Trophy className="w-4 h-4" /> All-Time Leaderboard
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'tables' && (
                    <div className="space-y-6 animate-slide">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Live Sessions
                            </h2>
                            <button onClick={() => setHostingSession(!hostingSession)} className="text-[10px] font-black tracking-widest uppercase text-sky-400 hover:text-white transition-colors flex items-center gap-1">
                                {hostingSession ? 'Cancel' : <><PlusCircle className="w-3 h-3" /> Host Session</>}
                            </button>
                        </div>

                        {hostingSession && (
                            <form onSubmit={handleCreateSession} className="glass p-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Table Name"
                                    value={newSessionName}
                                    onChange={e => setNewSessionName(e.target.value)}
                                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-3 text-sm font-bold focus:border-sky-500 outline-none"
                                    required
                                />
                                <button type="submit" className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-colors">
                                    Start
                                </button>
                            </form>
                        )}

                        {activeSessions.length === 0 ? (
                            <div className="glass rounded-3xl py-16 text-center border-dashed border-slate-700/50">
                                <p className="text-slate-500 font-bold mb-4">No tables running right now.</p>
                                <button onClick={() => setHostingSession(true)} className="px-6 py-2 bg-sky-500/10 text-sky-400 rounded-full text-xs font-black border border-sky-500/20 hover:bg-sky-500 hover:text-slate-950 transition-all">Host a Table</button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeSessions.map(s => (
                                    <div key={s.id} className="glass p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-sky-500/20 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-black shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                                                {s.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-100 group-hover:text-sky-400 transition-colors">{s.name}</h3>
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Blinds: {s.blindValue}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => s.createdBy === user.id ? navigate(`admin/${s.sessionCode}`) : handleJoinSession(s.sessionCode)}
                                            disabled={joiningSession}
                                            className="px-5 py-2 bg-sky-500/10 hover:bg-sky-500 hover:text-slate-950 text-sky-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-sky-500/20"
                                        >
                                            {s.createdBy === user.id ? 'Manage' : 'Join Table'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="space-y-4 animate-slide">
                        <div className="glass rounded-3xl overflow-hidden border border-white/5">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Player</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Net Return</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {leaderboard.map((member, idx) => (
                                        <tr key={member.user_id} className={`transition-colors hover:bg-white/[0.02] ${idx < 3 ? 'bg-amber-500/[0.02]' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-6 text-center text-xs font-black ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-orange-400' : 'text-slate-600'}`}>
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="font-bold text-slate-200">{member.name} {member.role === 'owner' && <span className="ml-2 text-[8px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded uppercase">Admin</span>}</span>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-black tabular-nums ${Number(member.net_winnings) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {Number(member.net_winnings) >= 0 ? '+' : ''}₹{Math.abs(Number(member.net_winnings)).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
