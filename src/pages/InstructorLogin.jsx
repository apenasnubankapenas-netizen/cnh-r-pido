import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, GraduationCap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InstructorLogin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instructor, setInstructor] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me) {
          const instructors = await base44.entities.Instructor.filter({ user_email: me.email });
          if (instructors.length > 0) {
            setInstructor(instructors[0]);
            setEmail(me.email);
          }
        }
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const handleEnter = async () => {
    setError('');
    if (!email || !password) {
      setError('Informe email e senha.');
      return;
    }

    try {
      // Buscar instrutor pelo email
      const instructors = await base44.entities.Instructor.filter({ user_email: email });
      if (instructors.length === 0) {
        setError('Email não encontrado como instrutor.');
        return;
      }

      const instr = instructors[0];
      if (!instr.active) {
        setError('Instrutor inativo.');
        return;
      }

      if (password !== (instr.password || '')) {
        setError('Senha inválida.');
        return;
      }

      const key = `instructor_session_version:${email}`;
      localStorage.setItem(key, String(instr.session_version || 1));
      navigate(createPageUrl('AdminDashboard'));
    } catch (e) {
      setError('Erro ao autenticar: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <Card className="bg-[#1a2332] border-[#374151] w-full max-w-md"><CardContent className="p-6">Carregando...</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <Card className="bg-[#1a2332] border-[#374151] w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-[#3b82f6]" size={32} />
          </div>
          <CardTitle className="text-xl text-white">Login de Instrutor</CardTitle>
          <p className="text-[#9ca3af] text-sm mt-2">Informe a senha definida pelo Super Admin.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && !instructor ? (
            <div className="space-y-3">
              <p className="text-[#9ca3af] text-sm text-center">Use seu email de instrutor para entrar.</p>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email" 
                  className="bg-[#111827] border-[#374151] mt-1" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="seu.email@gmail.com"
                />
              </div>
              <div>
                <Label>Senha</Label>
                <Input 
                  type="password" 
                  className="bg-[#111827] border-[#374151] mt-1" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Senha recebida por email"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button className="w-full bg-[#1e40af] hover:bg-[#3b82f6]" onClick={handleEnter}>Entrar</Button>
              <Button variant="outline" className="w-full border-[#374151]" onClick={() => navigate(createPageUrl('Landing'))}>
                <ArrowLeft className="mr-2" size={18} /> Voltar
              </Button>
            </div>
          ) : instructor ? (
            <div className="space-y-3">
              <div>
                <Label>Senha do Instrutor</Label>
                <Input type="password" className="bg-[#111827] border-[#374151] mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button className="w-full bg-[#1e40af] hover:bg-[#3b82f6]" onClick={handleEnter}>Entrar</Button>
              <Button variant="outline" className="w-full border-[#374151]" onClick={() => base44.auth.logout()}>
                Usar outro email
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[#9ca3af] text-sm text-center">Entre com sua conta para continuar.</p>
              <div className="flex gap-2">
                <Button className="w-full bg-[#1e40af] hover:bg-[#3b82f6]" onClick={() => base44.auth.redirectToLogin(createPageUrl('InstructorLogin'))}>Entrar com Google</Button>
                <Button variant="outline" className="w-full border-[#374151]" onClick={() => navigate(createPageUrl('Landing'))}>
                  <ArrowLeft className="mr-2" size={18} /> Voltar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}