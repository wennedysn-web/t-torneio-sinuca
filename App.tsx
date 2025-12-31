
import React, { useState, useEffect } from 'react';
import { AppView, Participant, Entry, Match } from './types.ts';
import { Trophy, Users, Swords, LogIn, LogOut, LayoutDashboard, Plus, Trash2, ChevronRight } from 'lucide-react';
import AdminParticipants from './components/AdminParticipants.tsx';
import AdminMatches from './components/AdminMatches.tsx';
import VisitorView from './components/VisitorView.tsx';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('visitor');
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [motto, setMotto] = useState("Onde a tática encontra a precisão.");

  // Persistence
  useEffect(() => {
    const savedParticipants = localStorage.getItem('sinuca_participants');
    const savedEntries = localStorage.getItem('sinuca_entries');
    const savedMatches = localStorage.getItem('sinuca_matches');
    const savedRound = localStorage.getItem('sinuca_round');

    if (savedParticipants) setParticipants(JSON.parse(savedParticipants));
    if (savedEntries) setEntries(JSON.parse(savedEntries));
    if (savedMatches) setMatches(JSON.parse(savedMatches));
    if (savedRound) setCurrentRound(parseInt(savedRound));
  }, []);

  useEffect(() => {
    localStorage.setItem('sinuca_participants', JSON.stringify(participants));
    localStorage.setItem('sinuca_entries', JSON.stringify(entries));
    localStorage.setItem('sinuca_matches', JSON.stringify(matches));
    localStorage.setItem('sinuca_round', currentRound.toString());
  }, [participants, entries, matches, currentRound]);

  // Fetch AI Motto for flair
  useEffect(() => {
    const fetchMotto = async () => {
      if (!process.env.API_KEY) return;
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: "Crie uma frase curta e motivacional (máximo 10 palavras) para um torneio de sinuca brasileiro de bairro.",
        });
        if (response.text) setMotto(response.text.trim());
      } catch (e) {
        console.error("AI Motto Error", e);
      }
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

  const handleLogout = () => {
    setIsAdmin(false);
    setView('visitor');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('visitor')}>
            <div className="bg-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-900/20">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              SINUCA PRO
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('visitor')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all ${view === 'visitor' ? 'bg-slate-800 text-emerald-400' : 'hover:bg-slate-800/50 text-slate-400'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Placar</span>
            </button>

            {isAdmin ? (
              <>
                <button 
                  onClick={() => setView('admin-participants')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all ${view === 'admin-participants' ? 'bg-slate-800 text-emerald-400' : 'hover:bg-slate-800/50 text-slate-400'}`}
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Participantes</span>
                </button>
                <button 
                  onClick={() => setView('admin-matches')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all ${view === 'admin-matches' ? 'bg-slate-800 text-emerald-400' : 'hover:bg-slate-800/50 text-slate-400'}`}
                >
                  <Swords className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Confrontos</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-red-900/20 text-red-400 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Sair</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => setView('admin-login')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section (Visitor only) */}
      {view === 'visitor' && (
        <div className="bg-emerald-900/10 border-b border-emerald-900/20 py-8 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white">Torneio dos Mestres</h2>
            <p className="text-emerald-400 font-medium italic">"{motto}"</p>
            <div className="flex justify-center gap-8 pt-4">
              <div className="text-center">
                <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Inscritos</p>
                <p className="text-2xl font-black">{entries.length}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Rodada Atual</p>
                <p className="text-2xl font-black">{currentRound}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Ativos</p>
                <p className="text-2xl font-black text-emerald-400">{entries.filter(e => e.status === 'active').length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'admin-login' && (
          <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">Acesso Administrativo</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-1">Senha de Acesso</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Digite a senha..."
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20"
              >
                Entrar
              </button>
            </form>
          </div>
        )}

        {view === 'admin-participants' && (
          <AdminParticipants 
            participants={participants} 
            setParticipants={setParticipants} 
            entries={entries}
            setEntries={setEntries}
          />
        )}

        {view === 'admin-matches' && (
          <AdminMatches 
            participants={participants}
            entries={entries}
            setEntries={setEntries}
            matches={matches}
            setMatches={setMatches}
            currentRound={currentRound}
            setCurrentRound={setCurrentRound}
          />
        )}

        {view === 'visitor' && (
          <VisitorView 
            entries={entries}
            matches={matches}
            currentRound={currentRound}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 px-4 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          <p>© 2024 Sorteio de Sinuca - Gestão Automatizada de Mata-Mata</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
