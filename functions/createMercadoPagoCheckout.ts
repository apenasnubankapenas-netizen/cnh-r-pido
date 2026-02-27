import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, description, student_id, student_name, installments } = await req.json();

    const accessToken = Deno.env.get("MP_ACCESS_TOKEN");

    const preference = {
      items: [
        {
          title: description || "Pagamento CNH Para Todos",
          quantity: 1,
          unit_price: Number(amount),
          currency_id: "BRL"
        }
      ],
      payer: {
        email: user.email,
        name: user.full_name || student_name
      },
      payment_methods: {
        installments: installments || 10,
        excluded_payment_types: []
      },
      back_urls: {
        success: `${req.headers.get('origin') || 'https://cnhparatodos.base44.app'}/StudentPayments?status=approved&student_id=${student_id}`,
        failure: `${req.headers.get('origin') || 'https://cnhparatodos.base44.app'}/StudentPayments?status=failure&student_id=${student_id}`,
        pending: `${req.headers.get('origin') || 'https://cnhparatodos.base44.app'}/StudentPayments?status=pending&student_id=${student_id}`
      },
      auto_return: "approved",
      external_reference: `${student_id}_${Date.now()}`,
      statement_descriptor: "CNH PARA TODOS"
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${student_id}_${Date.now()}`
      },
      body: JSON.stringify(preference)
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.message || "Erro ao criar preferência MP" }, { status: 400 });
    }

    return Response.json({
      checkout_url: data.init_point,
      sandbox_url: data.sandbox_init_point,
      preference_id: data.id
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});