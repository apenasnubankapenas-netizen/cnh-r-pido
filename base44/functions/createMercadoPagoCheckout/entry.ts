import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, purchaseType, purchaseQty, studentId, paymentId, installments } = await req.json();
    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Mercado Pago not configured' }, { status: 500 });
    }

    let student;
    let payment;

    if (studentId && paymentId) {
      const students = await base44.asServiceRole.entities.Student.filter({ id: studentId });
      if (students.length === 0) {
        return Response.json({ error: 'Student not found' }, { status: 404 });
      }
      student = students[0];

      const payments = await base44.asServiceRole.entities.Payment.filter({ id: paymentId });
      if (payments.length === 0) {
        return Response.json({ error: 'Payment not found' }, { status: 404 });
      }
      payment = payments[0];
    } else {
      const students = await base44.entities.Student.filter({ user_email: user.email });
      if (students.length === 0) {
        return Response.json({ error: 'Student not found' }, { status: 404 });
      }
      student = students[0];

      payment = await base44.entities.Payment.create({
        student_id: student.id,
        student_name: student.full_name,
        amount: amount,
        method: 'cartao',
        installments: installments || 1,
        description: purchaseType ? `MP - ${purchaseType} x${purchaseQty || 1}` : `MP - Categoria ${student.category}`,
        status: 'pendente'
      });
    }

    const origin = req.headers.get('origin') || 'https://cnhparatodos.base44.app';
    const successUrl = `${origin}/Home?checkout=success&payment_id=${payment.id}`;
    const failureUrl = `${origin}/StudentPayments?payment=failed`;
    const pendingUrl = `${origin}/StudentPayments?payment=pending`;

    const preferenceBody = {
      items: [
        {
          title: purchaseType ? `Aulas de direção - ${purchaseType}` : `CNH Para Todos - Categoria ${student.category}`,
          description: purchaseQty ? `Quantidade: ${purchaseQty}` : 'Matrícula e aulas',
          quantity: 1,
          unit_price: Number(amount),
          currency_id: 'BRL',
        }
      ],
      payer: {
        name: student.full_name,
        email: user.email,
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: 'approved',
      external_reference: payment.id,
      metadata: {
        payment_id: payment.id,
        student_id: student.id,
        user_email: user.email,
        purchase_type: purchaseType || '',
        purchase_qty: String(purchaseQty || 1),
      }
    };

    // Adicionar parcelamento se solicitado
    if (installments && installments > 1) {
      preferenceBody.payment_methods = {
        installments: installments,
        default_installments: installments,
      };
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!response.ok) {
      const err = await response.json();
      return Response.json({ error: err.message || 'MP error', details: err }, { status: 500 });
    }

    const preference = await response.json();

    return Response.json({
      url: preference.init_point,
      id: preference.id,
      payment_id: payment.id,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});