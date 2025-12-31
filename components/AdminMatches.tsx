import React, { useState, useMemo } from 'react';
import { Participant, Entry, Match } from '../types';
import { Swords, Trophy, Play, CheckCircle2, ChevronRight, Hash, Trash2, ArrowRightLeft, Sparkles } from 'lucide-react';

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

  // Active entries for current round
  const activeEntries = useMemo(() => {
    return entries.filter(e => e.status === 'active' && e.currentRound === currentRound);
  }, [entries, currentRound]);

  // Entries that haven't been matched yet in this round
  const unmatchedEntries = useMemo(() => {
    const matchedNumbers = matches
      .filter(m => m.round === currentRound)
      .flatMap(m => [m.entry1, m.entry2])
      .filter(n => n !== null);
    
    return activeEntries.filter(e => !matchedNumbers.includes(e.number));
  }, [activeEntries, matches, currentRound]);

  // Current round matches
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

    // Update matches
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, winner: winnerNumber } : m));

    // Update entry statuses
    setEntries(prev => prev.map(e => {
      if (e.number === winnerNumber) {
        return { ...e, currentRound: currentRound + 1 }; // Advances
      }
      if (e.number === loserNumber) {
        return { ...e, status: 'eliminated' };
      }
      return e;
    }));
  };

  const handleBye = () => {
    if (unmatchedEntries.length !== 1) {
      alert("Sorteio de 'Bye' só é permitido quando sobra exatamente 1 inscrição sem par.");
      return;
    }

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

    const winnersCount = entries.filter(e => e.status === 'active' && e.currentRound > currentRound).length;
    if (winnersCount <= 1 && entries.filter(e => e.status === 'active').length === 1) {
      alert("O torneio já tem um campeão!");
      return;
    }

    setCurrentRound(prev => prev + 1);
  };

  const resetMatch = (matchId: string) => {
    if (!confirm("Isso removerá o vencedor e retornará as inscrições ao estado anterior. Continuar?")) return;
    
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    // Revert statuses
    setEntries(prev => prev.map(e => {
      if (e.number === match.entry1 || e.number === match.entry2) {
        return { ...e, status: 'active', currentRound: currentRound };
      }
      return e;
    }));

    setMatches(prev => prev.filter(m => m.id !== matchId));
  };

  const getEntryName = (num: number | null) => {
    if (num === null) return "BYE";
    return entries.find(e => e.number === num)?.participantName || "???";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Swords className="w-8 h-8 text-emerald-500" />
            Gestão de Rodada {currentRound}
          </h2>
          <p className="text-slate-400 mt-1">Confronte as inscrições sorteadas fisicamente no globo.</p>
        </div>
        
        <button 
          onClick={advanceRound}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl text-white font-bold transition-all shadow-lg shadow-emerald-900/20"
        >
          Finalizar Rodada <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Pool of unmatched */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Inscrições Disponíveis ({unmatchedEntries.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {unmatchedEntries.map(e => (
                <div key={e.number} className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-sm font-bold text-slate-300">
                   #{String(e.number).padStart(3, '0')}
                </div>
              ))}
              {unmatchedEntries.length === 0 && (
                <div className="w-full text-center py-4 bg-emerald-900/10 rounded-lg border border-emerald-900/30">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <p className="text-[10px] text-emerald-500 font-bold">TODOS EMPARELHADOS</p>
                </div>
              )}
            </div>

            {unmatchedEntries.length === 1 && (
              <button 
                onClick={handleBye}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                Aplicar BYE (Sobra)
              </button>
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Novo Confronto</h3>
             <form onSubmit={addMatch} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Bola 1</label>
                    <input 
                      type="number"
                      value={input1}
                      onChange={(e) => setInput1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-black focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="---"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Bola 2</label>
                    <input 
                      type="number"
                      value={input2}
                      onChange={(e) => setInput2(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-black focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="---"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Criar Confronto
                </button>
             </form>
          </div>
        </div>

        {/* Right Column: Matches of current round */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-300">Confrontos da Rodada {currentRound}</h3>
            <span className="text-xs text-slate-500">{currentMatches.length} jogos totais</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {currentMatches.length === 0 ? (
              <div className="sm:col-span-2 py-20 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
                <ArrowRightLeft className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 font-medium italic">Inicie os confrontos usando os números sorteados no globo.</p>
              </div>
            ) : (
              [...currentMatches].reverse().map(match => (
                <div key={match.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-slate-700 transition-all">
                  <div className="bg-slate-800/50 px-4 py-2 flex justify-between items-center border-b border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-500">Jogo #{match.id.slice(0, 4)}</span>
                    {!match.winner && (
                      <button onClick={() => resetMatch(match.id)} className="text-slate-500 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <div className="p-4 grid grid-cols-7 items-center gap-2">
                    {/* Player 1 */}
                    <div className="col-span-3 text-center space-y-2">
                      <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-4 ${match.winner === match.entry1 ? 'bg-emerald-600 border-emerald-400 text-white scale-110 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                        {match.entry1}
                      </div>
                      <p className={`text-xs font-bold truncate ${match.winner === match.entry1 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {getEntryName(match.entry1)}
                      </p>
                      {!match.winner && !match.isBye && (
                        <button 
                          onClick={() => setWinner(match.id, match.entry1!)}
                          className="w-full text-[10px] bg-slate-800 hover:bg-emerald-600 border border-slate-700 rounded py-1 font-bold transition-all"
                        >
                          VENCEU
                        </button>
                      )}
                    </div>

                    <div className="col-span-1 flex flex-col items-center">
                       <div className="text-slate-600 font-black text-xs">VS</div>
                    </div>

                    {/* Player 2 */}
                    <div className="col-span-3 text-center space-y-2">
                      <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-4 ${match.winner === match.entry2 ? 'bg-emerald-600 border-emerald-400 text-white scale-110 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                        {match.isBye ? '--' : match.entry2}
                      </div>
                      <p className={`text-xs font-bold truncate ${match.winner === match.entry2 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {match.isBye ? 'Folga' : getEntryName(match.entry2)}
                      </p>
                      {!match.winner && !match.isBye && (
                        <button 
                          onClick={() => setWinner(match.id, match.entry2!)}
                          className="w-full text-[10px] bg-slate-800 hover:bg-emerald-600 border border-slate-700 rounded py-1 font-bold transition-all"
                        >
                          VENCEU
                        </button>
                      )}
                    </div>
                  </div>
                  {match.winner && !match.isBye && (
                     <div className="bg-emerald-900/20 py-1.5 text-center flex items-center justify-center gap-2">
                        <Trophy className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Vencedor Definido</span>
                     </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMatches;