import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function StudentPayments() {
  const [payments, setPayments] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const user = await base44.auth.me();
      const students = await base44.entities.Student.filter({ user_email: user.email });
      
      if (students.length > 0) {
        setStudent(students[0]);
        const studentPayments = await base44.entities.Payment.filter({ student_id: students[0].id });
        setPayments(studentPayments.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
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
          <CardTitle className="text-[#fbbf24] flex items-center gap-2">
            <DollarSign size={24} />
            Meus Pagamentos
          </CardTitle>
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
                               payment.method.toUpperCase()}
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
    </div>
  );
}