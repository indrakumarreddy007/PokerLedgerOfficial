import React, { useState, useEffect, useCallback } from 'react';
import { User, Session, Group } from '../types';
import { api } from '../services/api';
import { Users, ChevronLeft, PlusCircle, Trophy, Activity, Loader2, ArrowRight, CheckCircle, Clock, Wallet } from 'lucide-react';

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

    // Balances state
    const [balances, setBalances] = useState<{ members: any[]; debts: any[]; history: any[] } | null>(null);
    const [balancesLoading, setBalancesLoading] = useState(false);
    const [settlingDebt, setSettlingDebt] = useState<string | null>(null); // "fromId_toId"
    const [settleAmount, setSettleAmount] = useState('');
    const [settleNote, setSettleNote] = useState('');
    const [settleError, setSettleError] = useState('');
    const [settleSuccess, setSettleSuccess] = useState('');

    // Tab state
    const [activeTab, setActiveTab] = useState<'tables' | 'leaderboard' | 'balances'>('tables');

    const fetchDetails = useCallback(async () => {
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
    }, [groupId, navigate]);

    const fetchBalances = useCallback(async () => {
        setBalancesLoading(true);
        const res = await api.getGroupBalances(groupId);
        if (res.success) {
            setBalances({ members: res.members || [], debts: res.debts || [], history: res.history || [] });
        }
        setBalancesLoading(false);
    }, [groupId]);

    useEffect(() => { fetchDetails(); }, [fetchDetails]);

    useEffect(() => {
        if (activeTab === 'balances') fetchBalances();
    }, [activeTab, fetchBalances]);

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

    const handleSettle = async (fromId: string, toId: string, maxAmount: number) => {
        const key = `${fromId}_${toId}`;
        setSettlingDebt(key);
        setSettleAmount(String(maxAmount));
        setSettleNote('');
        setSettleError('');
        setSettleSuccess('');
    };

    const confirmSettle = async (fromId: string, toId: string) => {
        const amount = parseFloat(settleAmount);
        if (isNaN(amount) || amount <= 0) {
            setSettleError('Enter a valid amount');
            return;
        }
        setSettleError('');
        const result = await api.settleGroupDebt(groupId, fromId, toId, amount, settleNote);
        if (result.success) {
            setSettleSuccess('Settled! ✓');
            setSettlingDebt(null);
            setTimeout(() => {
                setSettleSuccess('');
                fetchBalances();
            }, 1500);
        } else {
            setSettleError(result.error || 'Failed to settle');
        }
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
                    <Trophy className="w-4 h-4" /> Leaderboard
                </button>
                <button
                    onClick={() => setActiveTab('balances')}
                    className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${activeTab === 'balances' ? 'bg-emerald-500/10 text-emerald-400 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Wallet className="w-4 h-4" /> Balances
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">

                {/* ──── ACTIVE TABLES TAB ──── */}
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

                {/* ──── LEADERBOARD TAB ──── */}
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

                {/* ──── BALANCES TAB ──── */}
                {activeTab === 'balances' && (
                    <div className="space-y-6 animate-slide">
                        {balancesLoading ? (
                            <div className="flex items-center justify-center p-16">
                                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                            </div>
                        ) : !balances ? (
                            <div className="glass rounded-3xl py-12 text-center">
                                <p className="text-slate-500 font-bold">Could not load balances.</p>
                            </div>
                        ) : (
                            <>
                                {/* Settle success toast */}
                                {settleSuccess && (
                                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-3 rounded-2xl font-bold text-sm">
                                        <CheckCircle className="w-4 h-4" /> {settleSuccess}
                                    </div>
                                )}

                                {/* Who Owes Whom */}
                                <div>
                                    <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 px-1 mb-4">
                                        <Wallet className="w-3 h-3" /> Simplified Debts
                                        <span className="text-slate-600 font-normal normal-case tracking-normal">— auto-minimised transactions</span>
                                    </h2>

                                    {balances.debts.length === 0 ? (
                                        <div className="glass rounded-3xl py-12 text-center border border-emerald-500/10 bg-emerald-500/[0.02]">
                                            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                                            <p className="text-emerald-400 font-black">All square!</p>
                                            <p className="text-slate-500 text-xs mt-1">No outstanding debts in this group.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {balances.debts.map((debt, idx) => {
                                                const key = `${debt.from}_${debt.to}`;
                                                const isSettling = settlingDebt === key;
                                                const isMyDebt = debt.from === user.id;
                                                return (
                                                    <div key={idx} className="glass p-5 rounded-2xl border border-transparent hover:border-emerald-500/20 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${isMyDebt ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-700 text-slate-400'}`}>
                                                                    {debt.fromName.charAt(0)}
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className={`font-bold text-sm ${isMyDebt ? 'text-rose-400' : 'text-slate-200'}`}>{debt.fromName}</span>
                                                                    <ArrowRight className="w-4 h-4 text-slate-600" />
                                                                    <span className="font-bold text-sm text-emerald-400">{debt.toName}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 ml-4">
                                                                <span className="font-black text-rose-400 tabular-nums text-sm">₹{debt.amount.toLocaleString()}</span>
                                                                {(isMyDebt || user.id === debt.to) && !isSettling && (
                                                                    <button
                                                                        onClick={() => handleSettle(debt.from, debt.to, debt.amount)}
                                                                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-emerald-500/20"
                                                                    >
                                                                        Settle
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Inline settle form */}
                                                        {isSettling && (
                                                            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Record real cash payment</p>
                                                                <div className="flex gap-2">
                                                                    <div className="relative flex-1">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                                                        <input
                                                                            type="number"
                                                                            value={settleAmount}
                                                                            onChange={e => setSettleAmount(e.target.value)}
                                                                            min="1"
                                                                            step="1"
                                                                            className="w-full pl-7 pr-3 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-emerald-500 text-sm"
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        value={settleNote}
                                                                        onChange={e => setSettleNote(e.target.value)}
                                                                        placeholder="Note (optional)"
                                                                        className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                                                                    />
                                                                </div>
                                                                {settleError && <p className="text-rose-400 text-xs font-bold">{settleError}</p>}
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => { setSettlingDebt(null); setSettleError(''); }}
                                                                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-xs font-black uppercase tracking-wider"
                                                                    >Cancel</button>
                                                                    <button
                                                                        onClick={() => confirmSettle(debt.from, debt.to)}
                                                                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                                                    >Confirm Payment</button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Member Net Balance Summary */}
                                <div>
                                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1 mb-4">
                                        <Users className="w-3 h-3" /> Member Balances
                                    </h2>
                                    <div className="glass rounded-3xl overflow-hidden border border-white/5">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                                    <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Player</th>
                                                    <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Net Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {balances.members.map(m => (
                                                    <tr key={m.userId} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-5 py-3 font-bold text-slate-200 text-sm">
                                                            {m.name}
                                                            {m.userId === user.id && <span className="ml-2 text-[8px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded uppercase">You</span>}
                                                        </td>
                                                        <td className={`px-5 py-3 text-right font-black tabular-nums text-sm ${m.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {m.balance >= 0 ? '+' : ''}₹{Math.abs(m.balance).toLocaleString()}
                                                            <span className="block text-[9px] font-normal text-slate-600">
                                                                {m.balance > 0.01 ? 'is owed' : m.balance < -0.01 ? 'owes' : 'settled'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Settlement History */}
                                {balances.history.length > 0 && (
                                    <div>
                                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1 mb-4">
                                            <Clock className="w-3 h-3" /> Settlement History
                                        </h2>
                                        <div className="space-y-2">
                                            {balances.history.map(s => (
                                                <div key={s.id} className="glass px-5 py-3 rounded-2xl flex items-center justify-between border border-white/[0.03]">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-300">
                                                            <span className="text-rose-400">{s.payerName}</span>
                                                            <span className="text-slate-500 mx-1.5">paid</span>
                                                            <span className="text-emerald-400">{s.receiverName}</span>
                                                        </p>
                                                        {s.note && <p className="text-[10px] text-slate-600 mt-0.5">{s.note}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-sm text-emerald-400">₹{s.amount.toLocaleString()}</p>
                                                        <p className="text-[9px] text-slate-600">{new Date(s.settledAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
