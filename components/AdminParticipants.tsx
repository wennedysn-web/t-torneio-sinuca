
import React, { useState } from 'react';
import { Participant, Entry } from '../types';
// Fixed: Added 'Users' to imports
import { Plus, Trash2, UserPlus, Hash, AlertTriangle, User, Users } from 'lucide-react';

interface Props {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  entries: Entry[];
  setEntries: React.Dispatch<React.SetStateAction<Entry[]>>;
}

const AdminParticipants: React.FC<Props> = ({ participants, setParticipants, entries, setEntries }) => {
  const [name, setName] = useState('');
  const [entryInput, setEntryInput] = useState('');

  const addParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Parse entry numbers
    const entryNums = entryInput.split(',')
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= 200);

    if (entryNums.length === 0) {
      alert("Insira ao menos um número de inscrição válido (1-200).");
      return;
    }

    if (entryNums.length > 3) {
      alert("Cada participante pode ter no máximo 3 inscrições.");
      return;
    }

    // Check for duplicates globally
    const existingNums = entries.map(e => e.number);
    const duplicates = entryNums.filter(n => existingNums.includes(n));
    if (duplicates.length > 0) {
      alert(`Os números seguintes já estão em uso: ${duplicates.join(', ')}`);
      return;
    }

    const newId = crypto.randomUUID();
    const newParticipant: Participant = {
      id: newId,
      name: name.trim(),
      entryNumbers: entryNums
    };

    const newEntries: Entry[] = entryNums.map(num => ({
      number: num,
      participantId: newId,
      participantName: name.trim(),
      status: 'active',
      currentRound: 1
    }));

    setParticipants(prev => [...prev, newParticipant]);
    setEntries(prev => [...prev, ...newEntries]);
    setName('');
    setEntryInput('');
  };

  const removeParticipant = (id: string) => {
    if (!confirm("Tem certeza que deseja remover este participante? Todas as suas inscrições serão excluídas.")) return;
    setParticipants(prev => prev.filter(p => p.id !== id));
    setEntries(prev => prev.filter(e => e.participantId !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-emerald-500" />
          Gestão de Participantes
        </h2>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm font-medium text-slate-400">
          <span className="text-emerald-400 font-bold">{entries.length}</span> / 200 inscrições utilizadas
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl sticky top-24">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" />
              Novo Participante
            </h3>
            <form onSubmit={addParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nome Completo</label>
                <div className="relative">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                   <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Nome do jogador"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Números de Inscrição (1-200)</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={entryInput}
                    onChange={(e) => setEntryInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: 5, 12, 88 (Separados por vírgula)"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Máximo 3 inscrições por pessoa. Sem números repetidos.
                </p>
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20"
              >
                Cadastrar
              </button>
            </form>
          </div>
        </div>

        {/* Participants List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-300">Lista de Jogadores</h3>
            <span className="text-xs text-slate-500">{participants.length} nomes cadastrados</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {participants.length === 0 ? (
              <div className="sm:col-span-2 py-20 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
                <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Nenhum participante cadastrado ainda.</p>
              </div>
            ) : (
              participants.map(p => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-start group hover:border-slate-700 transition-all shadow-sm">
                  <div className="space-y-2">
                    <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">{p.name}</p>
                    <div className="flex gap-1.5">
                      {p.entryNumbers.map(num => (
                        <span key={num} className="bg-slate-800 text-emerald-400 text-[10px] font-black px-2 py-1 rounded border border-slate-700">
                          #{String(num).padStart(3, '0')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeParticipant(p.id)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
