import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLogin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me) {
          if (me.email === 'tcnhpara@gmail.com') {
            navigate(createPageUrl('AdminDashboard'));
            return;
          }
          if (me.role === 'admin') {
            const sellers = await base44.entities.Seller.filter({ email: me.email });
            if (sellers.length > 0) setSeller(sellers[0]);
          }
        }
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const handleEnterSeller = () => {
    setError('');
    if (!seller) {
      navigate(createPageUrl('AdminDashboard'));
      return;
    }
    if (!password || password !== (seller.password || '')) {
      setError('Senha inválida.');
      return;
    }
    const key = `seller_session_version:${user.email}`;
    localStorage.setItem(key, String(seller.session_version || 1));
    navigate(createPageUrl('AdminDashboard'));
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
            <Shield className="text-[#3b82f6]" size={32} />
          </div>
          <CardTitle className="text-xl text-white">Acesso Administrativo</CardTitle>
          <p className="text-[#9ca3af] text-sm mt-2">
            Esta área é restrita aos administradores do sistema.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <>
              <p className="text-[#9ca3af] text-sm text-center">
                Para acessar o painel administrativo, você precisa ter uma conta de administrador.
                Entre em contato com o Super Admin para solicitar acesso.
              </p>
              <div className="flex gap-2">
                <Button className="w-full bg-[#1e40af] hover:bg-[#3b82f6]" onClick={() => base44.auth.redirectToLogin(createPageUrl('AdminLogin'))}>
                  Entrar
                </Button>
                <Button variant="outline" className="w-full border-[#374151]" onClick={() => navigate(createPageUrl('Home'))}>
                  <ArrowLeft className="mr-2" size={18} /> Voltar
                </Button>
              </div>
            </>
          )}

          {user && user.role !== 'admin' && (
            <div className="text-center space-y-3">
              <p className="text-sm text-red-400">Acesso administrativo proibido para alunos.</p>
              <Button variant="outline" className="w-full border-[#374151]" onClick={() => navigate(createPageUrl('Home'))}>
                <ArrowLeft className="mr-2" size={18} /> Voltar para o início
              </Button>
            </div>
          )}

          {user && seller && (
            <div className="space-y-3">
              <p className="text-sm text-[#9ca3af]">Olá, {user.full_name || user.email}. Informe sua senha de vendedor para acessar.</p>
              <div>
                <Label>Senha do Vendedor</Label>
                <Input type="password" className="bg-[#111827] border-[#374151] mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button className="w-full bg-[#1e40af] hover:bg-[#3b82f6]" onClick={handleEnterSeller}>Entrar</Button>
            </div>
          )}

          {user && user.role === 'admin' && !seller && (
            <div className="text-center space-y-3">
              <p className="text-sm">Bem-vindo, {user.full_name || user.email}.</p>
              <Button className="w-full bg-[#1e40af] hover:bg-[#3b82f6]" onClick={() => navigate(createPageUrl('AdminDashboard'))}>
                Ir para o Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}