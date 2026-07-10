import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const DPO_API_URL = Deno.env.get('DPO_API_URL') ?? 'https://secure.3gdirectpay.com/API/v6/';
const DPO_COMPANY_TOKEN = Deno.env.get('DPO_COMPANY_TOKEN') ?? '';

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pickTag = (xml: string, tag: string): string | null => {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
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

    const { token } = await req.json();
    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${xmlEscape(DPO_COMPANY_TOKEN)}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${xmlEscape(token)}</TransactionToken>
</API3G>`;

    const resp = await fetch(DPO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml,
    });
    const text = await resp.text();

    const result = pickTag(text, 'Result');
    const explanation = pickTag(text, 'ResultExplanation');
    // 000 = paid, 900 = declined, 901 = pending, 904 = cancelled

    // Find the pending transaction
    const { data: txn } = await supabase
      .from('transactions')
      .select('id, amount, status, user_id, metadata')
      .eq('user_id', user.id)
      .eq('payment_method_type', 'dpo')
      .contains('metadata', { dpo_token: token })
      .maybeSingle();

    if (!txn) {
      return new Response(
        JSON.stringify({ result, explanation, credited: false, error: 'Transaction not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (result === '000' && txn.status !== 'completed') {
      // Credit wallet atomically via RPC
      const { error: creditErr } = await supabase.rpc('add_wallet_funds', {
        p_user_id: user.id,
        p_amount: Number(txn.amount),
        p_payment_method_id: null,
      });
      if (creditErr) {
        console.error('wallet credit failed', creditErr);
        return new Response(
          JSON.stringify({ result, explanation, credited: false, error: creditErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      await supabase
        .from('transactions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', txn.id);
      return new Response(
        JSON.stringify({ result, explanation, credited: true, amount: Number(txn.amount) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (result && result !== '000' && result !== '901' && txn.status === 'pending') {
      await supabase.from('transactions').update({ status: 'failed' }).eq('id', txn.id);
    }

    return new Response(
      JSON.stringify({ result, explanation, credited: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('dpo-verify-token error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
