import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send, User, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminChats() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      const interval = setInterval(() => {
        loadMessages(selectedConversation.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const convs = await base44.entities.Conversation.list();
      setConversations(convs);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const msgs = await base44.entities.ChatMessage.filter({ conversation_id: convId });
      setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    } catch (e) {
      console.log(e);
    }
  };

  const handleSelectConversation = async (conv) => {
    setSelectedConversation(conv);
    await loadMessages(conv.id);
    
    // Marcar como lido
    if (conv.unread_count > 0) {
      await base44.entities.Conversation.update(conv.id, { unread_count: 0 });
      loadData();
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      await base44.entities.ChatMessage.create({
        conversation_id: selectedConversation.id,
        sender_email: user.email,
        sender_name: user.full_name || 'Admin',
        sender_role: 'admin',
        message: newMessage,
        read: false
      });

      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message: newMessage
      });

      setNewMessage('');
      await loadMessages(selectedConversation.id);
    } catch (e) {
      console.log(e);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <MessageSquare className="text-[#fbbf24]" />
        Conversas
      </h1>

      <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Lista de Conversas */}
        <Card className="bg-[#1a2332] border-[#374151] overflow-hidden">
          <CardHeader className="py-3 border-b border-[#374151]">
            <CardTitle className="text-sm">Conversas ({conversations.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto h-[calc(100%-60px)]">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-3 border-b border-[#374151] cursor-pointer transition-colors ${
                  selectedConversation?.id === conv.id 
                    ? 'bg-[#1e40af]/20' 
                    : 'hover:bg-[#111827]'
                }`}
                onClick={() => handleSelectConversation(conv)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1e40af]/20 flex items-center justify-center">
                      <User className="text-[#3b82f6]" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{conv.student_name}</p>
                      <p className="text-xs text-[#9ca3af] truncate max-w-[150px]">
                        {conv.last_message || 'Sem mensagens'}
                      </p>
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge className="bg-[#fbbf24] text-black">{conv.unread_count}</Badge>
                  )}
                </div>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="p-4 text-center text-[#9ca3af]">
                Nenhuma conversa
              </div>
            )}
          </CardContent>
        </Card>

        {/* Área de Mensagens */}
        <Card className="bg-[#1a2332] border-[#374151] md:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="py-3 border-b border-[#374151]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1e40af]/20 flex items-center justify-center">
                    <User className="text-[#3b82f6]" size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{selectedConversation.student_name}</CardTitle>
                    <p className="text-xs text-[#9ca3af]">{selectedConversation.student_email}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.sender_role !== 'student' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.sender_role !== 'student'
                          ? 'bg-[#1e40af] text-white rounded-br-none' 
                          : 'bg-[#111827] border border-[#374151] rounded-bl-none'
                      }`}
                    >
                      {msg.sender_role === 'student' && (
                        <p className="text-xs text-[#fbbf24] mb-1">{msg.sender_name}</p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs text-white/50 mt-1 text-right">
                        {new Date(msg.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 border-t border-[#374151]">
                <div className="flex gap-2">
                  <Input
                    className="bg-[#111827] border-[#374151] flex-1"
                    placeholder="Digite sua resposta..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button 
                    className="bg-[#1e40af] hover:bg-[#3b82f6]"
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center text-[#9ca3af]">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-4" size={48} />
                <p>Selecione uma conversa para começar</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}