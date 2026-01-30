import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock,
  Filter,
  CreditCard,
  QrCode,
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const paymentsData = await base44.entities.Payment.list();
      setPayments(paymentsData);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (payment, newStatus) => {
    try {
      await base44.entities.Payment.update(payment.id, { status: newStatus });
      
      if (newStatus === 'aprovado') {
        // Atualizar status de pagamento do aluno
        const students = await base44.entities.Student.filter({ id: payment.student_id });
        if (students.length > 0) {
          await base44.entities.Student.update(students[0].id, { 
            payment_status: 'pago',
            total_paid: (students[0].total_paid || 0) + payment.amount
          });
        }
      }
      
      loadData();
    } catch (e) {
      console.log(e);
    }
  };

  const filteredPayments = payments.filter(p => 
    filterStatus === 'all' || p.status === filterStatus
  ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const totalApproved = payments.filter(p => p.status === 'aprovado').reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pendente').reduce((acc, p) => acc + (p.amount || 0), 0);

  const getStatusBadge = (status) => {
    const configs = {
      pendente: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', icon: Clock },
      aprovado: { color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: CheckCircle },
      recusado: { color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: XCircle },
    };
    const config = configs[status] || configs.pendente;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon size={12} />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="text-[#fbbf24]" />
          Pagamentos
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9ca3af] text-xs">Total Aprovado</p>
                <p className="text-2xl font-bold text-green-400">R$ {totalApproved.toFixed(2)}</p>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9ca3af] text-xs">Pendente</p>
                <p className="text-2xl font-bold text-yellow-400">R$ {totalPending.toFixed(2)}</p>
              </div>
              <Clock className="text-yellow-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9ca3af] text-xs">Total de Pagamentos</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <DollarSign className="text-[#3b82f6]" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter size={18} className="text-[#9ca3af]" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-[#111827] border-[#374151] w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-[#374151]">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="recusado">Recusado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pagamentos */}
      <div className="space-y-3">
        {filteredPayments.map((payment) => (
          <Card key={payment.id} className="bg-[#1a2332] border-[#374151]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#111827] flex items-center justify-center">
                    {payment.method === 'pix' ? (
                      <QrCode className="text-[#fbbf24]" />
                    ) : (
                      <CreditCard className="text-[#3b82f6]" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">{payment.student_name}</p>
                    <p className="text-sm text-[#9ca3af]">
                      {payment.method === 'pix' ? 'PIX' : `Cartão ${payment.installments}x`} • {payment.description}
                    </p>
                    <p className="text-xs text-[#9ca3af]">
                      {new Date(payment.created_date).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-[#fbbf24]">R$ {payment.amount?.toFixed(2)}</p>
                  {getStatusBadge(payment.status)}
                  
                  {payment.status === 'pendente' && (
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusChange(payment, 'aprovado')}
                      >
                        <CheckCircle size={14} />
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleStatusChange(payment, 'recusado')}
                      >
                        <XCircle size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-8 text-center">
            <DollarSign className="mx-auto text-[#9ca3af] mb-4" size={48} />
            <p className="text-[#9ca3af]">Nenhum pagamento encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}