import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


export default function Payment() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [installments, setInstallments] = useState('1');
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [trialCount, setTrialCount] = useState(0);

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
      if (students.length > 0) {
        setStudent(students[0]);
        const lessons = await base44.entities.Lesson.filter({ student_id: students[0].id });
        setTrialCount((lessons || []).filter(l => l.trial).length);
      }

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
    navigator.clipboard.writeText(settings?.pix_key || '6198875627');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const isPending = urlParams.get('pending') === 'true';
      
      if (isPending) {
        // Novo registro: criar aluno primeiro
        const pendingData = localStorage.getItem('pendingStudentRegistration');
        if (!pendingData) {
          alert('Dados de registro não encontrados. Por favor, refaça o cadastro.');
          navigate(createPageUrl('StudentRegister'));
          return;
        }
        
        const { studentData, lessonSchedules, referralSeller } = JSON.parse(pendingData);
        
        // Criar student
        const createdStudent = await base44.entities.Student.create(studentData);
        
        // Criar aulas como trial
        for (const schedule of lessonSchedules) {
          await base44.entities.Lesson.create({
            student_id: createdStudent.id,
            student_name: createdStudent.full_name,
            student_renach: createdStudent.renach,
            instructor_id: schedule.instructor_id,
            instructor_name: schedule.instructor_name,
            date: schedule.date,
            time: schedule.time,
            type: schedule.type,
            status: 'agendada',
            trial: true,
            notified: false
          });
        }

        if (paymentMethod === 'pix') {
          await base44.entities.Payment.create({
            student_id: createdStudent.id,
            student_name: createdStudent.full_name,
            amount: amount,
            method: 'pix',
            installments: 1,
            description: 'PIX - Cadastro Inicial',
            status: 'pendente'
          });
          alert('Cadastro criado! Pedido PIX gerado. Copie a chave e faça o pagamento. Após pagamento, aguarde confirmação do admin.');
          localStorage.removeItem('pendingStudentRegistration');
          navigate(createPageUrl('Home'));
          return;
        }

        // Stripe checkout
        const { data } = await base44.functions.invoke('createStripeCheckout', {
          amount,
          studentId: createdStudent.id,
          purchaseType: 'inscricao',
          purchaseQty: 1,
        });
        const url = data?.url;
        if (url) {
          localStorage.removeItem('pendingStudentRegistration');
          window.location.href = url;
          return;
        }
        alert('Não foi possível iniciar o checkout.');
        return;
      }

      // Pagamento adicional (já tem student)
      if (paymentMethod === 'pix') {
        const user = await base44.auth.me();
        const students = await base44.entities.Student.filter({ user_email: user.email });
        const s = students[0];
        await base44.entities.Payment.create({
          student_id: s.id,
          student_name: s.full_name,
          amount: amount,
          method: 'pix',
          installments: 1,
          description: purchaseType ? `PIX - ${purchaseType} x${purchaseQty || 1}` : 'PIX - Pagamento',
          status: 'pendente'
        });
        alert('Pedido PIX gerado. Copie a chave e faça o pagamento.');
        return;
      }

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
      alert('Erro ao processar o pagamento: ' + e.message);
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

      {student && student.payment_status !== 'pago' && trialCount === 0 && (
        <Card className="bg-[#1a2332] border-[#fbbf24]/40">
          <CardContent className="p-4 text-sm">
            Agende ao menos 1 aula de teste em "Minhas Aulas" antes de realizar o pagamento.
            <div className="mt-3">
              <Button variant="outline" className="border-[#fbbf24] text-[#fbbf24]" onClick={() => navigate(createPageUrl('MyLessons'))}>Ir para Minhas Aulas</Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Forma de Pagamento */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg">Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 rounded border border-[#374151] cursor-pointer">
              <RadioGroupItem value="card" id="pm-card" />
              <CreditCard size={16} /> Cartão (Stripe)
            </label>
            <label className="flex items-center gap-2 p-3 rounded border border-[#374151] cursor-pointer">
              <RadioGroupItem value="pix" id="pm-pix" />
              <QrCode size={16} /> PIX
            </label>
          </RadioGroup>

          {paymentMethod === 'card' && (
            <p className="text-sm text-[#9ca3af]">Você será redirecionado ao Stripe para finalizar com cartão.</p>
          )}

          {paymentMethod === 'pix' && (
            <div className="mt-2 p-3 bg-[#111827] rounded border border-[#374151]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-[#9ca3af]">Chave PIX</div>
                  <div className="font-mono text-lg">{settings?.pix_key || '6198875627'}</div>
                </div>
                <Button variant="outline" onClick={handleCopyPix} className="border-[#374151]">
                  {copied ? <Check className="mr-2" size={16} /> : <Copy className="mr-2" size={16} />}
                  {copied ? 'Copiada' : 'Copiar'}
                </Button>
              </div>
              <p className="text-xs text-[#9ca3af] mt-2">Após pagar via PIX, clique em "Gerar pedido PIX" para registrarmos seu pedido.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button 
       className="w-full py-6 text-lg bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
       onClick={handlePayment}
       disabled={processing || (student && student.payment_status !== 'pago' && trialCount === 0)}
      >
       {processing ? 'Processando…' : (paymentMethod === 'card' ? 'Pagar com cartão (Stripe)' : 'Gerar pedido PIX')}
      </Button>
    </div>
  );
}