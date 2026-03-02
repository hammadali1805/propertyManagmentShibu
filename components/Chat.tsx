
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, ChatMessage } from '../types';

interface ChatProps {
  user: User;
  propertyId: string;
  propertyName: string;
}

const Chat: React.FC<ChatProps> = ({ user, propertyId, propertyName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit('join_property', propertyId);

    newSocket.on('chat_history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    newSocket.on('new_message', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [propertyId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      propertyId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content: newMessage,
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[500]">
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
          isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-comment-alt'}`}></i>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-scaleUp">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-building text-sm"></i>
              </div>
              <div>
                <h3 className="font-black text-sm truncate">{propertyName}</h3>
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Ops & Admin Channel</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <i className="fas fa-comments text-4xl mb-2"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">No messages yet</p>
                <p className="text-[8px] uppercase mt-1">Start the conversation</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderId === user.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium ${
                    isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase">{msg.senderName}</span>
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                      msg.senderRole === 'SUPER_ADMIN' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {msg.senderRole.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-50">
            <div className="relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
              >
                <i className="fas fa-paper-plane text-[10px]"></i>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chat;
