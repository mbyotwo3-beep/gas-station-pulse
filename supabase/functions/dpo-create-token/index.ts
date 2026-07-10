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
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const amount = Number(body.amount);
    const currency = String(body.currency ?? 'USD').toUpperCase();
    const description = String(body.description ?? 'Wallet top-up').slice(0, 100);
    const redirectUrl = String(body.redirectUrl ?? '');
    const backUrl = String(body.backUrl ?? redirectUrl);
    const email = user.email ?? '';

    if (!isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DPO expects local datetime yyyy/MM/dd HH:mm
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dpoDate = `${now.getUTCFullYear()}/${pad(now.getUTCMonth() + 1)}/${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;

    const ref = `WTU-${user.id.slice(0, 8)}-${Date.now()}`;

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
      console.error('DPO createToken failed', { status: resp.status, result, explanation, text });
      return new Response(
        JSON.stringify({ error: 'DPO createToken failed', result, explanation, raw: text }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Record pending transaction so we can reconcile on return
    await supabase.from('transactions').insert({
      user_id: user.id,
      transaction_type: 'top_up',
      service_type: 'ride',
      amount,
      currency,
      status: 'pending',
      payment_method_type: 'dpo',
      description,
      metadata: { dpo_token: token, company_ref: ref },
    });

    return new Response(
      JSON.stringify({ token, paymentUrl: `${DPO_PAYMENT_URL}${token}`, companyRef: ref }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('dpo-create-token error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
