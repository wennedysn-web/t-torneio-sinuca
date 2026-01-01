import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Participant, Entry, Match } from './types.ts';
import { Trophy, Users, Swords, LogIn, LogOut, LayoutDashboard, AlertTriangle, RefreshCcw, Trash2 } from 'lucide-react';
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
    youtubeLink: ''
  });
  const [motto, setMotto] = useState("Onde a tática encontra a precisão.");
  const [isLoading, setIsLoading] = useState(true);

  // Busca inicial e Real-time
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
            youtubeLink: remoteData.youtube_link || ''
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
              youtubeLink: newData.youtube_link || ''
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
        last_update: new Date().toISOString()
      })
      .eq('id', 'main');

    if (error) {
      console.error("Erro na sincronização:", error.message);
      if (error.code === '42703' || error.message.includes('youtube_link')) {
        alert("⚠️ ERRO DE BANCO: A coluna 'youtube_link' não existe. Execute o SQL ALTER TABLE no painel do Supabase.");
      }
    }
  }, []);

  // Wrapper principal de atualização
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

  const handleUpdateYoutube = (link: string) => {
    updateData(prev => ({ ...prev, youtubeLink: link }));
  };

  const handleGenerateTestData = () => {
    const names = ["Baianinho", "Bruxo", "Maziero", "Maycon", "Josué", "Cigano", "Farinha", "Cobrinha", "Tubarão", "Gordinho"];
    const testParticipants: Participant[] = [];
    const testEntries: Entry[] = [];
    const usedNumbers = new Set(data.entries.map(e => e.number));
    
    names.forEach((name) => {
      let num;
      let attempts = 0;
      do { 
        num = Math.floor(Math.random() * 200) + 1; 
        attempts++;
      } while (usedNumbers.has(num) && attempts < 500);
      
      if (attempts < 500) {
        usedNumbers.add(num);
        const id = Math.random().toString(36).substring(7) + Date.now();
        testParticipants.push({ id, name, entryNumbers: [num] });
        testEntries.push({ 
          number: num, 
          participantId: id, 
          participantName: name, 
          status: 'active', 
          currentRound: 1 
        });
      }
    });

    updateData(prev => ({
      ...prev,
      participants: [...prev.participants, ...testParticipants],
      entries: [...prev.entries, ...testEntries]
    }));
    alert(`${testParticipants.length} jogadores de teste adicionados!`);
  };

  const handleResetTournament = () => {
    if (!confirm("⚠️ ATENÇÃO: Isso apagará TODOS os dados. Deseja continuar?")) return;
    const resetData = { participants: [], entries: [], matches: [], currentRound: 1, youtubeLink: '' };
    setData(resetData);
    syncWithSupabase(resetData);
  };

  const handleResetCurrentRound = () => {
    if (!confirm(`Deseja resetar a Rodada ${data.currentRound}?`)) return;
    updateData(prev => {
      const filteredMatches = prev.matches.filter(m => m.round !== prev.currentRound);
      const resetEntries = prev.entries.map(e => {
        if (e.currentRound >= prev.currentRound) {
          return { ...e, status: 'active' as const, currentRound: prev.currentRound };
        }
        return e;
      });
      return { ...prev, matches: filteredMatches, entries: resetEntries };
    });
  };

  useEffect(() => {
    const fetchMotto = async () => {
      if (!process.env.API_KEY) return;
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: "Crie uma frase curta e motivacional para um torneio de sinuca.",
        });
        if (response.text) setMotto(response.text.trim());
      } catch (e) {}
    };
    fetchMotto();
  }, []);

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
          <p className="text-slate-400 font-bold animate-pulse">Sincronizando com Supabase...</p>
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
                <button onClick={() => setView('admin-participants')} className={`p-2 rounded-lg ${view === 'admin-participants' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>
                  <Users className="w-5 h-5" />
                </button>
                <button onClick={() => setView('admin-matches')} className={`p-2 rounded-lg ${view === 'admin-matches' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>
                  <Swords className="w-5 h-5" />
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
              onAddParticipant={handleRegisterParticipant}
              onRemoveParticipant={handleRemoveParticipant}
              onEditParticipant={handleEditParticipant}
              onUpdateYoutube={handleUpdateYoutube}
              onGenerateTestData={handleGenerateTestData}
            />
            <div className="pt-8 border-t border-red-900/30">
              <div className="danger-zone border border-red-900/40 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-red-500/20 p-3 rounded-full"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
                  <div>
                    <h3 className="text-red-500 font-black text-lg">Zona Crítica</h3>
                    <p className="text-slate-500 text-sm">Apaga todos os dados e reseta o torneio completamente.</p>
                  </div>
                </div>
                <button onClick={handleResetTournament} className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 font-bold px-8 py-3 rounded-xl transition-all shadow-xl">
                  <Trash2 className="w-5 h-5" /> Limpar Torneio
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'admin-matches' && (
          <div className="space-y-12">
            <AdminMatches 
              participants={data.participants}
              entries={data.entries}
              setEntries={(val) => updateData(prev => ({ ...prev, entries: typeof val === 'function' ? val(prev.entries) : val }))}
              matches={data.matches}
              setMatches={(val) => updateData(prev => ({ ...prev, matches: typeof val === 'function' ? val(prev.matches) : val }))}
              currentRound={data.currentRound}
              setCurrentRound={(val) => updateData(prev => ({ ...prev, currentRound: typeof val === 'function' ? val(prev.currentRound) : val }))}
            />
            <div className="pt-8 border-t border-red-900/30">
              <div className="danger-zone border border-red-900/40 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-500/20 p-3 rounded-full"><RefreshCcw className="w-6 h-6 text-amber-500" /></div>
                  <div>
                    <h3 className="text-amber-500 font-black text-lg">Corrigir Rodada</h3>
                    <p className="text-slate-500 text-sm">Reseta os jogos da rodada {data.currentRound} e libera os jogadores para sorteio.</p>
                  </div>
                </div>
                <button onClick={handleResetCurrentRound} className="flex items-center gap-2 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-600/30 font-bold px-8 py-3 rounded-xl transition-all shadow-xl">
                  <RefreshCcw className="w-5 h-5" /> Resetar Rodada {data.currentRound}
                </button>
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
          />
        )}
      </main>
    </div>
  );
};

export default App;