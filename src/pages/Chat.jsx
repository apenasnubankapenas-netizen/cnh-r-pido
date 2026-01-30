import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Chat() {
  const [student, setStudent] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversation) {
      const interval = setInterval(() => {
        loadMessages();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const students = await base44.entities.Student.filter({ user_email: user.email });
      
      if (students.length > 0) {
        setStudent(students[0]);
        
        // Buscar ou criar conversa
        const conversations = await base44.entities.Conversation.filter({ student_id: students[0].id });
        
        if (conversations.length > 0) {
          setConversation(conversations[0]);
          await loadMessages(conversations[0].id);
        } else {
          // Criar nova conversa
          const newConv = await base44.entities.Conversation.create({
            student_id: students[0].id,
            student_name: students[0].full_name,
            student_email: user.email,
            status: 'aberta',
            unread_count: 0
          });
          setConversation(newConv);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    const id = convId || conversation?.id;
    if (!id) return;
    
    try {
      const msgs = await base44.entities.ChatMessage.filter({ conversation_id: id });
      setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    } catch (e) {
      console.log(e);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation || !student) return;
    
    setSending(true);
    try {
      await base44.entities.ChatMessage.create({
        conversation_id: conversation.id,
        sender_email: student.user_email,
        sender_name: student.full_name,
        sender_role: 'student',
        message: newMessage,
        read: false
      });

      await base44.entities.Conversation.update(conversation.id, {
        last_message: newMessage,
        unread_count: (conversation.unread_count || 0) + 1
      });

      setNewMessage('');
      await loadMessages();
    } catch (e) {
      console.log(e);
    } finally {
      setSending(false);
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

  if (!student) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="mx-auto text-[#9ca3af] mb-4" size={48} />
        <p className="text-[#9ca3af]">Complete seu cadastro para usar o chat</p>
      </div>
    );
  }



  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-[#1a2332] border-[#374151] h-[calc(100vh-180px)] flex flex-col">
        <CardHeader className="border-b border-[#374151] py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} />
            </Button>
            <MessageCircle className="text-[#fbbf24]" />
            Chat com a Autoescola
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-[#9ca3af]">
              <MessageCircle className="mx-auto mb-4" size={48} />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Envie uma mensagem para iniciar a conversa</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex ${msg.sender_role === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.sender_role === 'student' 
                      ? 'bg-[#1e40af] text-white rounded-br-none' 
                      : 'bg-[#111827] border border-[#374151] rounded-bl-none'
                  }`}
                >
                  {msg.sender_role !== 'student' && (
                    <p className="text-xs text-[#fbbf24] mb-1">{msg.sender_name || 'Autoescola'}</p>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs text-white/50 mt-1 text-right">
                    {new Date(msg.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 border-t border-[#374151]">
          <div className="flex gap-2">
            <Input
              className="bg-[#111827] border-[#374151] flex-1"
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
            />
            <Button 
              className="bg-[#1e40af] hover:bg-[#3b82f6]"
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}