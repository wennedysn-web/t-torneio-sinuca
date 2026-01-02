import React, { useState, useMemo } from 'react';
import { Participant, Entry, Match } from '../types';
import { Swords, Trophy, Play, CheckCircle2, ChevronRight, Hash, Trash2, ArrowRightLeft, Sparkles, RotateCcw, XCircle, AlertCircle } from 'lucide-react';

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

    // REGRA DE AUTOCONFRONTO
    if (entry1.participantId === entry2.participantId) {
      if (currentRound === 1) {
        alert(`⚠️ AUTOCONFRONTO DETECTADO: ${entry1.participantName} (#${num1}) e (#${num2}) são o mesmo competidor. Na Rodada 1 isso NÃO é permitido. Por favor, realize um novo sorteio da última bola sorteada.`);
        return;
      } else {
        // Rodada 2 ou mais: O de maior numeração ganha automaticamente
        const autoWinner = num1 > num2 ? num1 : num2;
        const autoLoser = num1 > num2 ? num2 : num1;
        
        if (confirm(`⚠️ AUTOCONFRONTO (Rodada ${currentRound}): ${entry1.participantName} se enfrentou. Pela regra, a inscrição de maior numeração (#${autoWinner}) será declarada vencedora automaticamente. Confirmar?`)) {
          const newMatch: Match = {
            id: generateId(),
            round: currentRound,
            entry1: num1,
            entry2: num2,
            winner: autoWinner,
            isBye: false,
            timestamp: Date.now()
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
      timestamp: Date.now()
    };

    setMatches(prev => [...prev, newMatch]);
    setInput1('');
    setInput2('');
  };

  const setWinner = (matchId: string, winnerNumber: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const loserNumber = match.entry1 === winnerNumber ? match.entry2 : match.entry1;

    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, winner: winnerNumber } : m));

    setEntries(prev => prev.map(e => {
      if (e.number === winnerNumber) {
        return { ...e, currentRound: currentRound + 1 }; 
      }
      if (e.number === loserNumber) {
        return { ...e, status: 'eliminated' };
      }
      return e;
    }));
  };

  const clearWinner = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || !match.winner) return;

    if (!confirm("Deseja anular o vencedor deste jogo?")) return;

    const winnerNumber = match.winner;
    const loserNumber = match.entry1 === winnerNumber ? match.entry2 : match.entry1;

    setEntries(prev => prev.map(e => {
      if (e.number === winnerNumber || (loserNumber !== null && e.number === loserNumber)) {
        return { ...e, status: 'active' as const, currentRound: currentRound };
      }
      return e;
    }));

    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, winner: null } : m));
  };

  const deleteMatch = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    if (!confirm("Deseja excluir este confronto?")) return;

    if (match.winner) {
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
      timestamp: Date.now()
    };
    setMatches(prev => [...prev, newMatch]);
    setEntries(prev => prev.map(e => e.number === entry.number ? { ...e, currentRound: currentRound + 1 } : e));
  };

  const advanceRound = () => {
    const allDecided = currentMatches.every(m => m.winner !== null);
    if (!allDecided) {
      alert("Decida todos os ganhadores desta rodada antes de avançar.");
      return;
    }
    if (unmatchedEntries.length > 0) {
      alert("Ainda existem inscrições sem confrontos definidos.");
      return;
    }
    setCurrentRound(prev => prev + 1);
  };

  const getEntryName = (num: number | null) => {
    if (num === null) return "BYE";
    return entries.find(e => e.number === num)?.participantName || "---";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Swords className="w-8 h-8 text-emerald-500" />
            Gestão de Rodada {currentRound}
          </h2>
          <p className="text-slate-400 mt-1">Lançamento de resultados da rodada atual.</p>
        </div>
        
        <button 
          onClick={advanceRound}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl text-white font-bold transition-all shadow-lg"
        >
          Próxima Rodada <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4" /> Lista de Espera ({unmatchedEntries.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {unmatchedEntries.map(e => (
                <div key={e.number} className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-sm font-bold text-slate-300">
                   #{String(e.number).padStart(3, '0')}
                </div>
              ))}
              {unmatchedEntries.length === 0 && (
                <p className="text-[10px] text-emerald-500 font-bold uppercase text-center w-full py-2">Todos emparelhados</p>
              )}
            </div>

            {unmatchedEntries.length === 1 && (
              <button 
                onClick={handleBye}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all"
              >
                Aplicar BYE
              </button>
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Novo Jogo</h3>
             <form onSubmit={addMatch} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={input1} onChange={(e) => setInput1(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-black focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Bola 1" />
                  <input type="number" value={input2} onChange={(e) => setInput2(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-black focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Bola 2" />
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all">Emparelhar</button>
             </form>
          </div>
          
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <h4 className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3 h-3" /> Regra de Autoconfronto
            </h4>
            <ul className="text-[9px] text-slate-400 space-y-1.5 list-disc pl-3">
              <li><b>Rodada 1:</b> Proibido se enfrentar. Refazer o sorteio da última bola.</li>
              <li><b>Rodada 2+:</b> Permitido. A bola de <b>maior numeração</b> avança automaticamente.</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3 grid gap-4 sm:grid-cols-2">
          {currentMatches.length === 0 ? (
            <div className="sm:col-span-2 py-20 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800 text-slate-500 italic">
               Nenhum confronto criado para esta rodada.
            </div>
          ) : (
            [...currentMatches].reverse().map((match, idx) => (
              <div key={match.id} className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-sm transition-all ${match.winner ? 'border-emerald-500/30' : 'border-slate-800'}`}>
                <div className="bg-slate-800/50 px-4 py-2 flex justify-between items-center border-b border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400">JOGO DA RODADA</span>
                  <div className="flex gap-2">
                    {match.winner && (
                      <button onClick={() => clearWinner(match.id)} className="flex items-center gap-1 text-amber-500 hover:text-amber-400 font-bold text-[9px] uppercase transition-colors">
                        <RotateCcw className="w-3 h-3" /> Reiniciar
                      </button>
                    )}
                    <button onClick={() => deleteMatch(match.id)} className="text-slate-500 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 grid grid-cols-7 items-center">
                  <div className="col-span-3 text-center space-y-1">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-4 transition-all ${match.winner === match.entry1 ? 'bg-emerald-600 border-emerald-400 text-white scale-110' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                      {match.entry1}
                    </div>
                    <p className={`text-[10px] font-bold truncate ${match.winner === match.entry1 ? 'text-emerald-400' : 'text-slate-400'}`}>{getEntryName(match.entry1)}</p>
                    {!match.winner && !match.isBye && (
                      <button onClick={() => setWinner(match.id, match.entry1!)} className="w-full text-[9px] bg-slate-800 hover:bg-emerald-600 border border-slate-700 rounded py-1 font-bold transition-all">GANHOU</button>
                    )}
                  </div>

                  <div className="col-span-1 text-center text-slate-600 font-black text-xs">VS</div>

                  <div className="col-span-3 text-center space-y-1">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-4 transition-all ${match.winner === match.entry2 ? 'bg-emerald-600 border-emerald-400 text-white scale-110' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                      {match.isBye ? 'Folga' : match.entry2}
                    </div>
                    <p className={`text-[10px] font-bold truncate ${match.winner === match.entry2 ? 'text-emerald-400' : 'text-slate-400'}`}>{match.isBye ? 'Avancou' : getEntryName(match.entry2)}</p>
                    {!match.winner && !match.isBye && (
                      <button onClick={() => setWinner(match.id, match.entry2!)} className="w-full text-[9px] bg-slate-800 hover:bg-emerald-600 border border-slate-700 rounded py-1 font-bold transition-all">GANHOU</button>
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