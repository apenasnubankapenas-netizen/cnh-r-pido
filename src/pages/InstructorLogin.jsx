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
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me) {
          const instructors = await base44.entities.Instructor.filter({ user_email: me.email });
          if (instructors.length > 0 && instructors[0].active) {
            setInstructor(instructors[0]);
            // Autenticado e é instrutor ativo, fazer login automático
            const key = `instructor_session_version:${me.email}`;
            localStorage.setItem(key, String(instructors[0].session_version || 1));
            navigate(createPageUrl('AdminDashboard'));
            return;
          } else if (instructors.length === 0) {
            // Email não está registrado como instrutor
            setError(`O email ${me.email} não está registrado como instrutor. Use o email correto do cadastro.`);
          } else {
            // Instrutor inativo
            setError('Sua conta de instrutor está inativa. Contate o administrador.');
          }
        }
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const handleGoogleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('InstructorLogin'));
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
          <p className="text-[#9ca3af] text-sm mt-2">Entre com sua conta Google</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <div className="space-y-3">
              <p className="text-[#9ca3af] text-sm text-center">Entre com sua conta Google para acessar como instrutor.</p>
              <Button 
                className="w-full bg-white text-black hover:bg-gray-200 py-6 text-base font-bold flex items-center justify-center gap-2"
                onClick={handleGoogleLogin}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com Google
              </Button>
              <Button variant="outline" className="w-full border-[#374151]" onClick={() => navigate(createPageUrl('Landing'))}>
                <ArrowLeft className="mr-2" size={18} /> Voltar
              </Button>
            </div>
          ) : error ? (
            <div className="space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-500 rounded text-red-400 text-sm text-center">
                {error}
              </div>
              <Button 
                className="w-full bg-white text-black hover:bg-gray-200 py-6 text-base font-bold flex items-center justify-center gap-2"
                onClick={() => base44.auth.logout()}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Tentar outro email
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-[#9ca3af] mb-4">Verificando credenciais...</p>
              <div className="animate-pulse text-[#fbbf24]">Carregando</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}