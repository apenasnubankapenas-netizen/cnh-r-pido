import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId, studentId } = await req.json();
    if (!paymentId) {
      return Response.json({ error: 'paymentId required' }, { status: 400 });
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'MP not configured' }, { status: 500 });
    }

    // Buscar o pagamento no banco local
    const payments = await base44.asServiceRole.entities.Payment.filter({ id: paymentId });
    if (payments.length === 0) {
      return Response.json({ approved: false, error: 'Payment not found' });
    }
    const payment = payments[0];

    // Se já está aprovado localmente, retornar sucesso imediato
    if (payment.status === 'aprovado') {
      return Response.json({ approved: true, status: 'aprovado' });
    }

    // Buscar no Mercado Pago pela referência externa (payment.id)
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${paymentId}&sort=date_created&criteria=desc&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!mpResponse.ok) {
      const err = await mpResponse.json();
      return Response.json({ approved: false, error: err.message || 'MP search failed' });
    }

    const mpData = await mpResponse.json();
    const results = mpData?.results || [];

    // Verificar se algum pagamento foi aprovado
    const approvedPayment = results.find(p => p.status === 'approved');

    if (approvedPayment) {
      // Atualizar pagamento local para aprovado
      await base44.asServiceRole.entities.Payment.update(paymentId, {
        status: 'aprovado',
        transaction_id: String(approvedPayment.id),
      });

      // Atualizar student para pago se houver studentId
      const targetStudentId = studentId || payment.student_id;
      if (targetStudentId) {
        const students = await base44.asServiceRole.entities.Student.filter({ id: targetStudentId });
        if (students.length > 0) {
          const student = students[0];
          await base44.asServiceRole.entities.Student.update(targetStudentId, {
            payment_status: 'pago',
            total_paid: (student.total_paid || 0) + payment.amount,
          });

          // Processar cashback do vendedor se dados pendentes existirem
          // (feito pelo frontend após confirmação)
        }
      }

      return Response.json({ approved: true, status: 'aprovado', mp_payment_id: approvedPayment.id });
    }

    // Verificar status pendente
    const pendingPayment = results.find(p => p.status === 'pending' || p.status === 'in_process');
    if (pendingPayment) {
      return Response.json({ approved: false, status: 'pendente', mp_status: pendingPayment.status });
    }

    return Response.json({ approved: false, status: payment.status, mp_results: results.length });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});