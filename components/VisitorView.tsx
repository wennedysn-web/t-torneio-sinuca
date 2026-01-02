
import React, { useMemo, useState } from 'react';
import { Entry, Match, MatchStatus } from '../types';
// Fixed: Removed 'Star' from lucide-react imports to avoid conflict with local definition below
import { Trophy, Swords, User, History, Medal, PlayCircle, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  entries: Entry[];
  matches: Match[];
  currentRound: number;
  motto?: string;
  youtubeLink?: string;
  showLive: boolean;
}

const VisitorView: React.FC<Props> = ({ entries, matches, currentRound, motto, youtubeLink, showLive }) => {
  const [filterRound, setFilterRound] = useState(currentRound);

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = useMemo(() => getYoutubeId(youtubeLink || ''), [youtubeLink]);

  // Sort: In-progress -> Pending -> Finished
  const sortedAndFilteredMatches = useMemo(() => {
    const statusOrder: Record<MatchStatus, number> = {
      'in-progress': 0,
      'pending': 1,
      'finished': 2
    };

    return matches
      .filter(m => m.round === filterRound && m.isVisible)
      .sort((a, b) => {
        const orderA = statusOrder[a.status] ?? 3;
        const orderB = statusOrder[b.status] ?? 3;
        if (orderA !== orderB) return orderA - orderB;
        return b.timestamp - a.timestamp;
      });
  }, [matches, filterRound]);

  const activePlayers = useMemo(() => {
    return entries.filter(e => e.status === 'active');
  }, [entries]);

  const rounds = Array.from({ length: currentRound }, (_, i) => i + 1);

  const getEntryName = (num: number | null) => {
    if (num === null) return "---";
    return entries.find(e => e.number === num)?.participantName || "---";
  };

  const StatusBadge = ({ status }: { status: MatchStatus }) => {
    switch (status) {
      case 'in-progress':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-amber-500 uppercase">Em Andamento</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase">Em Espera</span>
          </div>
        );
      case 'finished':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-500 uppercase">Finalizado</span>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="py-8 px-4 text-center border-b border-emerald-900/20 bg-emerald-900/5 -mx-4 -mt-8 mb-8">
        <h2 className="text-3xl font-black mb-2 text-white">Torneio de Sinuca Online</h2>
        <p className="text-emerald-500 text-sm font-medium italic">{motto}</p>
      </div>

      {videoId && showLive && (
        <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-red-500 animate-pulse" />
            Ao Vivo
          </h3>
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden border-4 border-slate-900 shadow-2xl bg-black">
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title="YouTube Live" frameBorder="0" allowFullScreen></iframe>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <Swords className="w-10 h-10 text-emerald-500 mb-3" />
          <p className="text-slate-500 text-xs font-black uppercase">Ativos</p>
          <p className="text-4xl font-black text-white">{activePlayers.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <Trophy className="w-10 h-10 text-amber-500 mb-3" />
          <p className="text-slate-500 text-xs font-black uppercase">Rodada</p>
          <p className="text-4xl font-black text-white">{currentRound}</p>
        </div>
        <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-3xl shadow-xl">
          <Medal className="w-10 h-10 text-emerald-400 mb-3" />
          <p className="text-emerald-400 text-xs font-black uppercase">Campeão</p>
          <p className="text-lg font-bold text-white leading-tight">
            {activePlayers.length === 1 ? activePlayers[0].participantName : "Em disputa..."}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <h3 className="text-2xl font-black text-white flex items-center gap-2"><History className="w-6 h-6 text-emerald-500" /> Chave de Jogos</h3>
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {rounds.map(r => (
              <button key={r} onClick={() => setFilterRound(r)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${filterRound === r ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>R{r}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAndFilteredMatches.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-600 italic">Nenhum confronto validado para a Rodada {filterRound}.</div>
          ) : (
            sortedAndFilteredMatches.map(match => (
              <div key={match.id} className={`group bg-slate-900/50 border rounded-3xl p-6 transition-all shadow-lg ${match.status === 'in-progress' ? 'border-amber-500/40 ring-1 ring-amber-500/10 scale-[1.02]' : 'border-slate-800 hover:border-emerald-500/30'}`}>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Mesa {match.timestamp.toString().slice(-3)}</span>
                  <StatusBadge status={match.status} />
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col items-center gap-3 flex-1">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-4 shadow-xl transition-all ${match.winner === match.entry1 ? 'bg-emerald-600 border-emerald-400 text-white scale-110' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                      {match.entry1}
                    </div>
                    <span className={`text-[11px] font-black text-center truncate w-full ${match.winner === match.entry1 ? 'text-emerald-400' : 'text-slate-400'}`}>{getEntryName(match.entry1)}</span>
                  </div>

                  <div className="text-slate-800 font-black text-xs italic">VS</div>

                  <div className="flex flex-col items-center gap-3 flex-1">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-4 shadow-xl transition-all ${match.winner === match.entry2 ? 'bg-emerald-600 border-emerald-400 text-white scale-110' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                      {match.isBye ? '...' : match.entry2}
                    </div>
                    <span className={`text-[11px] font-black text-center truncate w-full ${match.winner === match.entry2 ? 'text-emerald-400' : 'text-slate-400'}`}>{match.isBye ? 'Folga' : getEntryName(match.entry2)}</span>
                  </div>
                </div>

                {match.winner && !match.isBye && (
                  <div className="mt-6 pt-4 border-t border-slate-800 text-center animate-in fade-in zoom-in">
                    <div className="text-emerald-400 font-black text-[10px] uppercase flex items-center justify-center gap-1.5">
                      <Star className="w-3 h-3 fill-emerald-400" /> Vencedor: {getEntryName(match.winner)}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-800">
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2"><User className="w-6 h-6 text-emerald-500" /> Mesa de Inscritos Ativos</h3>
        <div className="flex flex-wrap gap-2.5">
          {activePlayers.sort((a,b) => a.number - b.number).map(entry => (
            <div key={entry.number} className="bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-700/50 flex items-center gap-2.5">
              <span className="bg-emerald-600/20 text-emerald-400 text-[10px] font-black px-1.5 py-0.5 rounded-lg border border-emerald-500/20">#{entry.number}</span>
              <span className="text-[11px] font-bold text-slate-400">{entry.participantName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Fixed: This component local declaration remains, providing the custom SVG star
const Star = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
  </svg>
);

export default VisitorView;
