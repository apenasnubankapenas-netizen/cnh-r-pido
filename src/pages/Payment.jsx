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
  const [paymentMethod, setPaymentMethod] = useState('pix');
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
      const description = purchaseType ? JSON.stringify({ kind: 'lessons_purchase', type: purchaseType, qty: purchaseQty || 1 }) : `Pagamento - Categoria ${student.category}`;
      await base44.entities.Payment.create({
        student_id: student.id,
        student_name: student.full_name,
        amount: amount,
        method: paymentMethod,
        installments: parseInt(installments),
        description,
        status: 'pendente'
      });

      alert('Pagamento registrado! Aguarde a confirmação.');
      navigate(createPageUrl('Home'));
    } catch (e) {
      console.log(e);
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

      {/* Método de Pagamento */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg">Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div 
              className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                paymentMethod === 'pix' 
                  ? 'border-[#fbbf24] bg-[#fbbf24]/10' 
                  : 'border-[#374151] hover:border-[#3b82f6]'
              }`}
              onClick={() => setPaymentMethod('pix')}
            >
              <RadioGroupItem value="pix" id="pix" />
              <QrCode className="text-[#fbbf24]" size={24} />
              <div className="flex-1">
                <Label htmlFor="pix" className="cursor-pointer font-bold">PIX</Label>
                <p className="text-xs text-[#9ca3af]">Pagamento instantâneo</p>
              </div>
              <span className="text-sm text-green-400">À vista</span>
            </div>

            <div 
              className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                paymentMethod === 'cartao' 
                  ? 'border-[#fbbf24] bg-[#fbbf24]/10' 
                  : 'border-[#374151] hover:border-[#3b82f6]'
              }`}
              onClick={() => setPaymentMethod('cartao')}
            >
              <RadioGroupItem value="cartao" id="cartao" />
              <CreditCard className="text-[#3b82f6]" size={24} />
              <div className="flex-1">
                <Label htmlFor="cartao" className="cursor-pointer font-bold">Cartão de Crédito</Label>
                <p className="text-xs text-[#9ca3af]">Parcele em até 10x</p>
              </div>
              <span className="text-sm text-[#9ca3af]">Com juros</span>
            </div>
          </RadioGroup>

          {/* PIX */}
          {paymentMethod === 'pix' && (
            <div className="p-4 bg-[#111827] rounded-lg border border-[#374151] space-y-4">
              <div className="text-center">
                <div className="w-48 h-48 bg-white rounded-lg mx-auto flex items-center justify-center">
                  <QrCode size={150} className="text-black" />
                </div>
                <p className="text-sm text-[#9ca3af] mt-2">Escaneie o QR Code ou copie a chave</p>
              </div>
              
              <div className="flex gap-2">
                <Input 
                  className="bg-[#1a2332] border-[#374151] flex-1"
                  value={settings?.pix_key || 'cnhparatodos@pix.com'}
                  readOnly
                />
                <Button 
                  variant="outline" 
                  className="border-[#374151]"
                  onClick={handleCopyPix}
                >
                  {copied ? <Check className="text-green-500" size={18} /> : <Copy size={18} />}
                </Button>
              </div>

              <div className="p-3 bg-[#1e40af]/10 border border-[#1e40af]/50 rounded-lg text-sm">
                <Info className="inline mr-2 text-[#3b82f6]" size={16} />
                <span className="text-[#9ca3af]">
                  Banco: Sicoob | Agência: 5024 | Conta: 77.487-1
                </span>
              </div>
            </div>
          )}

          {/* Cartão */}
          {paymentMethod === 'cartao' && (
            <div className="p-4 bg-[#111827] rounded-lg border border-[#374151] space-y-4">
              <div>
                <Label>Parcelas</Label>
                <Select value={installments} onValueChange={setInstallments}>
                  <SelectTrigger className="bg-[#1a2332] border-[#374151] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-[#374151]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}x de R$ {calculateInstallmentValue(num).toFixed(2)}
                        {num > 1 && ' (com juros)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Número do Cartão</Label>
                  <Input 
                    className="bg-[#1a2332] border-[#374151] mt-1"
                    placeholder="0000 0000 0000 0000"
                  />
                </div>
                <div>
                  <Label>Validade</Label>
                  <Input 
                    className="bg-[#1a2332] border-[#374151] mt-1"
                    placeholder="MM/AA"
                  />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input 
                    className="bg-[#1a2332] border-[#374151] mt-1"
                    placeholder="000"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Nome no Cartão</Label>
                  <Input 
                    className="bg-[#1a2332] border-[#374151] mt-1"
                    placeholder="Como está no cartão"
                  />
                </div>
              </div>

              {parseInt(installments) > 1 && (
                <div className="p-3 bg-[#fbbf24]/10 border border-[#fbbf24]/50 rounded-lg text-sm">
                  <p className="text-[#fbbf24]">
                    Total com juros: R$ {(calculateInstallmentValue(parseInt(installments)) * parseInt(installments)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Button 
        className="w-full bg-[#fbbf24] text-black hover:bg-[#fbbf24]/80 py-6 text-lg"
        onClick={handlePayment}
        disabled={processing}
      >
        {processing ? 'Processando...' : (
          paymentMethod === 'pix' ? 'Já fiz o PIX' : 'Finalizar Pagamento'
        )}
      </Button>
    </div>
  );
}