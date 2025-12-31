import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Participant, Entry, Match } from './types.ts';
import { Trophy, Users, Swords, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
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

  // Busca inicial e Sincronização em tempo real com Supabase
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
            // Só atualiza se o timestamp for mais recente para evitar loops de estados antigos
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

  // Helper unificado para salvar no Supabase de forma atômica
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
                <button onClick={() => setIsAdmin(false)} className="p-2 text-red-400"><LogOut className="w-5 h-5" /></button>
              </>
            ) : (
              <button onClick={() => setView('admin-login')} className="p-2 text-slate-400"><LogIn className="w-5 h-5" /></button>
            )}
          </div>
        </div>
      </nav>

      {view === 'visitor' && (
        <div className="py-8 px-4 text-center border-b border-emerald-900/20 bg-emerald-900/5">
           <h2 className="text-3xl font-black mb-2">Torneio em Tempo Real</h2>
           <p className="text-emerald-500 text-sm italic">{motto}</p>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'admin-login' && (
          <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Acesso Admin</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Senha..."
                required
              />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-lg shadow-lg">Entrar</button>
            </form>
          </div>
        )}

        {view === 'admin-participants' && (
          <AdminParticipants 
            participants={participants} 
            setParticipants={updateParticipants} 
            entries={entries}
            setEntries={updateEntries}
          />
        )}

        {view === 'admin-matches' && (
          <AdminMatches 
            participants={participants}
            entries={entries}
            setEntries={updateEntries}
            matches={matches}
            setMatches={updateMatches}
            currentRound={currentRound}
            setCurrentRound={updateRound}
          />
        )}

        {view === 'visitor' && (
          <VisitorView entries={entries} matches={matches} currentRound={currentRound} />
        )}
      </main>
    </div>
  );
};

export default App;