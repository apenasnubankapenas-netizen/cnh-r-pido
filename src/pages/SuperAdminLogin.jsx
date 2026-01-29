import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Crown, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminLogin() {
  const navigate = useNavigate();

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
        <CardContent className="space-y-4">
          <p className="text-[#9ca3af] text-sm text-center">
            O Super Admin possui controle total sobre o sistema, incluindo configurações de preços, 
            gerenciamento de vendedores e todas as funcionalidades administrativas.
          </p>

          <Button 
            className="w-full bg-[#1e40af] hover:bg-[#3b82f6]"
            onClick={() => navigate(createPageUrl('Home'))}
          >
            <ArrowLeft className="mr-2" size={18} />
            Voltar para o Início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}