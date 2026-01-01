import React, { useMemo, useState } from 'react';
import { Entry, Match } from '../types';
import { Trophy, Swords, User, History, Star, Medal, Youtube, PlayCircle } from 'lucide-react';

interface Props {
  entries: Entry[];
  matches: Match[];
  currentRound: number;
  motto?: string;
  youtubeLink?: string;
}

const VisitorView: React.FC<Props> = ({ entries, matches, currentRound, motto, youtubeLink }) => {
  const [filterRound, setFilterRound] = useState(currentRound);

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = useMemo(() => getYoutubeId(youtubeLink || ''), [youtubeLink]);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => m.round === filterRound);
  }, [matches, filterRound]);

  const activePlayers = useMemo(() => {
    return entries.filter(e => e.status === 'active');
  }, [entries]);

  const rounds = Array.from({ length: currentRound }, (_, i) => i + 1);

  const getEntryName = (num: number | null) => {
    if (num === null) return "---";
    return entries.find(e => e.number === num)?.participantName || "---";
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="py-8 px-4 text-center border-b border-emerald-900/20 bg-emerald-900/5 -mx-4 -mt-8 mb-8">
        <h2 className="text-3xl font-black mb-2">Torneio em Tempo Real</h2>
        <p className="text-emerald-500 text-sm italic">{motto || "Onde a tática encontra a precisão."}</p>
      </div>

      {/* Live Preview Section */}
      {videoId && (
        <div className="max-w-4xl mx-auto space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-red-500 animate-pulse" />
            Transmissão ao Vivo
          </h3>
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden border-4 border-slate-900 shadow-2xl bg-black">
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${videoId}`} 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
            <Swords className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Em Disputa</p>
          <p className="text-4xl font-black text-white">{activePlayers.length}</p>
          <p className="text-slate-400 text-xs mt-2">Jogadores ativos buscando o título</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
            <Trophy className="w-16 h-16 text-amber-500" />
          </div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Rodada Atual</p>
          <p className="text-4xl font-black text-white">{currentRound}</p>
          <p className="text-slate-400 text-xs mt-2">Mata-mata eliminatório</p>
        </div>

        <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform">
            <Medal className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">Status Final</p>
          <p className="text-lg font-bold text-white leading-tight">
            {activePlayers.length === 1 
              ? `🏆 ${activePlayers[0].participantName} é o CAMPEÃO!` 
              : "Torneio em Andamento"}
          </p>
          <p className="text-emerald-500/60 text-xs mt-2">Acompanhe os confrontos em tempo real</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-500" />
            Quadro de Confrontos
          </h3>
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-[200px] md:max-w-none">
            {rounds.map(r => (
              <button
                key={r}
                onClick={() => setFilterRound(r)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex-shrink-0 ${filterRound === r ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                R{r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-600 italic">
               Nenhum confronto registrado para a Rodada {filterRound} ainda.
            </div>
          ) : (
            filteredMatches.map(match => (
              <div key={match.id} className="group bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all hover:bg-slate-900/80">
                <div className="flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-4 transition-all shadow-lg ${match.winner === match.entry1 ? 'bg-emerald-600 border-emerald-400 text-white scale-110 rotate-3' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                      {match.entry1}
                    </div>
                    <span className={`text-[11px] font-bold text-center truncate w-full ${match.winner === match.entry1 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {getEntryName(match.entry1)}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="text-slate-700 font-black text-sm">VS</div>
                    {match.isBye && <span className="text-[10px] bg-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded-full font-bold">FOLGA</span>}
                  </div>

                  <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-4 transition-all shadow-lg ${match.winner === match.entry2 ? 'bg-emerald-600 border-emerald-400 text-white scale-110 -rotate-3' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                      {match.isBye ? '--' : match.entry2}
                    </div>
                    <span className={`text-[11px] font-bold text-center truncate w-full ${match.winner === match.entry2 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {match.isBye ? 'Avança' : getEntryName(match.entry2)}
                    </span>
                  </div>
                </div>
                
                {match.winner && !match.isBye && (
                  <div className="mt-6 pt-4 border-t border-slate-800 text-center animate-in fade-in zoom-in duration-300">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Vencedor</p>
                    <p className="text-emerald-400 font-bold text-sm flex items-center justify-center gap-1.5">
                       <Star className="w-4 h-4 fill-emerald-400" />
                       {getEntryName(match.winner)} (#{match.winner})
                    </p>
                  </div>
                )}
                {!match.winner && !match.isBye && (
                   <div className="mt-6 pt-4 border-t border-slate-800/50 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Em Disputa</span>
                      </div>
                   </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-800">
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-500" />
          Inscrições Ativas por Mesa
        </h3>
        <div className="flex flex-wrap gap-3">
          {activePlayers.sort((a,b) => a.number - b.number).map(entry => (
            <div key={entry.number} className="bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50 flex items-center gap-3">
              <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none">#{entry.number}</span>
              <span className="text-xs font-bold text-slate-300">{entry.participantName}</span>
            </div>
          ))}
          {activePlayers.length === 0 && (
            <p className="text-slate-600 text-sm italic">O torneio ainda não começou.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitorView;