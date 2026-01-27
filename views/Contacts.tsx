
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contact } from '../types';

interface ContactsProps {
  t: any;
}

const ContactsView: React.FC<ContactsProps> = ({ t }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newConnectId, setNewConnectId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('connectly_contacts');
    if (saved) {
      setContacts(JSON.parse(saved));
    }
  }, []);

  const saveContacts = (updated: Contact[]) => {
    setContacts(updated);
    localStorage.setItem('connectly_contacts', JSON.stringify(updated));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || newConnectId.length !== 4) return;
    
    const newContact: Contact = {
      id: Date.now().toString(),
      name: newName,
      connectId: newConnectId,
    };
    saveContacts([...contacts, newContact]);
    setNewName('');
    setNewConnectId('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    saveContacts(contacts.filter(c => c.id !== id));
  };

  const handleCall = (connectId: string) => {
    // Navigate home with state to trigger call
    navigate('/', { state: { callId: connectId } });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-[100dvh] pb-24 md:pb-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800">{t.contacts}</h1>
          <p className="text-slate-500 text-sm">{t.developerCredit}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <i className="fa-solid fa-plus"></i>
          <span className="hidden sm:inline">{t.addContact}</span>
        </button>
      </header>

      {isAdding && (
        <div className="mb-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.contactName}</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ID</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={newConnectId}
                  onChange={(e) => setNewConnectId(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-mono tracking-widest"
                  placeholder="1234"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all">
                {t.save}
              </button>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <i className="fa-solid fa-address-book text-3xl"></i>
          </div>
          <p className="font-bold">{t.noContacts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {contacts.map((contact) => (
            <div 
              key={contact.id}
              className="group bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{contact.name}</h3>
                  <p className="text-xs text-slate-400 font-mono tracking-widest">ID: {contact.connectId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleCall(contact.connectId)}
                  className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-90"
                >
                  <i className="fa-solid fa-phone"></i>
                </button>
                <button 
                  onClick={() => handleDelete(contact.id)}
                  className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactsView;
