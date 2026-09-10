import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Not signed in' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Identify the caller from their own JWT.
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: 'Not signed in' }, 401);

    const userId = userData.user.id;
    const admin = createClient(url, serviceKey);

    // Refuse while money is still held in the wallet.
    const { data: wallet } = await admin
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();
    if (wallet && Number(wallet.balance) > 0) {
      return json(
        { error: 'Please withdraw or spend your wallet balance before deleting your account.' },
        400,
      );
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('delete-account failed:', deleteError);
      return json({ error: 'Could not delete the account. Please contact support.' }, 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error('delete-account error:', err);
    return json({ error: 'Unexpected error. Please contact support.' }, 500);
  }
});
