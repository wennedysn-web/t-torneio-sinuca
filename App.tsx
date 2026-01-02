
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Participant, Entry, Match, TournamentEvent, MatchStatus } from './types.ts';
import { Trophy, Users, Swords, LogIn, LogOut, LayoutDashboard, AlertTriangle, RefreshCcw, Trash2, ClipboardList, Bell } from 'lucide-react';
import AdminParticipants from './components/AdminParticipants.tsx';
import AdminMatches from './components/AdminMatches.tsx';
import VisitorView from './components/VisitorView.tsx';
import { GoogleGenAI } from "@google/genai";
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

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('visitor');
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
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

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: remoteData, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', 'main')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Erro ao carregar dados:", error);
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
        }
      } catch (err) {
        console.error("Erro inesperado:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    const channel = supabase
      .channel('tournament_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments', filter: 'id=eq.main' },
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
  }, []);

  const syncWithSupabase = useCallback(async (nextData: TournamentData) => {
    const { error } = await supabase
      .from('tournaments')
      .update({
        participants: nextData.participants,
        entries: nextData.entries,
        matches: nextData.matches,
        current_round: nextData.currentRound,
        youtube_link: nextData.youtubeLink,
        show_live: nextData.showLive,
        events: nextData.events,
        last_update: new Date().toISOString()
      })
      .eq('id', 'main');

    if (error) {
      console.error("Erro na sincronização:", error.message);
    }
  }, []);

  const addEvent = (type: TournamentEvent['type'], message: string, details?: any) => {
    const newEvent: TournamentEvent = {
      id: Math.random().toString(36).substring(7),
      type,
      message,
      timestamp: Date.now(),
      details
    };
    
    updateData(prev => ({
      ...prev,
      events: [newEvent, ...prev.events].slice(0, 100) // Mantém os últimos 100 logs
    }));
  };

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
      entries: [...prev.entries, ...newEntries]
    }));
    addEvent('registration', `Novo Inscrito: ${participant.name}`, { 
      name: participant.name, 
      numbers: participant.entryNumbers 
    });
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
    if (!confirm("⚠️ ATENÇÃO: Isso apagará TODOS os dados. Deseja continuar?")) return;
    const resetData = { participants: [], entries: [], matches: [], currentRound: 1, youtubeLink: '', showLive: true, events: [] };
    setData(resetData);
    syncWithSupabase(resetData);
  };

  const handleUpdateMatchStatus = (matchId: string, newStatus: MatchStatus) => {
    updateData(prev => {
      const match = prev.matches.find(m => m.id === matchId);
      if (!match) return prev;
      
      const entry1 = prev.entries.find(e => e.number === match.entry1);
      const entry2 = prev.entries.find(e => e.number === match.entry2);
      const names = `${entry1?.participantName || '---'} vs ${entry2?.participantName || '---'}`;

      const logType = newStatus === 'in-progress' ? 'match-progress' : 
                      newStatus === 'pending' ? 'match-pending' : 'match-finished';
      
      const logMsg = newStatus === 'in-progress' ? `Confronto em Andamento: ${names}` :
                     newStatus === 'pending' ? `Confronto em Espera: ${names}` : `Confronto Finalizado: ${names}`;

      // Envia o log
      const newEvent: TournamentEvent = {
        id: Math.random().toString(36).substring(7),
        type: logType as any,
        message: logMsg,
        timestamp: Date.now(),
        details: { names }
      };

      return {
        ...prev,
        matches: prev.matches.map(m => m.id === matchId ? { ...m, status: newStatus } : m),
        events: [newEvent, ...prev.events].slice(0, 100)
      };
    });
  };

  const handleSetWinner = (matchId: string, winnerNumber: number) => {
    updateData(prev => {
      const match = prev.matches.find(m => m.id === matchId);
      if (!match) return prev;
      
      const loserNumber = match.entry1 === winnerNumber ? match.entry2 : match.entry1;
      const winnerEntry = prev.entries.find(e => e.number === winnerNumber);
      const loserEntry = prev.entries.find(e => e.number === loserNumber);
      
      const logMsg = `Finalizado: ${winnerEntry?.participantName} venceu ${loserEntry?.participantName || 'BYE'}`;
      
      const newEvent: TournamentEvent = {
        id: Math.random().toString(36).substring(7),
        type: 'match-finished',
        message: logMsg,
        timestamp: Date.now(),
        details: { winner: winnerEntry?.participantName, winnerNum: winnerNumber }
      };

      const nextMatches = prev.matches.map(m => m.id === matchId ? { ...m, winner: winnerNumber, status: 'finished' as const } : m);
      const nextEntries = prev.entries.map(e => {
        if (e.number === winnerNumber) return { ...e, currentRound: prev.currentRound + 1, status: 'active' as const };
        if (e.number === loserNumber) return { ...e, status: 'eliminated' as const };
        return e;
      });

      return {
        ...prev,
        matches: nextMatches,
        entries: nextEntries,
        events: [newEvent, ...prev.events].slice(0, 100)
      };
    });
  };

  const handleCreateMatch = (m: Match) => {
     updateData(prev => {
       const entry1 = prev.entries.find(e => e.number === m.entry1);
       const entry2 = prev.entries.find(e => e.number === m.entry2);
       const names = `${entry1?.participantName} vs ${entry2?.participantName}`;
       
       const newEvent: TournamentEvent = {
         id: Math.random().toString(36).substring(7),
         type: 'match-pending',
         message: `Confronto Criado: ${names}`,
         timestamp: Date.now(),
         details: { names }
       };

       return {
         ...prev,
         matches: [...prev.matches, m],
         events: [newEvent, ...prev.events].slice(0, 100)
       };
     });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      setIsAdmin(true);
      setView('admin-participants');
    } else {
      alert('Senha incorreta!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse">Carregando Sinuca Live...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('visitor')}>
            <Trophy className="w-6 h-6 text-emerald-500" />
            <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">SINUCA LIVE</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('visitor')} className={`p-2 rounded-lg ${view === 'visitor' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>
              <LayoutDashboard className="w-5 h-5" />
            </button>
            {isAdmin ? (
              <>
                <button onClick={() => setView('admin-participants')} title="Participantes" className={`p-2 rounded-lg ${view === 'admin-participants' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>
                  <Users className="w-5 h-5" />
                </button>
                <button onClick={() => setView('admin-matches')} title="Confrontos" className={`p-2 rounded-lg ${view === 'admin-matches' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>
                  <Swords className="w-5 h-5" />
                </button>
                <button onClick={() => setView('admin-logs')} title="Logs do Sistema" className={`p-2 rounded-lg ${view === 'admin-logs' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>
                  <ClipboardList className="w-5 h-5" />
                </button>
                <button onClick={() => setIsAdmin(false)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><LogOut className="w-5 h-5" /></button>
              </>
            ) : (
              <button onClick={() => setView('admin-login')} className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg"><LogIn className="w-5 h-5" /></button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'admin-login' && (
          <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Acesso Administrativo</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                placeholder="Senha de acesso..."
                required
              />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-lg shadow-lg">Entrar</button>
            </form>
          </div>
        )}

        {view === 'admin-participants' && (
          <div className="space-y-12">
            <AdminParticipants 
              participants={data.participants} 
              entries={data.entries}
              youtubeLink={data.youtubeLink}
              showLive={data.showLive}
              onAddParticipant={handleRegisterParticipant}
              onRemoveParticipant={handleRemoveParticipant}
              onEditParticipant={handleEditParticipant}
              onUpdateYoutube={handleUpdateYoutube}
              onGenerateTestData={() => {}}
            />
          </div>
        )}

        {view === 'admin-matches' && (
          <div className="space-y-12">
            <AdminMatches 
              participants={data.participants}
              entries={data.entries}
              setEntries={() => {}} // Não usado mais diretamente, centralizado via handlers no App
              matches={data.matches}
              setMatches={() => {}} // Centralizado
              currentRound={data.currentRound}
              setCurrentRound={(val: any) => updateData(prev => ({ ...prev, currentRound: typeof val === 'function' ? val(prev.currentRound) : val }))}
              // Injeção de novos handlers com log
              onStatusUpdate={handleUpdateMatchStatus}
              onWinnerSet={handleSetWinner}
              onMatchCreate={handleCreateMatch}
              onMatchDelete={(id) => updateData(prev => ({ ...prev, matches: prev.matches.filter(m => m.id !== id) }))}
              onMatchReset={(id) => updateData(prev => ({ ...prev, matches: prev.matches.map(m => m.id === id ? { ...m, winner: null, status: 'in-progress' } : m) }))}
              onToggleVisibility={(id) => updateData(prev => ({ ...prev, matches: prev.matches.map(m => m.id === id ? { ...m, isVisible: !m.isVisible } : m) }))}
            />
          </div>
        )}

        {view === 'admin-logs' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-emerald-500" />
              <h2 className="text-3xl font-black text-white">Log de Eventos</h2>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                {data.events.length === 0 ? (
                  <div className="p-20 text-center text-slate-500 italic">Nenhum evento registrado ainda.</div>
                ) : (
                  data.events.map(event => (
                    <div key={event.id} className="p-4 border-b border-slate-800 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          event.type === 'registration' ? 'bg-blue-500/10 text-blue-500' :
                          event.type === 'match-progress' ? 'bg-amber-500/10 text-amber-500' :
                          event.type === 'match-finished' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                           <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">{event.message}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{new Date(event.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'visitor' && (
          <VisitorView 
            entries={data.entries} 
            matches={data.matches} 
            currentRound={data.currentRound} 
            motto={motto} 
            youtubeLink={data.youtubeLink}
            showLive={data.showLive}
            events={data.events}
          />
        )}
      </main>
    </div>
  );
};

export default App;
