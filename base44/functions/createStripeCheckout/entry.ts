import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.25.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, purchaseType, purchaseQty, studentId, paymentId } = await req.json();
    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    let student;
    let payment;

    // Se studentId e paymentId foram fornecidos (novo cadastro), usar eles
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
      // Pagamento adicional de aluno existente
      const students = await base44.entities.Student.filter({ user_email: user.email });
      if (students.length === 0) {
        return Response.json({ error: 'Student not found' }, { status: 404 });
      }
      student = students[0];

      // Create a pending payment record
      payment = await base44.entities.Payment.create({
        student_id: student.id,
        student_name: student.full_name,
        amount: amount,
        method: 'cartao',
        installments: 1,
        description: purchaseType ? `Stripe - ${purchaseType} x${purchaseQty || 1}` : `Stripe - Categoria ${student.category}`,
        status: 'pendente'
      });
    }

    const stripeSecret = Deno.env.get('STRIPE_API_KEY');
    if (!stripeSecret) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

    const origin = new URL(req.url).origin;
    const successUrl = `${origin}/Home?checkout=success`;
    const cancelUrl = `${origin}/Payment?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: purchaseType ? `Aulas de direção (${purchaseType})` : 'Aulas de direção',
              description: purchaseQty ? `Quantidade: ${purchaseQty}` : undefined,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        payment_id: payment.id,
        student_id: student.id,
        user_email: user.email,
        purchase_type: purchaseType || '',
        purchase_qty: String(purchaseQty || 1),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return Response.json({ url: session.url, id: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});