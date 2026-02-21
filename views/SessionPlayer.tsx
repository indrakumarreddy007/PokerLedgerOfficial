
import React, { useState, useEffect } from 'react';
import { User, Session, SessionPlayer as SessionPlayerType, BuyIn } from '../types';
import { api } from '../services/api';
import { Clock, Wallet, CheckCircle, AlertCircle, Plus, Zap, History, DollarSign, ShieldCheck } from 'lucide-react';

interface SessionPlayerProps {
  user: User;
  sessionCode: string;
  navigate: (path: string) => void;
}

export default function SessionPlayer({ user, sessionCode, navigate }: SessionPlayerProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<SessionPlayerType[]>([]);
  const [buyIns, setBuyIns] = useState<BuyIn[]>([]);
  const [allBuyIns, setAllBuyIns] = useState<BuyIn[]>([]);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [amount, setAmount] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const refreshData = async () => {
    const data = await api.getSession(sessionCode);
    if (data) {
      if (data.session.status === 'closed') {
        navigate(`settlement/${data.session.id}`);
        return;
      }
      setSession(data.session);
      setPlayers(data.players);

      const myBuyIns = data.buyIns.filter(b => b.userId === user.id).sort((a, b) => b.timestamp - a.timestamp);
      setBuyIns(myBuyIns);

      const sortedAll = [...data.buyIns].sort((a, b) => b.timestamp - a.timestamp);
      setAllBuyIns(sortedAll);

      const calculatedTotal = data.buyIns.filter(b => b.status === 'approved' || (b.status === 'pending' && b.amount < 0)).reduce((sum, b) => sum + b.amount, 0);
      setSessionTotal(calculatedTotal);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [sessionCode]);

  const totalApproved = buyIns.filter(b => b.status === 'approved').reduce((sum, b) => sum + b.amount, 0);
  const hasApprovedBuyIn = buyIns.some(b => b.status === 'approved' && b.amount > 0);

  const handleRequest = async (e: React.FormEvent, customAmount?: number) => {
    e.preventDefault();
    if (!session || !amount || parseFloat(amount) <= 0) return;
    const finalAmount = customAmount !== undefined ? customAmount : parseFloat(amount);

    if (finalAmount < 0 && Math.abs(finalAmount) > sessionTotal) {
      alert(`You cannot cashout more than the total session pool (₹${sessionTotal}).`);
      return;
    }

    await api.requestBuyIn(session.id, user.id, finalAmount);
    setAmount('');
    setIsRequesting(false);
    refreshData();
  };

  if (!session) return <div className="text-center py-20 text-slate-500 animate-pulse font-black">Connecting to Table...</div>;

  const isAdmin = session.createdBy === user.id;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter text-white drop-shadow-2xl">{session.name}</h1>
        <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest shadow-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Session • {session.blindValue} Blinds
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl text-center group transition-all hover:border-emerald-500/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
            <Wallet className="w-12 h-12" />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Buy-In</p>
          <p className="text-4xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">₹{totalApproved}</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl text-center flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
            <Zap className="w-12 h-12" />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Seat Role</p>
          <p className="text-xl font-black text-white uppercase tracking-tighter">{isAdmin ? 'Session Host' : 'Player'}</p>
        </div>
      </div>

      <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-emerald-500" />
            </div>
            Manage Stack
          </h2>
          {!isRequesting && (
            <button
              onClick={() => setIsRequesting(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/30 active:scale-95 flex items-center gap-2"
            >
              Request Chips
            </button>
          )}
        </div>

        {isRequesting && (
          <form onSubmit={handleRequest} className="p-6 bg-slate-950 border-2 border-emerald-500/30 rounded-3xl space-y-5 animate-in zoom-in-95 shadow-2xl">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount to Request</label>
                {isAdmin && <span className="text-[9px] font-black text-emerald-400 uppercase flex items-center gap-1.5"><Zap className="w-3 h-3 fill-current" /> Instant Approval</span>}
              </div>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500" />
                <input
                  type="number"
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-5 focus:ring-2 focus-ring-emerald-500 outline-none text-3xl font-black text-white"
                  placeholder="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <button type="button" onClick={(e) => { e.preventDefault(); if (amount) handleRequest(new Event('submit') as any, Math.abs(parseFloat(amount))); }} className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black uppercase shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                Buy-In
              </button>
              <button
                type="button"
                disabled={!hasApprovedBuyIn}
                onClick={(e) => { e.preventDefault(); if (amount) handleRequest(new Event('submit') as any, -Math.abs(parseFloat(amount))); }}
                className={`flex-1 py-4 bg-amber-500/20 text-amber-500 rounded-xl text-xs font-black uppercase border border-amber-500/30 transition-all ${!hasApprovedBuyIn ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}`}
              >
                Cashout
              </button>
              <button type="button" onClick={() => setIsRequesting(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-black text-slate-400 uppercase">Cancel</button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction Statement</h3>
          </div>

          {buyIns.length === 0 ? (
            <div className="text-center py-20 bg-slate-950/50 rounded-3xl border border-slate-800/50">
              <p className="text-slate-600 font-bold italic text-sm">No chip history found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {buyIns.map(b => (
                <div key={b.id} className="group flex items-center justify-between bg-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-2xl font-black transition-colors ${b.amount < 0 ? 'text-amber-400 group-hover:text-amber-300' : 'text-emerald-400 group-hover:text-emerald-300'}`}>₹{Math.abs(b.amount)}</p>
                      {b.status === 'approved' && <CheckCircle className="w-4 h-4 text-emerald-500/50" />}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      {b.amount < 0 ? 'Cashout' : 'Buy-In'} • {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div>
                    {b.status === 'pending' && (
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-5 py-2.5 rounded-full border border-amber-500/20 animate-pulse">
                        <Clock className="w-4 h-4" /> Awaiting Admin
                      </span>
                    )}
                    {b.status === 'approved' && (
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-5 py-2.5 rounded-full border border-emerald-400/20">
                        <CheckCircle className="w-4 h-4" /> Processed
                      </span>
                    )}
                    {b.status === 'rejected' && (
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase text-rose-400 bg-rose-400/10 px-5 py-2.5 rounded-full border border-rose-400/20">
                        <AlertCircle className="w-4 h-4" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="text-center pt-8 space-y-4 opacity-40">
        <ShieldCheck className="w-10 h-10 mx-auto text-slate-700" />
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Audit-Ready Environment
          </p>
          <p className="text-[9px] text-slate-600 max-w-[200px] mx-auto leading-relaxed">
            All requests are timestamped and recorded in the table's global ledger.
          </p>
        </div>
      </div>

      <section className="space-y-4 pt-12">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Global Table Audit Log
          </h2>
          <span className="text-[9px] font-bold text-slate-600 uppercase">Realtime Feed</span>
        </div>
        <div className="bg-slate-900/50 rounded-[2rem] border border-slate-800 p-2 max-h-80 overflow-y-auto custom-scrollbar shadow-inner">
          {allBuyIns.length === 0 ? (
            <div className="py-20 text-center text-slate-700 text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center opacity-20">♠</div>
              Feed Ready
            </div>
          ) : (
            allBuyIns.map((b, idx) => {
              const player = players.find(p => p.userId === b.userId);
              return (
                <div key={b.id} className={`flex items-center justify-between p-5 rounded-2xl transition-all hover:bg-white/[0.02] group ${idx % 2 === 0 ? 'bg-slate-950/20' : ''}`}>
                  <div className="flex items-center gap-5">
                    <div className="font-mono text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">
                      {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-200">{player?.name || 'Observer'}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        {b.amount < 0 ? 'Requested Cashout' : 'Attempted Buy-In'} <span className={b.amount < 0 ? 'text-amber-400' : 'text-emerald-400'}>₹{Math.abs(b.amount)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm ${b.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      b.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                      {b.status}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
