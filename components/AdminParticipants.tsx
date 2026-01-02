
import React, { useState, useMemo, useEffect } from 'react';
import { Participant, Entry } from '../types';
import { Plus, Trash2, UserPlus, Database, Edit2, Check, X, User, Sparkles, Youtube, Save, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface Props {
  participants: Participant[];
  entries: Entry[];
  youtubeLink?: string;
  showLive: boolean;
  onAddParticipant: (p: Participant, e: Entry[]) => void;
  onRemoveParticipant: (id: string) => void;
  onEditParticipant: (id: string, name: string) => void;
  onUpdateYoutube: (link: string, show: boolean) => void;
  onGenerateTestData: () => void;
  onResetAll: () => void;
}

const AdminParticipants: React.FC<Props> = ({ 
  participants, 
  entries, 
  youtubeLink = '',
  showLive,
  onAddParticipant, 
  onRemoveParticipant, 
  onEditParticipant,
  onUpdateYoutube,
  onGenerateTestData,
  onResetAll
}) => {
  const [name, setName] = useState('');
  const [entryInput, setEntryInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [ytInput, setYtInput] = useState(youtubeLink);
  const [showLiveLocal, setShowLiveLocal] = useState(showLive);

  useEffect(() => { setYtInput(youtubeLink); }, [youtubeLink]);
  useEffect(() => { setShowLiveLocal(showLive); }, [showLive]);

  const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const entryNums = entryInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 200);
    
    if (entryNums.length === 0) { alert("Insira números válidos."); return; }
    if (entryNums.length > 3) { alert("Máximo 3 inscrições por jogador."); return; }
    
    const existingNums = entries.map(ent => ent.number);
    const duplicates = entryNums.filter(n => existingNums.includes(n));
    if (duplicates.length > 0) { alert(`Números já em uso: ${duplicates.join(', ')}`); return; }

    const newId = generateId();
    const newParticipant: Participant = { id: newId, name: name.trim(), entryNumbers: entryNums };
    const newEntries: Entry[] = entryNums.map(num => ({ 
      number: num, 
      participantId: newId, 
      participantName: name.trim(), 
      status: 'active', 
      currentRound: 1 
    }));

    onAddParticipant(newParticipant, newEntries);
    setName('');
    setEntryInput('');
  };

  const handleYtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateYoutube(ytInput.trim(), showLiveLocal);
    alert("Configurações atualizadas!");
  };

  const saveEdit = () => {
    if (!editingName.trim()) return;
    onEditParticipant(editingId!, editingName.trim());
    setEditingId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-emerald-500" />
          Participantes e Setup
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={onGenerateTestData} className="hidden md:flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/30 px-4 py-2 rounded-lg text-sm font-bold transition-all"><Sparkles className="w-4 h-4" /> Teste</button>
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm font-medium text-slate-400">
            <span className="text-emerald-400 font-bold">{entries.length}</span> / 200 BOLAS
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-500"><Youtube className="w-5 h-5" /> Transmissão</h3>
            <form onSubmit={handleYtSubmit} className="space-y-4">
              <input type="url" value={ytInput} onChange={(e) => setYtInput(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 outline-none text-sm" placeholder="URL do YouTube..." />
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors">
                <input type="checkbox" checked={showLiveLocal} onChange={(e) => setShowLiveLocal(e.target.checked)} className="w-5 h-5 rounded border-slate-600 text-emerald-500 bg-slate-700" />
                <span className={`text-sm font-bold ${showLiveLocal ? 'text-white' : 'text-slate-500'}`}>Exibir para visitantes</span>
              </label>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2">Salvar</button>
            </form>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-400"><Plus className="w-5 h-5" /> Cadastro</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Nome do Jogador" required />
              <input type="text" value={entryInput} onChange={(e) => setEntryInput(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Números: 1, 15, 88" required />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg">Cadastrar</button>
            </form>
          </div>

          <div className="bg-red-900/10 p-6 rounded-2xl border border-red-900/30 shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-500"><AlertTriangle className="w-5 h-5" /> Manutenção</h3>
            <button onClick={onResetAll} className="w-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Limpar todos os Dados
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-300 px-2 flex items-center gap-2"><User className="w-5 h-5 text-emerald-500" /> Inscritos ({participants.length})</h3>
          <div className="grid gap-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {participants.length === 0 ? (
              <div className="py-20 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800 text-slate-500">Nenhum jogador cadastrado.</div>
            ) : (
              [...participants].reverse().map(p => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center group transition-all">
                  <div className="flex-1">
                    {editingId === p.id ? (
                      <div className="flex items-center gap-2">
                        <input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="bg-slate-800 border border-emerald-500 rounded px-2 py-1 text-sm text-white outline-none w-full max-w-xs" autoFocus />
                        <button onClick={saveEdit} className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">{p.name}</p>
                        <div className="flex gap-1">
                          {p.entryNumbers.map(num => (
                            <span key={num} className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">#{String(num).padStart(3, '0')}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(p.id); setEditingName(p.name); }} className="p-2 text-slate-400 hover:text-blue-400 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { if(confirm("Remover este jogador?")) onRemoveParticipant(p.id); }} className="p-2 text-slate-400 hover:text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminParticipants;
