import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, UserCog } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SellerLogin() {
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
          const sellers = await base44.entities.Seller.filter({ email: me.email });
          if (sellers.length > 0) setSeller(sellers[0]);
        }
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const handleEnter = () => {
    setError('');
    if (!seller) {
      setError('Sua conta não está como Vendedor.');
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
            <UserCog className="text-[#3b82f6]" size={32} />
          </div>
          <CardTitle className="text-xl text-white">Login de Vendedor</CardTitle>
          <p className="text-[#9ca3af] text-sm mt-2">Informe a senha definida pelo Super Admin.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <div className="space-y-3">
              <p className="text-[#9ca3af] text-sm text-center">Entre com sua conta para continuar.</p>
              <div className="flex gap-2">
                <Button className="w-full bg-[#1e40af] hover:bg-[#3b82f6]" onClick={() => base44.auth.redirectToLogin(createPageUrl('SellerLogin'))}>Entrar</Button>
                <Button variant="outline" className="w-full border-[#374151]" onClick={() => navigate(createPageUrl('Home'))}>
                  <ArrowLeft className="mr-2" size={18} /> Voltar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Senha do Vendedor</Label>
                <Input type="password" className="bg-[#111827] border-[#374151] mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button className="w-full bg-[#1e40af] hover:bg-[#3b82f6]" onClick={handleEnter}>Entrar</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}