import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Participant, Entry, Match } from './types.ts';
import { Trophy, Users, Swords, LogIn, LogOut, LayoutDashboard, AlertTriangle, RefreshCcw, Trash2 } from 'lucide-react';
import AdminParticipants from './components/AdminParticipants.tsx';
import AdminMatches from './components/AdminMatches.tsx';
import VisitorView from './components/VisitorView.tsx';
import { GoogleGenAI } from "@google/genai";
import { supabase } from './lib/supabase.ts';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('visitor');
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [motto, setMotto] = useState("Onde a tática encontra a precisão.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', 'main')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Erro ao carregar dados:", error);
        } else if (data) {
          setParticipants(data.participants || []);
          setEntries(data.entries || []);
          setMatches(data.matches || []);
          setCurrentRound(data.current_round || 1);
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
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: 'id=eq.main'
        },
        (payload: any) => {
          const newData = payload.new;
          if (newData) {
            setParticipants(newData.participants || []);
            setEntries(newData.entries || []);
            setMatches(newData.matches || []);
            setCurrentRound(newData.current_round || 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const syncWithSupabase = useCallback(async (
    p: Participant[], 
    e: Entry[], 
    m: Match[], 
    r: number
  ) => {
    const { error } = await supabase
      .from('tournaments')
      .update({
        participants: p,
        entries: e,
        matches: m,
        current_round: r,
        last_update: new Date().toISOString()
      })
      .eq('id', 'main');

    if (error) {
      console.error("Erro na sincronização:", error.message);
    }
  }, []);

  const updateParticipants = (val: React.SetStateAction<Participant[]>) => {
    setParticipants(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      syncWithSupabase(next, entries, matches, currentRound);
      return next;
    });
  };

  const updateEntries = (val: React.SetStateAction<Entry[]>) => {
    setEntries(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      syncWithSupabase(participants, next, matches, currentRound);
      return next;
    });
  };

  const updateMatches = (val: React.SetStateAction<Match[]>) => {
    setMatches(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      syncWithSupabase(participants, entries, next, currentRound);
      return next;
    });
  };

  const updateRound = (val: React.SetStateAction<number>) => {
    setCurrentRound(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      syncWithSupabase(participants, entries, matches, next);
      return next;
    });
  };

  const handleResetTournament = () => {
    const confirm1 = confirm("⚠️ ATENÇÃO: Isso apagará TODOS os participantes, inscrições e partidas.\nDeseja limpar o torneio completamente?");
    if (!confirm1) return;
    const confirm2 = confirm("TEM CERTEZA? Esta ação não pode ser desfeita e você perderá todos os dados do evento atual.");
    if (!confirm2) return;
    
    setParticipants([]);
    setEntries([]);
    setMatches([]);
    setCurrentRound(1);
    syncWithSupabase([], [], [], 1);
    alert("Torneio reiniciado com sucesso!");
  };

  const handleResetCurrentRound = () => {
    const msg = `Deseja resetar a Rodada ${currentRound}?\n\nIsso apagará todos os confrontos desta rodada e retornará todos os participantes ativos para a 'Lista de Sorteio'.`;
    if (!confirm(msg)) return;

    // Remove apenas os confrontos da rodada atual
    const newMatches = matches.filter(m => m.round !== currentRound);
    
    // Retorna os jogadores para o estado inicial da rodada atual
    const newEntries = entries.map(e => {
      // Se o jogador foi eliminado nesta rodada ou já tinha avançado, volta a ficar ativo no início desta rodada
      if (e.currentRound >= currentRound) {
        return { 
          ...e, 
          status: 'active' as const, 
          currentRound: currentRound 
        };
      }
      return e;
    });

    setMatches(newMatches);
    setEntries(newEntries);
    syncWithSupabase(participants, newEntries, newMatches, currentRound);
    alert(`Rodada ${currentRound} resetada! Os jogadores voltaram para a lista de disponíveis.`);
  };

  useEffect(() => {
    const fetchMotto = async () => {
      if (!process.env.API_KEY) return;
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: "Crie uma frase curta e motivacional (máximo 10 palavras) para um torneio de sinuca brasileiro.",
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
            <button onClick={() => setView('visitor')} title="Visualização Público" className={`p-2 rounded-lg ${view === 'visitor' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>
              <LayoutDashboard className="w-5 h-5" />
            </button>
            {isAdmin ? (
              <>
                <button onClick={() => setView('admin-participants')} title="Gerenciar Participantes" className={`p-2 rounded-lg ${view === 'admin-participants' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>
                  <Users className="w-5 h-5" />
                </button>
                <button onClick={() => setView('admin-matches')} title="Gerenciar Rodadas" className={`p-2 rounded-lg ${view === 'admin-matches' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>
                  <Swords className="w-5 h-5" />
                </button>
                <button onClick={() => setIsAdmin(false)} title="Sair do Admin" className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><LogOut className="w-5 h-5" /></button>
              </>
            ) : (
              <button onClick={() => setView('admin-login')} title="Login Administrativo" className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"><LogIn className="w-5 h-5" /></button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'admin-login' && (
          <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Acesso Restrito</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center"
                placeholder="Digite a senha..."
                required
              />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-lg shadow-lg transition-all active:scale-95">Entrar no Painel</button>
            </form>
          </div>
        )}

        {view === 'admin-participants' && (
          <div className="space-y-12">
            <AdminParticipants 
              participants={participants} 
              setParticipants={updateParticipants} 
              entries={entries}
              setEntries={updateEntries}
            />
            
            {/* Zona de Perigo em Participantes */}
            <div className="pt-8 border-t border-red-900/30">
              <div className="danger-zone border border-red-900/40 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-red-500/20 p-3 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-red-500 font-black text-lg">Zona de Perigo Crítica</h3>
                    <p className="text-slate-500 text-sm max-w-md">Use esta função para apagar absolutamente tudo e iniciar um novo torneio do zero.</p>
                  </div>
                </div>
                <button 
                  onClick={handleResetTournament}
                  className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 font-bold px-8 py-3 rounded-xl transition-all shadow-xl whitespace-nowrap"
                >
                  <Trash2 className="w-5 h-5" />
                  Limpar Todo o Torneio
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'admin-matches' && (
          <div className="space-y-12">
            <AdminMatches 
              participants={participants}
              entries={entries}
              setEntries={updateEntries}
              matches={matches}
              setMatches={updateMatches}
              currentRound={currentRound}
              setCurrentRound={updateRound}
            />

            {/* Zona de Perigo em Rodadas */}
            <div className="pt-8 border-t border-red-900/30">
              <div className="danger-zone border border-red-900/40 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-500/20 p-3 rounded-full">
                    <RefreshCcw className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-amber-500 font-black text-lg">Resetar Rodada Atual</h3>
                    <p className="text-slate-500 text-sm max-w-md">Se você cometeu um erro no sorteio ou lançamento, use esta opção para retornar todos os jogadores desta rodada para a lista de espera.</p>
                  </div>
                </div>
                <button 
                  onClick={handleResetCurrentRound}
                  className="flex items-center gap-2 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-600/30 font-bold px-8 py-3 rounded-xl transition-all shadow-xl whitespace-nowrap"
                >
                  <RefreshCcw className="w-5 h-5" />
                  Resetar Rodada {currentRound}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'visitor' && (
          <VisitorView entries={entries} matches={matches} currentRound={currentRound} motto={motto} />
        )}
      </main>
    </div>
  );
};

export default App;