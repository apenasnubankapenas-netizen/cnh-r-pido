import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  ArrowLeft,
  Info
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Payment() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [installments, setInstallments] = useState('1');
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const amount = parseFloat(urlParams.get('amount')) || 0;
  const purchaseType = urlParams.get('type');
  const purchaseQty = parseInt(urlParams.get('qty') || '0');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const students = await base44.entities.Student.filter({ user_email: user.email });
      if (students.length > 0) setStudent(students[0]);

      const settingsData = await base44.entities.AppSettings.list();
      if (settingsData.length > 0) setSettings(settingsData[0]);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateInstallmentValue = (numInstallments) => {
    const rate = numInstallments > 1 ? 0.0299 : 0; // 2.99% ao mês
    const total = amount * Math.pow(1 + rate, parseInt(numInstallments));
    return total / parseInt(numInstallments);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(settings?.pix_key || 'cnhparatodos@pix.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const { data } = await base44.functions.invoke('createStripeCheckout', {
        amount,
        purchaseType,
        purchaseQty,
      });
      const url = data?.url;
      if (url) {
        window.location.href = url;
        return;
      }
      alert('Não foi possível iniciar o checkout.');
    } catch (e) {
      console.log(e);
      alert('Erro ao iniciar o pagamento.');
    } finally {
      setProcessing(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <Button 
        variant="ghost" 
        className="text-[#9ca3af]"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2" size={18} />
        Voltar
      </Button>

      <h1 className="text-2xl font-bold">Pagamento</h1>

      {/* Resumo */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Categoria</span>
              <span className="font-medium">{student?.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Aluno</span>
              <span className="font-medium">{student?.full_name}</span>
            </div>
            <div className="flex justify-between border-t border-[#374151] pt-2 mt-2">
              <span className="font-bold">Total</span>
              <span className="font-bold text-[#fbbf24] text-xl">R$ {amount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Método de Pagamento (simplificado para Stripe) */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg">Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#9ca3af]">Você será redirecionado ao Stripe para finalizar com cartão.</p>
        </CardContent>
      </Card>

      <Button 
       className="w-full bg-[#635bff] text-white hover:bg-[#4f46e5] py-6 text-lg"
       onClick={handlePayment}
       disabled={processing}
      >
       {processing ? 'Redirecionando…' : 'Pagar com Stripe'}
      </Button>
    </div>
  );
}