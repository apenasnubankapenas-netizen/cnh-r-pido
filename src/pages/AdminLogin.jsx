import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLogin() {
  const navigate = useNavigate();

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
          <p className="text-[#9ca3af] text-sm text-center">
            Para acessar o painel administrativo, você precisa ter uma conta de administrador.
            Entre em contato com o Super Admin para solicitar acesso.
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