
import React, { useState, useMemo } from 'react';
import { Participant, Entry, Match, MatchStatus } from '../types';
import { Swords, Trophy, ChevronRight, Hash, Trash2, RotateCcw, AlertCircle, Eye, EyeOff, Clock, PlayCircle, CheckCircle2, RotateCw } from 'lucide-react';

interface Props {
  participants: Participant[];
  entries: Entry[];
  matches: Match[];
  currentRound: number;
  setCurrentRound: (val: any) => void;
  onStatusUpdate: (id: string, status: MatchStatus) => void;
  onWinnerSet: (id: string, winnerNum: number) => void;
  onMatchCreate: (m: Match) => void;
  onMatchDelete: (id: string) => void;
  onMatchReset: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onResetRounds: () => void;
}

const AdminMatches: React.FC<Props> = ({ 
  participants, entries, matches, currentRound, setCurrentRound,
  onStatusUpdate, onWinnerSet, onMatchCreate, onMatchDelete, onMatchReset, onToggleVisibility,
  onResetRounds
}) => {
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');

  const activeEntries = useMemo(() => {
    return entries.filter(e => e.status === 'active' && e.currentRound === currentRound);
  }, [entries, currentRound]);

  const unmatchedEntries = useMemo(() => {
    const matchedNumbers = matches
      .filter(m => m.round === currentRound)
      .flatMap(m => [m.entry1, m.entry2])
      .filter(n => n !== null);
    
    return activeEntries.filter(e => !matchedNumbers.includes(e.number));
  }, [activeEntries, matches, currentRound]);

  const currentMatches = useMemo(() => {
    return matches.filter(m => m.round === currentRound);
  }, [matches, currentRound]);

  const addMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const num1 = parseInt(input1);
    const num2 = parseInt(input2);

    if (isNaN(num1) || isNaN(num2)) return;
    if (num1 === num2) { alert("Número duplicado."); return; }

    const entry1 = unmatchedEntries.find(e => e.number === num1);
    const entry2 = unmatchedEntries.find(e => e.number === num2);

    if (!entry1 || !entry2) { alert("Bola inválida."); return; }

    if (entry1.participantId === entry2.participantId && currentRound === 1) {
      alert("Autoconfronto bloqueado na R1.");
      return;
    }

    const newMatch: Match = {
      id: Math.random().toString(36).substring(7),
      round: currentRound,
      entry1: num1,
      entry2: num2,
      winner: null,
      isBye: false,
      timestamp: Date.now(),
      status: 'pending',
      isVisible: false
    };

    onMatchCreate(newMatch);
    setInput1('');
    setInput2('');
  };

  const getEntryName = (num: number | null) => {
    if (num === null) return "BYE";
    return entries.find(e => e.number === num)?.participantName || "---";
  };

  const getStatusColor = (status: MatchStatus) => {
    switch (status) {
      case 'pending': return 'text-slate-400 bg-slate-800 border-slate-700';
      case 'in-progress': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'finished': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      default: return '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Swords className="w-8 h-8 text-emerald-500" /> Mesa R{currentRound}
          </h2>
          <button 
            onClick={onResetRounds}
            className="flex items-center gap-2 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-500/30 px-4 py-2 rounded-lg text-sm font-bold transition-all"
          >
            <RotateCw className="w-4 h-4" /> Resetar Rodadas
          </button>
        </div>
        <button onClick={() => setCurrentRound(currentRound + 1)} className="bg-emerald-600 px-6 py-3 rounded-xl text-white font-bold transition-all shadow-lg flex items-center gap-2">
           Próxima Rodada <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Novo Confronto</h3>
             <form onSubmit={addMatch} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={input1} onChange={(e) => setInput1(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-black text-emerald-400 outline-none" placeholder="Bola A" />
                  <input type="number" value={input2} onChange={(e) => setInput2(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-black text-emerald-400 outline-none" placeholder="Bola B" />
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all">Emparelhar</button>
             </form>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-4">No Globo ({unmatchedEntries.length})</h3>
            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
              {unmatchedEntries.map(e => (
                <div key={e.number} className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-sm font-bold text-slate-300">#{e.number}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 grid gap-6">
          {currentMatches.length === 0 ? (
             <div className="py-20 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800 text-slate-600 italic">Nenhum confronto.</div>
          ) : (
            [...currentMatches].reverse().map(match => (
              <div key={match.id} className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-xl transition-all ${match.isVisible ? 'border-emerald-500/30' : 'border-slate-800'}`}>
                <div className="bg-slate-800/50 px-5 py-3 flex justify-between items-center border-b border-slate-800">
                  <div className="flex items-center gap-4">
                    <button onClick={() => onToggleVisibility(match.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all ${match.isVisible ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      {match.isVisible ? <><Eye className="w-3.5 h-3.5" /> Visível</> : <><EyeOff className="w-3.5 h-3.5" /> Oculto</>}
                    </button>
                    <div className="flex gap-1">
                      {['pending', 'in-progress', 'finished'].map(s => (
                        <button key={s} onClick={() => onStatusUpdate(match.id, s as MatchStatus)} className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase transition-all border ${match.status === s ? getStatusColor(s as MatchStatus) : 'bg-slate-900 text-slate-600 border-slate-800'}`}>
                          {s === 'pending' ? 'Espera' : s === 'in-progress' ? 'Andamento' : 'Fim'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    {match.winner !== null && <button onClick={() => onMatchReset(match.id)} className="text-amber-500 font-bold text-[10px] uppercase flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reiniciar</button>}
                    <button onClick={() => onMatchDelete(match.id)} className="text-slate-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-6 flex items-center justify-between gap-8">
                  <div className="flex flex-col items-center gap-3 flex-1">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl border-4 ${match.winner === match.entry1 ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{match.entry1}</div>
                    <p className="text-xs font-black text-slate-500">{getEntryName(match.entry1)}</p>
                    {match.winner === null && <button onClick={() => onWinnerSet(match.id, match.entry1!)} className="w-full bg-slate-800 hover:bg-emerald-600 text-white py-2 rounded-lg font-black text-[10px] transition-all">GANHOU</button>}
                  </div>
                  <div className="text-slate-800 font-black text-2xl italic">VS</div>
                  <div className="flex flex-col items-center gap-3 flex-1">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl border-4 ${match.winner === match.entry2 ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{match.isBye ? 'BYE' : match.entry2}</div>
                    <p className="text-xs font-black text-slate-500">{getEntryName(match.entry2)}</p>
                    {match.winner === null && !match.isBye && <button onClick={() => onWinnerSet(match.id, match.entry2!)} className="w-full bg-slate-800 hover:bg-emerald-600 text-white py-2 rounded-lg font-black text-[10px] transition-all">GANHOU</button>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMatches;
