import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: number;
  senderId: number;
  content: string;
}

export default function Conversation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api
      .get(`/conversations/${id}/messages`)
      .then((res) => setMessages(res.data))
      .catch((error) => console.error('Error loading messages:', error))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText('');
    await api.post(`/conversations/${id}/messages`, { content });
    load();
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col px-4 py-6">
      <button onClick={() => navigate(-1)} className="mb-4 self-start text-sm font-medium text-emerald-700">
        &larr; Back
      </button>

      <div className="flex-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4">
        {loading ? (
          <p className="text-center text-neutral-500">Loading...</p>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === user?.id;
            return (
              <div key={message.id} className={`mb-2 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <span className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-emerald-700 text-white' : 'bg-neutral-100 text-neutral-800'}`}>
                  {message.content}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm"
        />
        <button type="submit" className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white">
          Send
        </button>
      </form>
    </div>
  );
}
