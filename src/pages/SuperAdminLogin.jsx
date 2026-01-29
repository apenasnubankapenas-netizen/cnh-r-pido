import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Crown, ArrowLeft, Lock, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from '@/api/base44Client';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Verificar credenciais
    if (username === 'KALABASTRO' && password === 'Dashbin1234@') {
      setLoading(true);
      try {
        // Verificar se já está logado
        const user = await base44.auth.me();
        if (user && user.role === 'admin') {
          navigate(createPageUrl('AdminDashboard'));
        } else {
          // Redirecionar para login do Base44
          base44.auth.redirectToLogin(createPageUrl('AdminDashboard'));
        }
      } catch (e) {
        // Não está logado, redirecionar para login
        base44.auth.redirectToLogin(createPageUrl('AdminDashboard'));
      }
    } else {
      setError('Credenciais inválidas');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <Card className="bg-[#1a2332] border-[#374151] w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-[#fbbf24]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="text-[#fbbf24]" size={32} />
          </div>
          <CardTitle className="text-xl text-white">Acesso Super Admin</CardTitle>
          <p className="text-[#9ca3af] text-sm mt-2">
            Esta área é exclusiva para o Super Administrador.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-[#9ca3af] mb-2 block">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af]" size={18} />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-[#0d1117] border-[#374151] text-white"
                  placeholder="Digite o usuário"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-[#9ca3af] mb-2 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af]" size={18} />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-[#0d1117] border-[#374151] text-white"
                  placeholder="Digite a senha"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button 
              type="submit"
              className="w-full bg-[#fbbf24] text-black hover:bg-[#d4aa00] font-bold"
              disabled={loading}
            >
              {loading ? 'Acessando...' : 'Acessar Sistema'}
            </Button>

            <Button 
              type="button"
              variant="outline"
              className="w-full border-[#374151] text-white hover:bg-[#1e293b]"
              onClick={() => navigate(createPageUrl('Landing'))}
            >
              <ArrowLeft className="mr-2" size={18} />
              Voltar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}