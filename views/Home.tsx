
import React, { useState, useEffect } from 'react';
import { User, PlayerStats, Session, Group } from '../types';
import { api } from '../services/api';
import { PlusCircle, Key, History, LayoutDashboard, Activity, Users, ChevronRight, Zap } from 'lucide-react';

interface HomeProps {
  user: User;
  onLogout: () => void;
  navigate: (path: string) => void;
  initialCode?: string;
}

export default function Home({ user, navigate, initialCode }: HomeProps) {
  const [sessionName, setSessionName] = useState('');
  const [blindValue, setBlindValue] = useState('10/20');
  const [joinCode, setJoinCode] = useState(initialCode || '');
  const [joinError, setJoinError] = useState('');
  const [activeTab, setActiveTab] = useState<'dash' | 'create' | 'join'>(initialCode ? 'join' : 'dash');

  // Group join state
  const [groupJoinCode, setGroupJoinCode] = useState('');
  const [groupJoinError, setGroupJoinError] = useState('');
  const [groupJoinLoading, setGroupJoinLoading] = useState(false);
  const [showGroupJoin, setShowGroupJoin] = useState(false);


  const [history, setHistory] = useState<Session[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<PlayerStats>({ weeklyPL: 0, monthlyPL: 0, yearlyPL: 0, totalPL: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const p1 = api.getSessions();
      const p2 = api.getUserStats(user.id);
      const p3 = api.getGroups(user.id);

      const [allSessions, s, userGroups] = await Promise.all([p1, p2, p3]);

      setHistory(allSessions);
      setStats(s);
      setGroups(userGroups);
    };
    fetchData();
  }, [user.id]);

  // Add state for creation error
  const [createError, setCreateError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName) return;
    setCreateError('');

    const result = await api.createSession(sessionName, blindValue, user.id);

    if (result.success && result.session) {
      navigate(`admin/${result.session.sessionCode}`);
    } else {
      setCreateError(result.error || 'Failed to create session.');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await api.joinSession(joinCode, user.id);
    if (result.success && result.sessionId) {
      const sessionData = await api.getSession(result.sessionId);
      if (sessionData && sessionData.session.createdBy === user.id) {
        navigate(`admin/${sessionData.session.sessionCode}`);
      } else {
        navigate(`player/${sessionData.session.sessionCode}`);
      }
    } else {
      setJoinError(result.error || 'Failed to join table.');
    }
  };

  const handleGroupJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupJoinCode.trim()) return;
    setGroupJoinLoading(true);
    setGroupJoinError('');
    const result = await api.joinGroup(user.id, groupJoinCode.trim().toUpperCase());
    if (result.success && result.groupId) {
      // Refresh groups list then navigate to group
      const updatedGroups = await api.getGroups(user.id);
      setGroups(updatedGroups || []);
      setShowGroupJoin(false);
      setGroupJoinCode('');
      navigate(`group/${result.groupId}`);
    } else {
      setGroupJoinError(result.error || 'Invalid group code.');
    }
    setGroupJoinLoading(false);
  };

  const StatCard = ({ title, val, color }: { title: string, val: number, color: string }) => (
    <div className={`glass p-4 rounded-2xl border-l-4 ${color} transition-all hover:translate-y-[-2px] hover:shadow-2xl`}>
      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.15em] mb-1">{title}</p>
      <p className={`text-2xl font-black tabular-nums ${val >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {val >= 0 ? '+' : ''}₹{Math.abs(val).toLocaleString()}
      </p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto px-2">
      {/* P/L Dashboard Section */}
      <section className="animate-slide">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3 h-3" /> Performance Insights
          </h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-[9px] font-bold text-emerald-500/80 uppercase">Realtime Sync</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Week" val={stats.weeklyPL} color="border-emerald-500" />
          <StatCard title="Month" val={stats.monthlyPL} color="border-sky-500" />
          <StatCard title="Year" val={stats.yearlyPL} color="border-amber-500" />
          <StatCard title="Lifetime" val={stats.totalPL} color="border-purple-500" />
        </div>
      </section>

      {/* Control Tabs */}
      <div className="glass p-1.5 rounded-2xl flex gap-1">
        {[
          { id: 'dash', label: 'Lobby', icon: LayoutDashboard, color: 'text-emerald-400' },
          { id: 'create', label: 'Host', icon: PlusCircle, color: 'text-sky-400' },
          { id: 'join', label: 'Join', icon: Key, color: 'text-amber-400' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 transition-all duration-300 ${activeTab === tab.id ? 'bg-white/10 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : 'opacity-40'}`} />
            <span className={activeTab === tab.id ? 'text-white' : ''}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'dash' && (
          <div className="space-y-8 animate-slide">

            {/* Groups Section */}
            <div>
              <div className="flex items-center justify-between px-1 mb-4">
                <h2 className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-3 h-3" /> My Groups
                </h2>
                <button onClick={() => navigate('group/create')} className="text-[10px] font-black tracking-widest uppercase text-sky-400 hover:text-white transition-colors flex items-center gap-1 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-500/20">
                  <PlusCircle className="w-3 h-3" /> New
                </button>
              </div>

              {groups.length === 0 ? (
                <div className="glass rounded-3xl py-8 px-6 text-center border-dashed border-sky-500/20">
                  <p className="text-slate-500 font-bold mb-4 text-sm">No groups joined yet.</p>
                  {showGroupJoin ? (
                    <form onSubmit={handleGroupJoin} className="flex flex-col gap-3">
                      <input
                        type="text"
                        value={groupJoinCode}
                        onChange={e => setGroupJoinCode(e.target.value.toUpperCase())}
                        placeholder="Enter 6-digit group code"
                        maxLength={6}
                        className="w-full bg-slate-900/50 border border-sky-500/30 rounded-xl px-4 py-3 text-sky-400 font-mono font-bold text-center tracking-[0.3em] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 uppercase placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-normal"
                        autoFocus
                      />
                      {groupJoinError && <p className="text-rose-400 text-xs font-bold">{groupJoinError}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setShowGroupJoin(false); setGroupJoinError(''); setGroupJoinCode(''); }}
                          className="flex-1 py-2 bg-white/5 text-slate-400 rounded-xl text-xs font-black uppercase tracking-wider transition-colors hover:bg-white/10"
                        >Cancel</button>
                        <button
                          type="submit"
                          disabled={groupJoinLoading || groupJoinCode.length < 6}
                          className="flex-1 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                        >{groupJoinLoading ? 'Joining...' : 'Join Group'}</button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowGroupJoin(true)}
                      className="text-sky-400 font-black text-xs uppercase tracking-wider hover:text-white transition-colors border border-sky-500/20 px-4 py-2 rounded-full bg-sky-500/10"
                    >Join via Code</button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groups.map(g => (
                    <div
                      key={g.id}
                      onClick={() => navigate(`group/${g.id}`)}
                      className="glass group p-4 rounded-2xl cursor-pointer hover:bg-sky-500/5 transition-all border border-transparent hover:border-sky-500/20 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-black shadow-inner">
                        {g.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-200 group-hover:text-sky-400 transition-colors text-sm">{g.name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono">{g.memberCount ?? g.member_count ?? '—'} Members</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Existing Quick Play Sessions */}
            <div>
              <div className="flex items-center justify-between px-1 mb-4">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <History className="w-3 h-3" /> Quick Play History
                </h2>
              </div>

              {history.length === 0 ? (
                <div className="glass rounded-3xl py-16 text-center">
                  <p className="text-slate-500 font-bold mb-4">No active seats found.</p>
                  <button onClick={() => setActiveTab('create')} className="px-6 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-black border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all">Start a Game</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        if (s.status === 'closed') navigate(`settlement/${s.id}`);
                        else if (s.createdBy === user.id) navigate(`admin/${s.sessionCode}`);
                        else navigate(`player/${s.sessionCode}`);
                      }}
                      className="glass group p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:bg-white/[0.03] active:scale-[0.98] border border-white/[0.02] hover:border-emerald-500/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-800 text-slate-500'}`}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">{s.name}</h3>
                          <p className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                            {s.sessionCode} <span className="opacity-30">•</span> {new Date(s.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                          {s.status}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-emerald-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="glass p-8 rounded-3xl animate-slide">
            <h2 className="text-xl font-black mb-6 text-emerald-400">Initialize Table</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Room Name</label>
                <input
                  type="text"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-700 font-bold"
                  placeholder="The VIP Lounge"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Table Blinds</label>
                <input
                  type="text"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-mono"
                  placeholder="10 / 20"
                  value={blindValue}
                  onChange={(e) => setBlindValue(e.target.value)}
                />
              </div>
              {createError && <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest animate-bounce mb-4">{createError}</p>}
              <button
                type="submit"
                disabled={!sessionName}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" /> Open Table
              </button>
            </form>
          </div>
        )}

        {activeTab === 'join' && (
          <div className="glass p-8 rounded-3xl animate-slide text-center">
            <h2 className="text-xl font-black mb-2 text-amber-400">Find Table</h2>
            <p className="text-slate-500 text-xs mb-8 font-medium italic">Enter the unique 6-digit access code provided by host.</p>
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="relative group">
                <input
                  type="text"
                  className="w-full bg-black/40 border-2 border-white/5 rounded-3xl px-6 py-8 focus:border-amber-500/50 outline-none transition-all uppercase font-mono tracking-[0.6em] text-4xl text-center text-amber-400 placeholder:text-slate-900"
                  placeholder="••••••"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase());
                    setJoinError('');
                  }}
                />
                <div className="absolute inset-0 rounded-3xl border border-amber-500/0 group-hover:border-amber-500/10 pointer-events-none transition-all"></div>
              </div>
              {joinError && <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest animate-bounce">{joinError}</p>}
              <button
                type="submit"
                disabled={joinCode.length < 4}
                className="w-full py-5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95"
              >
                Sit In
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
