import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.25.0';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') || '', { apiVersion: '2023-10-16' });

  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') || '';
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Only now initialize Base44 client (after verifying Stripe signature)
    const base44 = createClientFromRequest(req);

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