import { requiredEnv } from "../_shared/http.ts";

type MercadoPagoPayment = {
  id: number | string;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
  date_approved: string | null;
};

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hasValidSignature(
  secret: string,
  paymentId: string,
  requestId: string,
  signatureHeader: string,
) {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, ...valueParts] = part.trim().split("=");
      return [key, valueParts.join("=")];
    }),
  );
  const timestamp = parts.ts;
  const providedSignature = parts.v1;
  if (!timestamp || !providedSignature || !requestId) return false;

  const manifest = `id:${paymentId};request-id:${requestId};ts:${timestamp};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest)),
  );
  const expected = bytesToHex(digest);
  if (expected.length !== providedSignature.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ providedSignature.charCodeAt(index);
  }
  return mismatch === 0;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed.", { status: 405 });
  }

  let supabaseUrl: string;
  let serviceKey: string;
  let accessToken: string;
  let webhookSecret: string;
  try {
    supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/+$/, "");
    serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    accessToken = requiredEnv("MP_ACCESS_TOKEN");
    webhookSecret = requiredEnv("MP_WEBHOOK_SECRET");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Webhook configuration is incomplete.");
    return new Response("Webhook is not configured.", { status: 500 });
  }

  const url = new URL(request.url);
  let notification: Record<string, unknown> = {};
  try {
    notification = await request.json();
  } catch {
    if (!url.searchParams.get("data.id")) {
      return new Response("Invalid notification.", { status: 400 });
    }
  }

  const bodyData = notification.data;
  const bodyPaymentId =
    bodyData && typeof bodyData === "object" ? (bodyData as Record<string, unknown>).id : undefined;
  const paymentId = String(url.searchParams.get("data.id") || bodyPaymentId || "");
  const requestId = request.headers.get("x-request-id") || "";
  const signature = request.headers.get("x-signature") || "";
  if (!/^\d+$/.test(paymentId)) return new Response("Invalid payment id.", { status: 400 });

  const validSignature = await hasValidSignature(webhookSecret, paymentId, requestId, signature);
  if (!validSignature) return new Response("Invalid signature.", { status: 401 });

  // The signed notification identifies a payment; its status and amount come from Mercado Pago.
  const paymentResponse = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!paymentResponse.ok) {
    console.error("Could not verify the payment with Mercado Pago.", paymentResponse.status);
    return new Response("Could not verify payment.", { status: 502 });
  }

  const payment = (await paymentResponse.json()) as MercadoPagoPayment;
  if (String(payment.id) !== paymentId || !payment.external_reference) {
    return new Response("Payment reference is missing or invalid.", { status: 400 });
  }
  if (
    typeof payment.status !== "string" ||
    !Number.isFinite(payment.transaction_amount) ||
    typeof payment.currency_id !== "string"
  ) {
    console.error("Mercado Pago returned incomplete payment details.");
    return new Response("Payment details are incomplete.", { status: 502 });
  }
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      payment.external_reference,
    )
  ) {
    return new Response("Payment reference is invalid.", { status: 400 });
  }

  // A single database transaction applies idempotency, amount checks, and duplicate handling.
  const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/confirm_gift_payment`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_external_reference: payment.external_reference,
      p_payment_id: paymentId,
      p_payment_status: payment.status,
      p_transaction_amount: payment.transaction_amount,
      p_currency_id: payment.currency_id,
      p_payment_date: payment.date_approved || null,
    }),
  });
  if (!rpcResponse.ok) {
    console.error("Could not apply the verified payment to the database.", rpcResponse.status);
    return new Response("Could not apply payment.", { status: 502 });
  }

  return new Response("received", { status: 200 });
});
