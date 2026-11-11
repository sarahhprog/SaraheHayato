import { getCorsHeaders, hasAllowedOrigin, jsonResponse, requiredEnv } from "../_shared/http.ts";

type Gift = {
  id: string;
  name: string;
  price: string | number;
  status: "available" | "unavailable";
};

const jsonHeaders = { "Content-Type": "application/json" };

Deno.serve(async (request) => {
  let siteUrl: string;
  try {
    siteUrl = requiredEnv("SITE_URL");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "SITE_URL is not configured.");
    return new Response("Payment service is not configured.", { status: 500 });
  }

  const corsHeaders = getCorsHeaders(siteUrl);
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405, corsHeaders);
  }
  if (!hasAllowedOrigin(request, siteUrl)) {
    return jsonResponse({ error: "Origem não permitida." }, 403, corsHeaders);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Envie os dados do presente em JSON." }, 400, corsHeaders);
  }

  const giftId = typeof payload.giftId === "string" ? payload.giftId.trim() : "";
  const payerName =
    typeof payload.name === "string" ? payload.name.trim().replace(/\s+/g, " ") : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(giftId)) {
    return jsonResponse({ error: "Selecione um presente válido." }, 400, corsHeaders);
  }
  if (Array.from(payerName).length < 2 || Array.from(payerName).length > 100) {
    return jsonResponse({ error: "O nome deve ter de 2 a 100 caracteres." }, 400, corsHeaders);
  }
  if (Array.from(message).length < 1 || Array.from(message).length > 1000) {
    return jsonResponse(
      { error: "A mensagem é obrigatória e deve ter até 1.000 caracteres." },
      400,
      corsHeaders,
    );
  }

  let supabaseUrl: string;
  let serviceKey: string;
  let accessToken: string;
  let webhookUrl: string;
  const testMode = Deno.env.get("MP_TEST_MODE") !== "false";
  try {
    supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/+$/, "");
    serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    accessToken = requiredEnv("MP_ACCESS_TOKEN");
    webhookUrl = requiredEnv("MP_WEBHOOK_URL");
    if (new URL(siteUrl).protocol !== "https:" || new URL(webhookUrl).protocol !== "https:") {
      throw new Error("SITE_URL and MP_WEBHOOK_URL must use HTTPS.");
    }
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Payment service configuration is incomplete.",
    );
    return jsonResponse(
      { error: "O pagamento está temporariamente indisponível." },
      500,
      corsHeaders,
    );
  }
  if (testMode && !accessToken.startsWith("TEST-")) {
    console.error("MP_TEST_MODE requires a Mercado Pago test access token.");
    return jsonResponse(
      { error: "O pagamento está temporariamente indisponível." },
      500,
      corsHeaders,
    );
  }

  const supabaseHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  const giftResponse = await fetch(
    `${supabaseUrl}/rest/v1/gifts?id=eq.${encodeURIComponent(giftId)}&select=id,name,price,status`,
    { headers: supabaseHeaders },
  );
  if (!giftResponse.ok) {
    console.error("Could not read the selected gift.", giftResponse.status);
    return jsonResponse(
      { error: "Não foi possível verificar esse presente agora." },
      502,
      corsHeaders,
    );
  }

  const gifts = (await giftResponse.json()) as Gift[];
  const gift = gifts[0];
  if (!gift) return jsonResponse({ error: "Esse presente não foi encontrado." }, 404, corsHeaders);
  if (gift.status !== "available") {
    return jsonResponse({ error: "Esse presente não está mais disponível." }, 409, corsHeaders);
  }

  const attemptId = crypto.randomUUID();
  const amount = Number(gift.price);
  if (!Number.isFinite(amount) || amount <= 0) {
    console.error("The selected gift has an invalid stored price.");
    return jsonResponse({ error: "O valor desse presente está inválido." }, 500, corsHeaders);
  }

  const attemptResponse = await fetch(`${supabaseUrl}/rest/v1/gift_payment_attempts`, {
    method: "POST",
    headers: { ...supabaseHeaders, Prefer: "return=minimal" },
    body: JSON.stringify({
      id: attemptId,
      external_reference: attemptId,
      gift_id: gift.id,
      payer_name: payerName,
      message,
      amount,
      status: "pending",
    }),
  });
  if (!attemptResponse.ok) {
    console.error("Could not save the payment attempt.", attemptResponse.status);
    return jsonResponse(
      { error: "Não foi possível iniciar o pagamento. Tente novamente." },
      502,
      corsHeaders,
    );
  }

  const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${accessToken}`,
      "X-Idempotency-Key": attemptId,
    },
    body: JSON.stringify({
      items: [
        {
          id: gift.id,
          title: gift.name,
          quantity: 1,
          currency_id: "BRL",
          unit_price: amount,
        },
      ],
      external_reference: attemptId,
      notification_url: webhookUrl,
      back_urls: {
        success: `${siteUrl.replace(/\/+$/, "")}/pagamento/sucesso`,
        pending: `${siteUrl.replace(/\/+$/, "")}/pagamento/pendente`,
        failure: `${siteUrl.replace(/\/+$/, "")}/pagamento/falha`,
      },
      auto_return: "approved",
    }),
  });

  if (!preferenceResponse.ok) {
    const failedAttemptUpdate = await fetch(
      `${supabaseUrl}/rest/v1/gift_payment_attempts?id=eq.${encodeURIComponent(attemptId)}`,
      {
        method: "PATCH",
        headers: { ...supabaseHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ status: "preference_failed", updated_at: new Date().toISOString() }),
      },
    );
    if (!failedAttemptUpdate.ok) {
      console.error("Could not mark the failed payment attempt.", failedAttemptUpdate.status);
    }
    console.error("Mercado Pago rejected the checkout preference.", preferenceResponse.status);
    return jsonResponse(
      { error: "Não foi possível criar o pagamento. Tente novamente." },
      502,
      corsHeaders,
    );
  }

  let preference: Record<string, unknown>;
  try {
    preference = await preferenceResponse.json();
  } catch {
    console.error("Mercado Pago returned an invalid preference response.");
    return jsonResponse(
      { error: "O Mercado Pago retornou uma resposta inválida." },
      502,
      corsHeaders,
    );
  }
  const checkoutUrl = testMode ? preference.sandbox_init_point : preference.init_point;
  if (
    typeof preference.id !== "string" ||
    typeof checkoutUrl !== "string" ||
    !checkoutUrl.startsWith("https://")
  ) {
    console.error("Mercado Pago returned no valid checkout URL.");
    return jsonResponse(
      { error: "O Mercado Pago não retornou um link de pagamento válido." },
      502,
      corsHeaders,
    );
  }

  const updateResponse = await fetch(
    `${supabaseUrl}/rest/v1/gift_payment_attempts?id=eq.${encodeURIComponent(attemptId)}`,
    {
      method: "PATCH",
      headers: { ...supabaseHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({
        mp_preference_id: preference.id,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!updateResponse.ok) {
    console.error("Could not save the Mercado Pago preference id.", updateResponse.status);
    return jsonResponse(
      { error: "Não foi possível concluir a preparação do pagamento." },
      502,
      corsHeaders,
    );
  }

  return jsonResponse({ checkoutUrl, attemptId }, 200, corsHeaders);
});
