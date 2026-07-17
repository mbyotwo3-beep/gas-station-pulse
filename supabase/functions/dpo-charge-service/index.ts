// Create a DPO hosted payment token for a ride (or future order) charge.
// On successful return, dpo-verify-token will call settle_service_payment.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const DPO_API_URL = Deno.env.get('DPO_API_URL') ?? 'https://secure.3gdirectpay.com/API/v6/';
const DPO_PAYMENT_URL = Deno.env.get('DPO_PAYMENT_URL') ?? 'https://secure.3gdirectpay.com/payv3.php?ID=';
const DPO_COMPANY_TOKEN = Deno.env.get('DPO_COMPANY_TOKEN') ?? '';
const DPO_SERVICE_TYPE = Deno.env.get('DPO_SERVICE_TYPE') ?? '';

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pickTag = (xml: string, tag: string): string | null => {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!DPO_COMPANY_TOKEN || !DPO_SERVICE_TYPE) {
      return new Response(JSON.stringify({ error: 'DPO not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: userData } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const rideId = body.rideId ? String(body.rideId) : null;
    const currency = String(body.currency ?? 'USD').toUpperCase();
    const redirectUrl = String(body.redirectUrl ?? '');
    const backUrl = String(body.backUrl ?? redirectUrl);

    if (!rideId) {
      return new Response(JSON.stringify({ error: 'rideId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up ride and validate caller is the passenger
    const { data: ride, error: rideErr } = await supabase
      .from('rides')
      .select('id, passenger_id, final_fare, estimated_fare, payment_status')
      .eq('id', rideId)
      .maybeSingle();
    if (rideErr || !ride) {
      return new Response(JSON.stringify({ error: 'Ride not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (ride.passenger_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (ride.payment_status === 'completed') {
      return new Response(JSON.stringify({ error: 'Ride already paid' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amount = Number(ride.final_fare ?? ride.estimated_fare ?? 0);
    if (!isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid ride amount' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dpoDate = `${now.getUTCFullYear()}/${pad(now.getUTCMonth() + 1)}/${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;
    const ref = `RIDE-${rideId.slice(0, 8)}-${Date.now()}`;
    const description = `Ride payment ${rideId.slice(0, 8)}`;
    const email = user.email ?? '';

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${xmlEscape(DPO_COMPANY_TOKEN)}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${amount.toFixed(2)}</PaymentAmount>
    <PaymentCurrency>${xmlEscape(currency)}</PaymentCurrency>
    <CompanyRef>${xmlEscape(ref)}</CompanyRef>
    <RedirectURL>${xmlEscape(redirectUrl)}</RedirectURL>
    <BackURL>${xmlEscape(backUrl)}</BackURL>
    <customerEmail>${xmlEscape(email)}</customerEmail>
    <TransactionSource>FuelFinder</TransactionSource>
    <PTL>5</PTL>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${xmlEscape(DPO_SERVICE_TYPE)}</ServiceType>
      <ServiceDescription>${xmlEscape(description)}</ServiceDescription>
      <ServiceDate>${dpoDate}</ServiceDate>
    </Service>
  </Services>
</API3G>`;

    const resp = await fetch(DPO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml,
    });
    const text = await resp.text();
    const result = pickTag(text, 'Result');
    const explanation = pickTag(text, 'ResultExplanation');
    const token = pickTag(text, 'TransToken');

    if (result !== '000' || !token) {
      console.error('DPO createToken failed', { status: resp.status, result, explanation });
      return new Response(JSON.stringify({ error: 'Unable to start payment', code: 'DPO_CREATE_FAILED' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record a pending "debit" transaction tagged with ride_id so the verifier can settle it.
    await supabase.from('transactions').insert({
      user_id: user.id,
      transaction_type: 'debit',
      service_type: 'ride',
      amount,
      currency,
      status: 'pending',
      payment_method_type: 'dpo',
      description,
      metadata: { dpo_token: token, company_ref: ref, ride_id: rideId, kind: 'service_payment' },
    });

    return new Response(
      JSON.stringify({ token, paymentUrl: `${DPO_PAYMENT_URL}${token}`, amount, companyRef: ref }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('dpo-charge-service error', e);
    return new Response(JSON.stringify({ error: 'Internal error', code: 'DPO_INTERNAL' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
