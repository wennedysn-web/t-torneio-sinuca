import React, { useState, useMemo } from 'react';
import { Participant, Entry, Match, MatchStatus } from '../types';
import { Swords, Trophy, ChevronRight, Hash, Trash2, RotateCcw, AlertCircle, Eye, EyeOff, Clock, PlayCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  participants: Participant[];
  entries: Entry[];
  setEntries: React.Dispatch<React.SetStateAction<Entry[]>>;
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  currentRound: number;
  setCurrentRound: React.Dispatch<React.SetStateAction<number>>;
}

const AdminMatches: React.FC<Props> = ({ participants, entries, setEntries, matches, setMatches, currentRound, setCurrentRound }) => {
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');

  const generateId = () => {
    return typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

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

    if (isNaN(num1) || isNaN(num2)) {
      alert("Por favor, insira números válidos.");
      return;
    }

    if (num1 === num2) {
      alert("Uma inscrição não pode jogar contra si mesma.");
      return;
    }

    const entry1 = unmatchedEntries.find(e => e.number === num1);
    const entry2 = unmatchedEntries.find(e => e.number === num2);

    if (!entry1 || !entry2) {
      alert("Inscrição não encontrada na lista de disponíveis para esta rodada.");
      return;
    }

    if (entry1.participantId === entry2.participantId || entry1.participantName.toLowerCase() === entry2.participantName.toLowerCase()) {
      if (currentRound === 1) {
        alert(`❌ AUTOCONFRONTO BLOQUEADO (Rodada 1): ${entry1.participantName} (#${num1}) e (#${num2}) são o mesmo competidor. Na primeira rodada isso não é permitido. Por favor, realize um novo sorteio.`);
        return;
      } else {
        const autoWinner = num1 > num2 ? num1 : num2;
        const autoLoser = num1 > num2 ? num2 : num1;
        
        if (confirm(`⚠️ AUTOCONFRONTO (Rodada ${currentRound}): ${entry1.participantName} se enfrentou. A inscrição de maior numeração (#${autoWinner}) avançará automaticamente. Confirmar?`)) {
          const newMatch: Match = {
            id: generateId(),
            round: currentRound,
            entry1: num1,
            entry2: num2,
            winner: autoWinner,
            isBye: false,
            timestamp: Date.now(),
            status: 'finished',
            isVisible: true
          };
          
          setMatches(prev => [...prev, newMatch]);
          setEntries(prev => prev.map(e => {
            if (e.number === autoWinner) return { ...e, currentRound: currentRound + 1 };
            if (e.number === autoLoser) return { ...e, status: 'eliminated' };
            return e;
          }));
          setInput1('');
          setInput2('');
          return;
        } else {
          return;
        }
      }
    }

    const newMatch: Match = {
      id: generateId(),
      round: currentRound,
      entry1: num1,
      entry2: num2,
      winner: null,
      isBye: false,
      timestamp: Date.now(),
      status: 'pending',
      isVisible: false // Manual validation required
    };

    setMatches(prev => [...prev, newMatch]);
    setInput1('');
    setInput2('');
  };

  const setWinner = (matchId: string, winnerNumber: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const loserNumber = match.entry1 === winnerNumber ? match.entry2 : match.entry1;

    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, winner: winnerNumber, status: 'finished' } : m));

    setEntries(prev => prev.map(e => {
      if (e.number === winnerNumber) return { ...e, currentRound: currentRound + 1, status: 'active' as const }; 
      if (e.number === loserNumber) return { ...e, status: 'eliminated' };
      return e;
    }));
  };

  const clearWinner = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || match.winner === null) return;

    if (!confirm("Deseja anular o vencedor e REINICIAR esta partida?")) return;

    const winnerNumber = match.winner;
    const loserNumber = match.entry1 === winnerNumber ? match.entry2 : match.entry1;

    setEntries(prev => prev.map(e => {
      if (e.number === winnerNumber || (loserNumber !== null && e.number === loserNumber)) {
        return { ...e, status: 'active' as const, currentRound: currentRound };
      }
      return e;
    }));

    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, winner: null, status: 'in-progress' } : m));
  };

  const deleteMatch = (matchId: string) => {
    if (!confirm("Deseja EXCLUIR permanentemente este confronto?")) return;
    const match = matches.find(m => m.id === matchId);
    if (match && match.winner !== null) {
      const winnerNumber = match.winner;
      const loserNumber = match.entry1 === winnerNumber ? match.entry2 : match.entry1;
      setEntries(prev => prev.map(e => {
        if (e.number === winnerNumber || (loserNumber !== null && e.number === loserNumber)) {
          return { ...e, status: 'active' as const, currentRound: currentRound };
        }
        return e;
      }));
    }
    setMatches(prev => prev.filter(m => m.id !== matchId));
  };

  const toggleVisibility = (matchId: string) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, isVisible: !m.isVisible } : m));
  };

  const updateStatus = (matchId: string, status: MatchStatus) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status } : m));
  };

  const handleBye = () => {
    if (unmatchedEntries.length !== 1) return;
    const entry = unmatchedEntries[0];
    const newMatch: Match = {
      id: generateId(),
      round: currentRound,
      entry1: entry.number,
      entry2: null,
      winner: entry.number,
      isBye: true,
      timestamp: Date.now(),
      status: 'finished',
      isVisible: true
    };
    setMatches(prev => [...prev, newMatch]);
    setEntries(prev => prev.map(e => e.number === entry.number ? { ...e, currentRound: currentRound + 1 } : e));
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
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Swords className="w-8 h-8 text-emerald-500" />
            Gestão de Confrontos - R{currentRound}
          </h2>
          <p className="text-slate-400 mt-1">Status, validação e controle de visibilidade.</p>
        </div>
        
        <button 
          onClick={() => setCurrentRound(prev => prev + 1)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95"
        >
          Finalizar Rodada <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4" /> No Globo ({unmatchedEntries.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {unmatchedEntries.map(e => (
                <div key={e.number} className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-sm font-bold text-slate-300">
                   #{String(e.number).padStart(3, '0')}
                </div>
              ))}
              {unmatchedEntries.length === 0 && <p className="text-[10px] text-emerald-500 font-bold uppercase text-center w-full py-2">Pronto</p>}
            </div>
            {unmatchedEntries.length === 1 && (
              <button onClick={handleBye} className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all">Folga (BYE)</button>
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Novo Confronto</h3>
             <form onSubmit={addMatch} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={input1} onChange={(e) => setInput1(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-black focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-400" placeholder="00" />
                  <input type="number" value={input2} onChange={(e) => setInput2(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-black focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-400" placeholder="00" />
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95">Emparelhar</button>
             </form>
          </div>
        </div>

        <div className="lg:col-span-3 grid gap-6 sm:grid-cols-1">
          {currentMatches.length === 0 ? (
            <div className="py-20 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800 text-slate-600 italic">Nenhum confronto.</div>
          ) : (
            [...currentMatches].reverse().map((match) => (
              <div key={match.id} className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${match.isVisible ? 'border-emerald-500/30' : 'border-slate-800'}`}>
                <div className="bg-slate-800/50 px-5 py-3 flex flex-wrap justify-between items-center border-b border-slate-800 gap-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleVisibility(match.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all ${match.isVisible ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      {match.isVisible ? <><Eye className="w-3.5 h-3.5" /> Visível Público</> : <><EyeOff className="w-3.5 h-3.5" /> Validar p/ Público</>}
                    </button>
                    <div className="flex gap-1">
                      {[
                        { id: 'pending' as MatchStatus, label: 'Em Espera', icon: Clock },
                        { id: 'in-progress' as MatchStatus, label: 'Andamento', icon: PlayCircle },
                        { id: 'finished' as MatchStatus, label: 'Finalizado', icon: CheckCircle2 }
                      ].map(s => (
                        <button 
                          key={s.id}
                          onClick={() => updateStatus(match.id, s.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase transition-all border ${match.status === s.id ? getStatusColor(s.id) : 'bg-slate-900 text-slate-600 border-slate-800 hover:border-slate-700'}`}
                        >
                          <s.icon className="w-3 h-3" /> {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    {match.winner !== null && (
                      <button onClick={() => clearWinner(match.id)} className="flex items-center gap-1 text-amber-500 hover:text-amber-400 font-bold text-[10px] uppercase"><RotateCcw className="w-3 h-3" /> Reiniciar</button>
                    )}
                    <button onClick={() => deleteMatch(match.id)} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex flex-col items-center gap-3 flex-1">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl border-4 transition-all duration-500 ${match.winner === match.entry1 ? 'bg-emerald-600 border-emerald-400 text-white scale-110 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      {match.entry1}
                    </div>
                    <p className={`text-xs font-black text-center transition-colors ${match.winner === match.entry1 ? 'text-emerald-400' : 'text-slate-500'}`}>{getEntryName(match.entry1)}</p>
                    {match.winner === null && !match.isBye && (
                      <button onClick={() => setWinner(match.id, match.entry1!)} className="w-full bg-slate-800 hover:bg-emerald-600 text-white py-2 rounded-lg font-black text-[10px] transition-all">GANHOU</button>
                    )}
                  </div>

                  <div className="text-slate-800 font-black text-2xl italic select-none">VS</div>

                  <div className="flex flex-col items-center gap-3 flex-1">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl border-4 transition-all duration-500 ${match.winner === match.entry2 ? 'bg-emerald-600 border-emerald-400 text-white scale-110 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      {match.isBye ? 'BYE' : match.entry2}
                    </div>
                    <p className={`text-xs font-black text-center transition-colors ${match.winner === match.entry2 ? 'text-emerald-400' : 'text-slate-500'}`}>{match.isBye ? 'Folga' : getEntryName(match.entry2)}</p>
                    {match.winner === null && !match.isBye && (
                      <button onClick={() => setWinner(match.id, match.entry2!)} className="w-full bg-slate-800 hover:bg-emerald-600 text-white py-2 rounded-lg font-black text-[10px] transition-all">GANHOU</button>
                    )}
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