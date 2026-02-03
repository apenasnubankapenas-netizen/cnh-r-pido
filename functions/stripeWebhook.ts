import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.25.0';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') || '', { apiVersion: '2023-10-16' });

  try {
    // Initialize Base44 client BEFORE validating signature (platform requirement)
    const base44 = createClientFromRequest(req);

    const body = await req.text();
    const sig = req.headers.get('stripe-signature') || '';
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const paymentId = session.metadata?.payment_id;
        if (paymentId) {
          try {
            await base44.asServiceRole.entities.Payment.update(paymentId, {
              status: 'aprovado',
              transaction_id: String(session.payment_intent || ''),
              method: 'cartao',
              description: (session.metadata?.purchase_type ? `Stripe - ${session.metadata.purchase_type} x${session.metadata.purchase_qty}` : 'Stripe'),
            });
          } catch (e) {
            // swallow and continue to ack webhook
          }
        }
        // Update student status and package if provided
        try {
          const studentId = session.metadata?.student_id;
          if (studentId) {
            const arr = await base44.asServiceRole.entities.Student.filter({ id: studentId });
            if (arr.length > 0) {
              const st = arr[0];
              const updates = { 
                payment_status: 'pago',
                total_paid: (st.total_paid || 0) + (session.amount_total / 100)
              };
              const qty = parseInt(session.metadata?.purchase_qty || '0');
              const ptype = session.metadata?.purchase_type || '';
              if (qty > 0 && (ptype === 'carro' || ptype === 'moto')) {
                const field = ptype === 'carro' ? 'total_car_lessons' : 'total_moto_lessons';
                updates[field] = (st[field] || 0) + qty;
              }
              await base44.asServiceRole.entities.Student.update(st.id, updates);
              
              // Adicionar cashback ao vendedor se for primeira compra
              if (st.payment_status !== 'pago' && st.ref_seller_id) {
                try {
                  const settingsData = await base44.asServiceRole.entities.AppSettings.list();
                  const appSettings = settingsData[0];
                  if (appSettings?.seller_cashback_amount) {
                    const seller = await base44.asServiceRole.entities.Seller.get(st.ref_seller_id);
                    await base44.asServiceRole.entities.Seller.update(st.ref_seller_id, {
                      cashback_balance: (seller.cashback_balance || 0) + appSettings.seller_cashback_amount,
                      total_referrals: (seller.total_referrals || 0) + 1
                    });
                  }
                } catch (_) {}
              }
            }
          }
        } catch (_) {}
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const paymentId = pi.metadata?.payment_id;
        if (paymentId) {
          try {
            await base44.asServiceRole.entities.Payment.update(paymentId, { status: 'recusado', transaction_id: String(pi.id) });
          } catch (_) {}
        }
        break;
      }
      default:
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});