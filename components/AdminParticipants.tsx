import React, { useState, useMemo } from 'react';
import { Participant, Entry } from '../types';
import { Plus, Trash2, UserPlus, Database, Edit2, Check, X, User, Sparkles } from 'lucide-react';

interface Props {
  participants: Participant[];
  entries: Entry[];
  onAddParticipant: (p: Participant, e: Entry[]) => void;
  onRemoveParticipant: (id: string) => void;
  onEditParticipant: (id: string, name: string) => void;
  onGenerateTestData: () => void;
}

const AdminParticipants: React.FC<Props> = ({ 
  participants, 
  entries, 
  onAddParticipant, 
  onRemoveParticipant, 
  onEditParticipant,
  onGenerateTestData 
}) => {
  const [name, setName] = useState('');
  const [entryInput, setEntryInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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

  const saveEdit = () => {
    if (!editingName.trim()) return;
    onEditParticipant(editingId!, editingName.trim());
    setEditingId(null);
  };

  const sortedParticipants = useMemo(() => {
    return [...participants].reverse();
  }, [participants]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-emerald-500" />
          Gerenciar Participantes
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={onGenerateTestData}
            className="flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/30 px-4 py-2 rounded-lg text-sm font-bold transition-all"
          >
            <Sparkles className="w-4 h-4" /> Gerar Dados Teste
          </button>
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm font-medium text-slate-400">
            <span className="text-emerald-400 font-bold">{entries.length}</span> / 200 inscrições
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl sticky top-24">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-400">
              <Plus className="w-5 h-5" /> Novo Cadastro
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Nome do Jogador</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  placeholder="Ex: Baianinho" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Bolas Escolhidas (1-200)</label>
                <input 
                  type="text" 
                  value={entryInput} 
                  onChange={(e) => setEntryInput(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  placeholder="Ex: 7, 22, 45" 
                  required 
                />
                <p className="text-[10px] text-slate-600 mt-1 font-medium">Separe por vírgula. Máximo 3 por pessoa.</p>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg active:scale-95">Cadastrar Jogador</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-300 px-2 flex items-center gap-2">
             <User className="w-5 h-5 text-emerald-500" /> 
             Lista de Inscritos ({participants.length})
          </h3>
          <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {sortedParticipants.length === 0 ? (
              <div className="py-20 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800 text-slate-500">
                <Database className="w-12 h-12 text-slate-800 mx-auto mb-3" />
                <p className="italic">Nenhum jogador cadastrado ainda.</p>
              </div>
            ) : (
              sortedParticipants.map(p => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center group hover:border-emerald-500/30 transition-all shadow-sm">
                  <div className="flex-1">
                    {editingId === p.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          value={editingName} 
                          onChange={(e) => setEditingName(e.target.value)} 
                          className="bg-slate-800 border border-emerald-500 rounded px-2 py-1 text-sm text-white outline-none w-full max-w-xs" 
                          autoFocus 
                        />
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
                    <button onClick={() => { setEditingId(p.id); setEditingName(p.name); }} className="p-2 text-slate-400 hover:text-blue-400 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { if(confirm("Deseja remover este jogador?")) onRemoveParticipant(p.id); }} className="p-2 text-slate-400 hover:text-red-400 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
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