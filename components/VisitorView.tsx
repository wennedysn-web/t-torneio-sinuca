
import React, { useMemo, useState, useEffect } from 'react';
import { Entry, Match, MatchStatus, TournamentEvent } from '../types';
import { Trophy, Swords, User, History, Medal, PlayCircle, Clock, CheckCircle2, Bell, Star } from 'lucide-react';

interface Props {
  entries: Entry[];
  matches: Match[];
  currentRound: number;
  motto?: string;
  youtubeLink?: string;
  showLive: boolean;
  events: TournamentEvent[];
  selectedYear: number;
}

const VisitorView: React.FC<Props> = ({ entries, matches, currentRound, motto, youtubeLink, showLive, events, selectedYear }) => {
  const [filterRound, setFilterRound] = useState(currentRound);
  const [lastNotification, setLastNotification] = useState<TournamentEvent | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => { setFilterRound(currentRound); }, [currentRound]);

  useEffect(() => {
    if (events.length > 0) {
      const latest = events[0];
      if (Date.now() - latest.timestamp < 10000) {
        setLastNotification(latest);
        setShowToast(true);
        const timer = setTimeout(() => setShowToast(false), 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [events]);

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = useMemo(() => getYoutubeId(youtubeLink || ''), [youtubeLink]);

  const sortedAndFilteredMatches = useMemo(() => {
    const statusOrder: Record<MatchStatus, number> = { 'in-progress': 0, 'pending': 1, 'finished': 2 };
    return matches
      .filter(m => m.round === filterRound && m.isVisible)
      .sort((a, b) => {
        const orderA = statusOrder[a.status] ?? 3;
        const orderB = statusOrder[b.status] ?? 3;
        if (orderA !== orderB) return orderA - orderB;
        return b.timestamp - a.timestamp;
      });
  }, [matches, filterRound]);

  const activePlayers = useMemo(() => entries.filter(e => e.status === 'active'), [entries]);
  const rounds = Array.from({ length: currentRound }, (_, i) => i + 1);

  const getEntryName = (num: number | null) => {
    if (num === null) return "---";
    return entries.find(e => e.number === num)?.participantName || "---";
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 relative">
      <div className={`fixed top-20 right-4 z-[100] transition-all duration-500 transform ${showToast ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'}`}>
        {lastNotification && (
          <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 shadow-2xl max-w-xs bg-slate-900/90 border-emerald-500/50 backdrop-blur-xl`}>
            <div className="p-2 rounded-xl bg-emerald-500 text-white"><Bell className="w-5 h-5 animate-bounce" /></div>
            <div><p className="text-white font-black text-sm">{lastNotification.message}</p><p className="text-[9px] text-slate-300 font-medium uppercase mt-1 tracking-widest">Aconteceu agora</p></div>
          </div>
        )}
      </div>

      <div className="py-10 px-4 text-center border-b border-emerald-900/20 bg-emerald-900/5 -mx-4 -mt-8 mb-8 relative overflow-hidden">
        <div className="absolute top-4 left-4 bg-emerald-600/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">Temporada {selectedYear}</div>
        <h2 className="text-4xl font-black mb-2 text-white tracking-tight">Torneio de Sinuca Online</h2>
        <p className="text-emerald-500 text-sm font-medium italic opacity-80">{motto}</p>
      </div>

      {videoId && showLive && (
        <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h3 className="text-xl font-black text-white flex items-center gap-2"><PlayCircle className="w-6 h-6 text-red-500 animate-pulse" /> Ao Vivo</h3>
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden border-4 border-slate-900 shadow-2xl bg-black">
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title="YouTube Live" frameBorder="0" allowFullScreen></iframe>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl transition-transform hover:scale-105"><Swords className="w-10 h-10 text-emerald-500 mb-3" /><p className="text-slate-500 text-xs font-black uppercase">Ativos</p><p className="text-4xl font-black text-white">{activePlayers.length}</p></div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl transition-transform hover:scale-105"><Trophy className="w-10 h-10 text-amber-500 mb-3" /><p className="text-slate-500 text-xs font-black uppercase">Rodada</p><p className="text-4xl font-black text-white">{currentRound}</p></div>
        <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-3xl shadow-xl transition-transform hover:scale-105"><Medal className="w-10 h-10 text-emerald-400 mb-3" /><p className="text-emerald-400 text-xs font-black uppercase">Campeão</p><p className="text-lg font-bold text-white">{activePlayers.length === 1 ? activePlayers[0].participantName : "Em disputa..."}</p></div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <h3 className="text-2xl font-black text-white flex items-center gap-2"><History className="w-6 h-6 text-emerald-500" /> Chave de Jogos - R{filterRound}</h3>
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {rounds.map(r => (
              <button key={r} onClick={() => setFilterRound(r)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${filterRound === r ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Rodada {r}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAndFilteredMatches.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-600 italic">Nenhum confronto validado para a Rodada {filterRound} de {selectedYear}.</div>
          ) : (
            sortedAndFilteredMatches.map(match => (
              <div key={match.id} className={`group bg-slate-900/50 border rounded-3xl p-6 transition-all shadow-lg ${match.status === 'in-progress' ? 'border-amber-500/40 ring-1 ring-amber-500/10 scale-[1.02]' : 'border-slate-800 hover:border-emerald-500/30'}`}>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Mesa {match.timestamp.toString().slice(-3)}</span>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase ${match.status === 'in-progress' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : match.status === 'finished' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                    {match.status === 'in-progress' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>}
                    {match.status === 'in-progress' ? 'Em Andamento' : match.status === 'finished' ? 'Finalizado' : 'Em Espera'}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col items-center gap-3 flex-1">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-4 shadow-xl transition-all ${match.winner === match.entry1 ? 'bg-emerald-600 border-emerald-400 text-white scale-110' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{match.entry1}</div>
                    <span className={`text-[11px] font-black text-center truncate w-full ${match.winner === match.entry1 ? 'text-emerald-400' : 'text-slate-400'}`}>{getEntryName(match.entry1)}</span>
                  </div>
                  <div className="text-slate-800 font-black text-xs italic">VS</div>
                  <div className="flex flex-col items-center gap-3 flex-1">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-4 shadow-xl transition-all ${match.winner === match.entry2 ? 'bg-emerald-600 border-emerald-400 text-white scale-110' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{match.isBye ? '...' : match.entry2}</div>
                    <span className={`text-[11px] font-black text-center truncate w-full ${match.winner === match.entry2 ? 'text-emerald-400' : 'text-slate-400'}`}>{match.isBye ? 'Folga' : getEntryName(match.entry2)}</span>
                  </div>
                </div>
                {match.winner && !match.isBye && (
                  <div className="mt-6 pt-4 border-t border-slate-800 text-center animate-in fade-in zoom-in">
                    <div className="text-emerald-400 font-black text-[10px] uppercase flex items-center justify-center gap-1.5"><Star className="w-3 h-3 fill-emerald-400" /> Ganhador: {getEntryName(match.winner)}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitorView;
