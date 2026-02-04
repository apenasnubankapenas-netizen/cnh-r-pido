import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle, ArrowLeft, Phone, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Chat() {
  const [student, setStudent] = useState(null);
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [instructorChat, setInstructorChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [instructorMessages, setInstructorMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newInstructorMessage, setNewInstructorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('school');
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [lessons, setLessons] = useState([]);
  const messagesEndRef = useRef(null);
  const instructorMessagesEndRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollInstructorToBottom();
  }, [instructorMessages]);

  useEffect(() => {
    if (conversation && activeTab === 'school') {
      const interval = setInterval(() => {
        loadMessages();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [conversation, activeTab]);

  useEffect(() => {
    if (selectedInstructor && activeTab === 'instructor') {
      const interval = setInterval(() => {
        loadInstructorMessages();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedInstructor, activeTab]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollInstructorToBottom = () => {
    instructorMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadData = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      
      const students = await base44.entities.Student.filter({ user_email: u.email });
      
      if (students.length > 0) {
        setStudent(students[0]);
        
        // Buscar ou criar conversa com autoescola
        const conversations = await base44.entities.Conversation.filter({ student_id: students[0].id });
        
        if (conversations.length > 0) {
          setConversation(conversations[0]);
          await loadMessages(conversations[0].id);
        } else {
          const newConv = await base44.entities.Conversation.create({
            student_id: students[0].id,
            student_name: students[0].full_name,
            student_email: u.email,
            status: 'aberta',
            unread_count: 0
          });
          setConversation(newConv);
        }

        // Carregar instrutores do aluno
        const l = await base44.entities.Lesson.filter({ student_id: students[0].id });
        setLessons(l || []);
        const uniqueInstructors = [...new Set(l.map(l => l.instructor_id))];
        const instr = await Promise.all(
          uniqueInstructors.map(id => base44.entities.Instructor.list().then(all => all.find(i => i.id === id)))
        );
        setInstructors(instr.filter(Boolean));
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

  const loadInstructorMessages = async () => {
    if (!selectedInstructor || !student) return;
    try {
      const key = `chat_${student.id}_${selectedInstructor.id}`;
      const stored = localStorage.getItem(key);
      setInstructorMessages(stored ? JSON.parse(stored) : []);
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

  const handleSendToInstructor = async () => {
    if (!newInstructorMessage.trim() || !selectedInstructor || !student) return;
    
    try {
      const key = `chat_${student.id}_${selectedInstructor.id}`;
      const stored = localStorage.getItem(key);
      const msgs = stored ? JSON.parse(stored) : [];
      const newMsg = {
        id: Date.now(),
        sender: 'student',
        sender_name: student.full_name,
        message: newInstructorMessage,
        timestamp: new Date().toISOString()
      };
      msgs.push(newMsg);
      localStorage.setItem(key, JSON.stringify(msgs));
      setInstructorMessages(msgs);
      setNewInstructorMessage('');
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

  if (!student) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="mx-auto text-[#9ca3af] mb-4" size={48} />
        <p className="text-[#9ca3af]">Complete seu cadastro para usar o chat</p>
      </div>
    );
  }



  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-0 h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <Card className="bg-[#1a2332] border-[#374151] rounded-b-none border-b-0">
          <CardHeader className="border-b border-[#374151] py-2 sm:py-3 px-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={16} />
                </Button>
                <MessageCircle className="text-[#fbbf24]" size={20} />
                <span className="text-sm sm:text-lg font-bold">Mensagens</span>
              </div>
            </div>
          </CardHeader>

          <TabsList className="w-full bg-[#111827] border-b border-[#374151] p-0 rounded-none h-12">
            <TabsTrigger 
              value="school" 
              className="flex-1 rounded-none border-b-2 data-[state=active]:border-[#f0c41b] data-[state=active]:bg-transparent"
            >
              <span className="text-xs sm:text-sm">Autoescola</span>
            </TabsTrigger>
            <TabsTrigger 
              value="instructor" 
              className="flex-1 rounded-none border-b-2 data-[state=active]:border-[#f0c41b] data-[state=active]:bg-transparent"
            >
              <span className="text-xs sm:text-sm">Instrutores ({instructors.length})</span>
            </TabsTrigger>
          </TabsList>
        </Card>

        <TabsContent value="school" className="flex-1 flex">
          <Card className="bg-[#1a2332] border-[#374151] rounded-t-none w-full flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
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
                      className={`max-w-[85%] sm:max-w-[70%] p-3 sm:p-4 rounded-2xl text-sm break-words ${
                        msg.sender_role === 'student' 
                          ? 'bg-[#f0c41b] text-black rounded-br-none' 
                          : 'bg-[#111827] border border-[#374151] text-white rounded-bl-none'
                      }`}
                    >
                      {msg.sender_role !== 'student' && (
                        <p className="text-[10px] sm:text-xs font-bold mb-1">{msg.sender_name || 'Autoescola'}</p>
                      )}
                      <p className="text-xs sm:text-sm">{msg.message}</p>
                      <p className={`text-[10px] sm:text-xs mt-2 text-right ${msg.sender_role === 'student' ? 'text-black/60' : 'text-white/50'}`}>
                        {new Date(msg.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="p-3 sm:p-4 border-t border-[#374151] bg-[#111827]">
              <div className="flex gap-2">
                <Input
                  className="bg-[#1a2332] border-[#374151] flex-1 h-10 text-sm rounded-full"
                  placeholder="Mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending}
                />
                <Button 
                  className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] h-10 w-10 rounded-full p-0"
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="instructor" className="flex-1 flex gap-3">
          {/* Lista de Instrutores */}
          <Card className="bg-[#1a2332] border-[#374151] rounded-t-none w-32 sm:w-48 flex flex-col overflow-hidden">
            <CardContent className="p-0 overflow-y-auto flex-1">
              {instructors.length === 0 ? (
                <div className="p-4 text-center text-[#9ca3af] text-xs">
                  Nenhum instrutor ainda
                </div>
              ) : (
                instructors.map((instr) => (
                  <button
                    key={instr.id}
                    onClick={() => { setSelectedInstructor(instr); loadInstructorMessages(); }}
                    className={`w-full p-3 border-b border-[#374151] text-left transition-colors ${
                      selectedInstructor?.id === instr.id 
                        ? 'bg-[#1e40af]/20' 
                        : 'hover:bg-[#111827]'
                    }`}
                  >
                    <p className="text-xs sm:text-sm font-medium truncate text-white">{instr.full_name}</p>
                    <p className="text-[10px] text-[#9ca3af]">Instrutor</p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Chat com Instrutor */}
          <Card className="bg-[#1a2332] border-[#374151] rounded-t-none flex-1 flex flex-col">
            {selectedInstructor ? (
              <>
                <CardHeader className="border-b border-[#374151] py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1e40af]/20 flex items-center justify-center">
                      <MessageCircle className="text-[#3b82f6]" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">{selectedInstructor.full_name}</p>
                      <p className="text-xs text-[#9ca3af]">Instrutor</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {instructorMessages.length === 0 ? (
                    <div className="text-center py-12 text-[#9ca3af]">
                      <Phone className="mx-auto mb-4" size={48} />
                      <p>Inicie uma conversa com o instrutor</p>
                    </div>
                  ) : (
                    instructorMessages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[85%] sm:max-w-[70%] p-3 sm:p-4 rounded-2xl text-sm break-words ${
                            msg.sender === 'student' 
                              ? 'bg-[#f0c41b] text-black rounded-br-none' 
                              : 'bg-[#111827] border border-[#374151] text-white rounded-bl-none'
                          }`}
                        >
                          {msg.sender !== 'student' && (
                            <p className="text-[10px] sm:text-xs font-bold mb-1">{msg.sender_name || 'Instrutor'}</p>
                          )}
                          <p className="text-xs sm:text-sm">{msg.message}</p>
                          <p className={`text-[10px] sm:text-xs mt-2 text-right ${msg.sender === 'student' ? 'text-black/60' : 'text-white/50'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={instructorMessagesEndRef} />
                </CardContent>

                <div className="p-3 sm:p-4 border-t border-[#374151] bg-[#111827]">
                  <div className="flex gap-2">
                    <Input
                      className="bg-[#1a2332] border-[#374151] flex-1 h-10 text-sm rounded-full"
                      placeholder="Mensagem..."
                      value={newInstructorMessage}
                      onChange={(e) => setNewInstructorMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendToInstructor();
                        }
                      }}
                    />
                    <Button 
                      className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] h-10 w-10 rounded-full p-0"
                      onClick={handleSendToInstructor}
                      disabled={!newInstructorMessage.trim()}
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center text-[#9ca3af]">
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-4" size={48} />
                  <p>Selecione um instrutor para conversar</p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}