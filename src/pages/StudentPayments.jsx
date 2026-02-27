import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, CheckCircle, Clock, XCircle, CreditCard, ExternalLink } from 'lucide-react';

const MP_PUBLIC_KEY = 'APP_USR-f2093e43-9ebd-40ac-b772-0a7ce13bc9a4';

export default function StudentPayments() {
  const [payments, setPayments] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDescription, setPayDescription] = useState('Pagamento CNH Para Todos');
  const [payInstallments, setPayInstallments] = useState(1);

  useEffect(() => {
    loadPayments();
    // Verificar retorno do Mercado Pago
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    if (status === 'approved') {
      alert('✅ Pagamento aprovado! Seu histórico será atualizado em breve.');
    } else if (status === 'failure') {
      alert('❌ Pagamento não aprovado. Tente novamente.');
    } else if (status === 'pending') {
      alert('⏳ Pagamento pendente. Aguarde a confirmação.');
    }
  }, []);

  const loadPayments = async () => {
    try {
      const user = await base44.auth.me();
      
      const savedStudent = localStorage.getItem('admin_view_student');
      let studentToLoad = null;

      if (savedStudent && user.role === 'admin') {
        studentToLoad = JSON.parse(savedStudent);
      } else {
        const students = await base44.entities.Student.filter({ user_email: user.email });
        if (students.length > 0) {
          studentToLoad = students[0];
        }
      }
      
      if (studentToLoad) {
        setStudent(studentToLoad);
        const studentPayments = await base44.entities.Payment.filter({ student_id: studentToLoad.id });
        setPayments(studentPayments.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = async () => {
    if (!payAmount || isNaN(payAmount) || Number(payAmount) <= 0) {
      alert('Digite um valor válido para pagamento.');
      return;
    }
    setPayLoading(true);
    try {
      const res = await base44.functions.invoke('createMercadoPagoCheckout', {
        amount: Number(payAmount),
        description: payDescription,
        student_id: student?.id,
        student_name: student?.full_name,
        installments: Number(payInstallments)
      });
      const { checkout_url } = res.data;
      if (checkout_url) {
        window.open(checkout_url, '_blank');
        setShowPayModal(false);
      }
    } catch (e) {
      alert('Erro ao gerar link de pagamento: ' + e.message);
    } finally {
      setPayLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'aprovado': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Aprovado' },
      'pendente': { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Pendente' },
      'recusado': { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Recusado' }
    };
    return configs[status] || configs['pendente'];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#fbbf24] animate-pulse">Carregando pagamentos...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-[#fbbf24] flex items-center gap-2">
              <DollarSign size={24} />
              Meus Pagamentos
            </CardTitle>
            {student && (
              <Button
                onClick={() => setShowPayModal(true)}
                className="bg-[#009ee3] hover:bg-[#007bbf] text-white font-bold gap-2"
              >
                <CreditCard size={18} />
                Pagar com Mercado Pago
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Resumo Financeiro */}
          {student && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="text-[#9ca3af] text-sm mb-1">Total Pago</div>
                <div className="text-2xl font-bold text-[#10b981]">
                  R$ {(student.total_paid || 0).toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="text-[#9ca3af] text-sm mb-1">Status</div>
                <div className={`text-lg font-bold ${
                  student.payment_status === 'pago' ? 'text-[#10b981]' : 
                  student.payment_status === 'parcial' ? 'text-[#fbbf24]' : 'text-[#ef4444]'
                }`}>
                  {student.payment_status === 'pago' ? 'Pago' : 
                   student.payment_status === 'parcial' ? 'Parcial' : 'Pendente'}
                </div>
              </div>
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="text-[#9ca3af] text-sm mb-1">Pagamentos</div>
                <div className="text-2xl font-bold text-[#3b82f6]">
                  {payments.length}
                </div>
              </div>
            </div>
          )}

          {/* Lista de Pagamentos */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-3">Histórico de Pagamentos</h3>
            
            {payments.length === 0 ? (
              <div className="text-center py-8 text-[#9ca3af]">
                Nenhum pagamento registrado ainda.
              </div>
            ) : (
              payments.map((payment) => {
                const statusConfig = getStatusConfig(payment.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div 
                    key={payment.id}
                    className="p-4 bg-[#111827] rounded-lg border border-[#374151] hover:border-[#3b82f6] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                            <StatusIcon className={statusConfig.color} size={20} />
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {payment.description || 'Pagamento'}
                            </div>
                            <div className="text-xs text-[#9ca3af]">
                              {formatDate(payment.created_date)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                          <div>
                            <span className="text-[#9ca3af]">Método: </span>
                            <span className="text-white font-medium">
                              {payment.method === 'pix' ? 'PIX' : 
                               payment.method === 'cartao' ? 'Cartão' : 
                               payment.method?.toUpperCase()}
                            </span>
                          </div>
                          {payment.installments > 1 && (
                            <div>
                              <span className="text-[#9ca3af]">Parcelas: </span>
                              <span className="text-white font-medium">{payment.installments}x</span>
                            </div>
                          )}
                          {payment.transaction_id && (
                            <div className="col-span-2">
                              <span className="text-[#9ca3af]">ID: </span>
                              <span className="text-white font-mono text-xs">
                                {payment.transaction_id.substring(0, 20)}...
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#fbbf24]">
                          R$ {payment.amount.toFixed(2)}
                        </div>
                        <div className={`text-xs font-semibold mt-1 ${statusConfig.color}`}>
                          {statusConfig.label}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Pagamento Mercado Pago */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2332] border-2 border-[#009ee3] rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-[#374151] bg-gradient-to-r from-[#009ee3] to-[#007bbf] rounded-t-xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard size={22} />
                Pagar com Mercado Pago
              </h2>
              <p className="text-sm text-white/80 mt-1">PIX, Cartão de Crédito/Débito, Boleto</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-[#9ca3af] mb-1 block">Valor (R$)</label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Ex: 500.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="bg-[#111827] border-[#374151] text-white text-lg"
                />
              </div>
              <div>
                <label className="text-sm text-[#9ca3af] mb-1 block">Descrição</label>
                <Input
                  placeholder="Descrição do pagamento"
                  value={payDescription}
                  onChange={(e) => setPayDescription(e.target.value)}
                  className="bg-[#111827] border-[#374151] text-white"
                />
              </div>
              <div>
                <label className="text-sm text-[#9ca3af] mb-1 block">Parcelas (cartão de crédito)</label>
                <select
                  value={payInstallments}
                  onChange={(e) => setPayInstallments(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] text-white rounded-md px-3 py-2 text-sm"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n}x {n === 1 ? '(à vista)' : 'sem juros'}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-[#374151] text-white hover:bg-[#161b22]"
                  onClick={() => setShowPayModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-[#009ee3] hover:bg-[#007bbf] text-white font-bold gap-2"
                  onClick={handlePagar}
                  disabled={payLoading}
                >
                  {payLoading ? 'Gerando...' : (
                    <>
                      <ExternalLink size={16} />
                      Ir para Pagamento
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#9ca3af] text-center">
                Você será redirecionado para o ambiente seguro do Mercado Pago
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}