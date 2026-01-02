
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Participant, Entry, Match, TournamentEvent, MatchStatus } from './types.ts';
import { Trophy, Users, Swords, LogIn, LogOut, LayoutDashboard, ClipboardList, Bell, Eraser, Calendar, ChevronDown } from 'lucide-react';
import AdminParticipants from './components/AdminParticipants.tsx';
import AdminMatches from './components/AdminMatches.tsx';
import VisitorView from './components/VisitorView.tsx';
import { supabase } from './lib/supabase.ts';

interface TournamentData {
  participants: Participant[];
  entries: Entry[];
  matches: Match[];
  currentRound: number;
  youtubeLink: string;
  showLive: boolean;
  events: TournamentEvent[];
}

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('visitor');
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [data, setData] = useState<TournamentData>({
    participants: [],
    entries: [],
    matches: [],
    currentRound: 1,
    youtubeLink: '',
    showLive: true,
    events: []
  });
  const [motto, setMotto] = useState("Onde a tática encontra a precisão.");
  const [isLoading, setIsLoading] = useState(true);

  // Carrega dados baseados no ano selecionado
  useEffect(() => {
    const fetchYearData = async () => {
      setIsLoading(true);
      try {
        const { data: remoteData, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', selectedYear.toString())
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Erro ao carregar dados do ano:", error);
        } else if (remoteData) {
          setData({
            participants: remoteData.participants || [],
            entries: remoteData.entries || [],
            matches: remoteData.matches || [],
            currentRound: remoteData.current_round || 1,
            youtubeLink: remoteData.youtube_link || '',
            showLive: remoteData.show_live !== undefined ? remoteData.show_live : true,
            events: remoteData.events || []
          });
        } else {
          // Se não houver dados para o ano, inicializa zerado
          setData({
            participants: [],
            entries: [],
            matches: [],
            currentRound: 1,
            youtubeLink: '',
            showLive: true,
            events: []
          });
        }
      } catch (err) {
        console.error("Erro inesperado:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchYearData();

    // Inscrição em tempo real para o ID do ano selecionado
    const channel = supabase
      .channel(`tournament_${selectedYear}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${selectedYear}` },
        (payload: any) => {
          const newData = payload.new;
          if (newData) {
            setData({
              participants: newData.participants || [],
              entries: newData.entries || [],
              matches: newData.matches || [],
              currentRound: newData.current_round || 1,
              youtubeLink: newData.youtube_link || '',
              showLive: newData.show_live !== undefined ? newData.show_live : true,
              events: newData.events || []
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedYear]);

  const syncWithSupabase = useCallback(async (nextData: TournamentData) => {
    // Tenta fazer o update, se falhar por não existir (upsert), cria o registro do ano
    const { error } = await supabase
      .from('tournaments')
      .upsert({
        id: selectedYear.toString(),
        participants: nextData.participants,
        entries: nextData.entries,
        matches: nextData.matches,
        current_round: nextData.currentRound,
        youtube_link: nextData.youtubeLink,
        show_live: nextData.showLive,
        events: nextData.events,
        last_update: new Date().toISOString()
      });

    if (error) {
      console.error("Erro na sincronização:", error.message);
    }
  }, [selectedYear]);

  const updateData = (updater: (prev: TournamentData) => TournamentData) => {
    setData(prev => {
      const next = updater(prev);
      syncWithSupabase(next);
      return next;
    });
  };

  const handleRegisterParticipant = (participant: Participant, newEntries: Entry[]) => {
    updateData(prev => ({
      ...prev,
      participants: [...prev.participants, participant],
      entries: [...prev.entries, ...newEntries],
      // Use 'as const' to fix type inference for literal union types
      events: [{
        id: Math.random().toString(36).substring(7),
        type: 'registration' as const,
        message: `Novo Inscrito: ${participant.name}`,
        timestamp: Date.now()
      }, ...prev.events].slice(0, 100)
    }));
  };

  const handleRemoveParticipant = (id: string) => {
    updateData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== id),
      entries: prev.entries.filter(e => e.participantId !== id)
    }));
  };

  const handleEditParticipant = (id: string, newName: string) => {
    updateData(prev => ({
      ...prev,
      participants: prev.participants.map(p => p.id === id ? { ...p, name: newName } : p),
      entries: prev.entries.map(e => e.participantId === id ? { ...e, participantName: newName } : e)
    }));
  };

  const handleUpdateYoutube = (link: string, show: boolean) => {
    updateData(prev => ({ ...prev, youtubeLink: link, showLive: show }));
  };

  const handleResetTournament = () => {
    if (!confirm(`⚠️ ATENÇÃO: Isso apagará TODOS os dados de ${selectedYear}. Deseja continuar?`)) return;
    const resetData = { participants: [], entries: [], matches: [], currentRound: 1, youtubeLink: '', showLive: true, events: [] };
    setData(resetData);
    syncWithSupabase(resetData);
  };

  const handleResetRounds = () => {
    if (!confirm(`Resetar todas as rodadas de ${selectedYear}?`)) return;
    updateData(prev => ({
      ...prev,
      currentRound: 1,
      matches: [],
      entries: prev.entries.map(e => ({ ...e, status: 'active' as const, currentRound: 1 })),
      // Use 'as const' to fix type inference for literal union types
      events: [{
        id: Math.random().toString(36).substring(7),
        type: 'match-pending' as const,
        message: `Temporada ${selectedYear} reiniciada!`,
        timestamp: Date.now()
      }, ...prev.events]
    }));
  };

  const handleClearLogs = () => {
    if (!confirm("Limpar log de eventos deste ano?")) return;
    updateData(prev => ({ ...prev, events: [] }));
  };

  const handleUpdateMatchStatus = (matchId: string, newStatus: MatchStatus) => {
    updateData(prev => {
      const match = prev.matches.find(m => m.id === matchId);
      if (!match) return prev;
      const entry1 = prev.entries.find(e => e.number === match.entry1);
      const entry2 = prev.entries.find(e => e.number === match.entry2);
      const logMsg = newStatus === 'in-progress' ? `Em Andamento: ${entry1?.participantName} vs ${entry2?.participantName}` :
                     newStatus === 'pending' ? `Em Espera: ${entry1?.participantName} vs ${entry2?.participantName}` : 'Finalizado';
      
      return {
        ...prev,
        matches: prev.matches.map(m => m.id === matchId ? { ...m, status: newStatus } : m),
        // Use 'as const' to fix type inference for literal union types
        events: [{ id: Math.random().toString(36).substring(7), type: 'match-progress' as const, message: logMsg, timestamp: Date.now() }, ...prev.events].slice(0, 100)
      };
    });
  };

  const handleSetWinner = (matchId: string, winnerNumber: number) => {
    updateData(prev => {
      const match = prev.matches.find(m => m.id === matchId);
      if (!match) return prev;
      const winnerEntry = prev.entries.find(e => e.number === winnerNumber);
      const logMsg = `Ganhador: ${winnerEntry?.participantName} (#${winnerNumber})`;
      
      const nextMatches = prev.matches.map(m => m.id === matchId ? { ...m, winner: winnerNumber, status: 'finished' as const } : m);
      const nextEntries = prev.entries.map(e => {
        if (e.number === winnerNumber) return { ...e, currentRound: prev.currentRound + 1, status: 'active' as const };
        if (e.number === (match.entry1 === winnerNumber ? match.entry2 : match.entry1)) return { ...e, status: 'eliminated' as const };
        return e;
      });

      return {
        ...prev,
        matches: nextMatches,
        entries: nextEntries,
        // Use 'as const' to fix type inference for literal union types
        events: [{ id: Math.random().toString(36).substring(7), type: 'match-finished' as const, message: logMsg, timestamp: Date.now() }, ...prev.events].slice(0, 100)
      };
    });
  };

  const handleCreateMatch = (m: Match) => {
     updateData(prev => ({
       ...prev,
       matches: [...prev.matches, m],
       // Use 'as const' to fix type inference for literal union types
       events: [{ id: Math.random().toString(36).substring(7), type: 'match-pending' as const, message: `Sorteado: Mesa #${m.timestamp.toString().slice(-3)}`, timestamp: Date.now() }, ...prev.events].slice(0, 100)
     }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') { setIsAdmin(true); setView('admin-participants'); } else { alert('Senha incorreta!'); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('visitor')}>
              <Trophy className="w-6 h-6 text-emerald-500" />
              <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">SINUCA LIVE</h1>
            </div>

            {/* SELETOR DE ANO */}
            <div className="relative group">
              <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-black text-slate-300 hover:text-white transition-all">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Ano: {selectedYear}
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-32 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100]">
                {AVAILABLE_YEARS.map(year => (
                  <button 
                    key={year} 
                    onClick={() => setSelectedYear(year)}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold first:rounded-t-xl last:rounded-b-xl hover:bg-emerald-600 hover:text-white transition-colors ${selectedYear === year ? 'text-emerald-400 bg-emerald-400/5' : 'text-slate-400'}`}
                  >
                    Temporada {year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setView('visitor')} className={`p-2 rounded-lg ${view === 'visitor' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}><LayoutDashboard className="w-5 h-5" /></button>
            {isAdmin ? (
              <>
                <button onClick={() => setView('admin-participants')} title="Participantes" className={`p-2 rounded-lg ${view === 'admin-participants' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}><Users className="w-5 h-5" /></button>
                <button onClick={() => setView('admin-matches')} title="Confrontos" className={`p-2 rounded-lg ${view === 'admin-matches' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}><Swords className="w-5 h-5" /></button>
                <button onClick={() => setView('admin-logs')} title="Logs" className={`p-2 rounded-lg ${view === 'admin-logs' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}><ClipboardList className="w-5 h-5" /></button>
                <button onClick={() => setIsAdmin(false)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><LogOut className="w-5 h-5" /></button>
              </>
            ) : (
              <button onClick={() => setView('admin-login')} className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg"><LogIn className="w-5 h-5" /></button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Buscando Temporada {selectedYear}...</p>
          </div>
        ) : (
          <>
            {view === 'admin-login' && (
              <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-center text-white">Administração</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-center" placeholder="Senha de acesso..." required />
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-lg shadow-lg">Entrar</button>
                </form>
              </div>
            )}

            {view === 'admin-participants' && (
              <AdminParticipants participants={data.participants} entries={data.entries} youtubeLink={data.youtubeLink} showLive={data.showLive} onAddParticipant={handleRegisterParticipant} onRemoveParticipant={handleRemoveParticipant} onEditParticipant={handleEditParticipant} onUpdateYoutube={handleUpdateYoutube} onGenerateTestData={() => {}} onResetAll={handleResetTournament} />
            )}

            {view === 'admin-matches' && (
              <AdminMatches participants={data.participants} entries={data.entries} matches={data.matches} currentRound={data.currentRound} setCurrentRound={(val: any) => updateData(prev => ({ ...prev, currentRound: typeof val === 'function' ? val(prev.currentRound) : val }))} onStatusUpdate={handleUpdateMatchStatus} onWinnerSet={handleSetWinner} onMatchCreate={handleCreateMatch} onMatchDelete={(id) => updateData(prev => ({ ...prev, matches: prev.matches.filter(m => m.id !== id) }))} onMatchReset={(id) => updateData(prev => ({ ...prev, matches: prev.matches.map(m => m.id === id ? { ...m, winner: null, status: 'in-progress' } : m) }))} onToggleVisibility={(id) => updateData(prev => ({ ...prev, matches: prev.matches.map(m => m.id === id ? { ...m, isVisible: !m.isVisible } : m) }))} onResetRounds={handleResetRounds} />
            )}

            {view === 'admin-logs' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-white flex items-center gap-3"><ClipboardList className="w-8 h-8 text-emerald-500" /> Log {selectedYear}</h2>
                  <button onClick={handleClearLogs} className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-bold border border-red-500/30 flex items-center gap-2"><Eraser className="w-4 h-4" /> Limpar Logs</button>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-h-[600px] overflow-y-auto">
                  {data.events.length === 0 ? <div className="p-20 text-center text-slate-500 italic">Sem eventos para este ano.</div> : data.events.map(event => (
                    <div key={event.id} className="p-4 border-b border-slate-800 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
                      <div className={`p-2 rounded-lg ${event.type === 'registration' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}><Bell className="w-4 h-4" /></div>
                      <div><p className="font-bold text-slate-200">{event.message}</p><p className="text-[10px] text-slate-500 uppercase tracking-widest">{new Date(event.timestamp).toLocaleString()}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'visitor' && (
              <VisitorView entries={data.entries} matches={data.matches} currentRound={data.currentRound} motto={motto} youtubeLink={data.youtubeLink} showLive={data.showLive} events={data.events} selectedYear={selectedYear} />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
