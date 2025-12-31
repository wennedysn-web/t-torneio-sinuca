import React, { useState } from 'react';
import { Participant, Entry } from '../types';
import { Plus, Trash2, UserPlus, Hash, AlertTriangle, User, Users, Database, Edit2, Check, X } from 'lucide-react';

interface Props {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  entries: Entry[];
  setEntries: React.Dispatch<React.SetStateAction<Entry[]>>;
}

const AdminParticipants: React.FC<Props> = ({ participants, setParticipants, entries, setEntries }) => {
  const [name, setName] = useState('');
  const [entryInput, setEntryInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const generateId = () => {
    return typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const generateTestData = () => {
    const testNames = ["Baianinho de Mauá", "Maycon de Teixeira", "Zico da Sinuca", "Mazinho", "Bruxo de Rio Preto", "Canário", "Foguinho", "Lorinho"];
    const usedNumbers = new Set(entries.map(e => e.number));
    const newParticipants: Participant[] = [];
    const newEntries: Entry[] = [];

    testNames.forEach(tName => {
      const id = generateId();
      const entryCount = Math.floor(Math.random() * 2) + 1;
      const entryNums: number[] = [];
      while (entryNums.length < entryCount && usedNumbers.size < 200) {
        const num = Math.floor(Math.random() * 200) + 1;
        if (!usedNumbers.has(num)) {
          usedNumbers.add(num);
          entryNums.push(num);
        }
      }
      if (entryNums.length > 0) {
        newParticipants.push({ id, name: tName, entryNumbers: entryNums });
        entryNums.forEach(num => {
          newEntries.push({ number: num, participantId: id, participantName: tName, status: 'active', currentRound: 1 });
        });
      }
    });
    setParticipants(prev => [...prev, ...newParticipants]);
    setEntries(prev => [...prev, ...newEntries]);
  };

  const addParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const entryNums = entryInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 200);
    if (entryNums.length === 0) { alert("Insira ao menos um número de inscrição (1-200)."); return; }
    if (entryNums.length > 3) { alert("Máximo 3 inscrições por participante."); return; }
    const existingNums = entries.map(e => e.number);
    const duplicates = entryNums.filter(n => existingNums.includes(n));
    if (duplicates.length > 0) { alert(`Números já em uso: ${duplicates.join(', ')}`); return; }

    const newId = generateId();
    const newParticipant: Participant = { id: newId, name: name.trim(), entryNumbers: entryNums };
    const newEntries: Entry[] = entryNums.map(num => ({ number: num, participantId: newId, participantName: name.trim(), status: 'active', currentRound: 1 }));

    setParticipants(prev => [...prev, newParticipant]);
    setEntries(prev => [...prev, ...newEntries]);
    setName('');
    setEntryInput('');
  };

  const removeParticipant = (id: string) => {
    if (!confirm("Remover participante e todas as suas inscrições?")) return;
    setParticipants(prev => prev.filter(p => p.id !== id));
    setEntries(prev => prev.filter(e => e.participantId !== id));
  };

  const startEditing = (p: Participant) => {
    setEditingId(p.id);
    setEditingName(p.name);
  };

  const saveEdit = () => {
    if (!editingName.trim()) return;
    setParticipants(prev => prev.map(p => p.id === editingId ? { ...p, name: editingName.trim() } : p));
    setEntries(prev => prev.map(e => e.participantId === editingId ? { ...e, participantName: editingName.trim() } : e));
    setEditingId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-emerald-500" />
          Gestão de Participantes
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={generateTestData} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-lg border border-slate-700 transition-all">
            <Database className="w-4 h-4" /> Gerar Teste
          </button>
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm font-medium text-slate-400">
            <span className="text-emerald-400 font-bold">{entries.length}</span> / 200 bolas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl sticky top-24">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-500" /> Novo Jogador</h3>
            <form onSubmit={addParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Nome</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Baianinho" required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Números (1-200)</label>
                <input type="text" value={entryInput} onChange={(e) => setEntryInput(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: 7, 22, 45" required />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg">Cadastrar</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-300">Inscritos</h3>
            <span className="text-xs text-slate-500">{participants.length} nomes</span>
          </div>
          <div className="grid gap-3">
            {participants.length === 0 ? (
              <div className="py-20 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800 text-slate-500">Nenhum jogador cadastrado.</div>
            ) : (
              participants.map(p => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center group hover:border-slate-700 transition-all">
                  <div className="flex-1">
                    {editingId === p.id ? (
                      <div className="flex items-center gap-2">
                        <input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="bg-slate-800 border border-emerald-500 rounded px-2 py-1 text-sm text-white outline-none w-full max-w-xs" autoFocus />
                        <button onClick={saveEdit} className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-white">{p.name}</p>
                        <div className="flex gap-1">
                          {p.entryNumbers.map(num => (
                            <span key={num} className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 rounded">#{num}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEditing(p)} className="p-2 text-slate-500 hover:text-blue-400 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => removeParticipant(p.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
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