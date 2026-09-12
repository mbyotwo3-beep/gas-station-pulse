import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEMO_DOMAIN = 'demo.fuelfinder.app';
const DEMO_PASSWORD = 'DemoDriver!2026';

const DEMO_DRIVERS = [
  {
    email: `demo.driver1@${DEMO_DOMAIN}`,
    name: 'Demo — Chanda Mwale',
    vehicle_type: 'car',
    vehicle_make: 'Toyota',
    vehicle_model: 'Corolla',
    license_plate: 'DEMO 1001',
    status: 'approved',
    rating: 4.8,
    jobs: 3,
  },
  {
    email: `demo.driver2@${DEMO_DOMAIN}`,
    name: 'Demo — Naomi Phiri',
    vehicle_type: 'motorcycle',
    vehicle_make: 'Honda',
    vehicle_model: 'CB125',
    license_plate: 'DEMO 1002',
    status: 'approved',
    rating: 4.5,
    jobs: 2,
  },
  {
    email: `demo.driver3@${DEMO_DOMAIN}`,
    name: 'Demo — Joseph Banda',
    vehicle_type: 'car',
    vehicle_make: 'Mazda',
    vehicle_model: 'Demio',
    license_plate: 'DEMO 1003',
    status: 'pending',
    rating: 0,
    jobs: 0,
  },
];

const LUSAKA = { lat: -15.3875, lng: 28.3228 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

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

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: 'Not signed in' }, 401);
    const callerId = userData.user.id;

    const admin = createClient(url, serviceKey);
    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: callerId,
      _role: 'admin',
    });
    if (!isAdmin) return json({ error: 'Admins only' }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body?.action === 'clear' ? 'clear' : 'seed';

    // Find all existing demo driver accounts.
    const { data: demoProfiles } = await admin
      .from('driver_profiles')
      .select('user_id')
      .eq('is_demo', true);
    const existingIds = (demoProfiles ?? []).map((d) => d.user_id as string);

    if (action === 'clear') {
      if (existingIds.length) {
        await admin.from('driver_earnings').delete().in('driver_id', existingIds);
        await admin.from('rides').delete().in('driver_id', existingIds);
        await admin.from('driver_profiles').delete().in('user_id', existingIds);
        for (const id of existingIds) {
          await admin.auth.admin.deleteUser(id);
        }
      }
      return json({ ok: true, removed: existingIds.length });
    }

    if (existingIds.length) {
      return json({ ok: true, created: 0, message: 'Demo data already present' });
    }

    let created = 0;
    for (const d of DEMO_DRIVERS) {
      const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
        email: d.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: d.name, primary_role: 'driver' },
      });
      if (createError || !createdUser.user) {
        console.error('demo user create failed', createError?.message);
        continue;
      }
      const driverId = createdUser.user.id;
      created++;

      await admin.from('user_roles').upsert(
        { user_id: driverId, role: 'driver' },
        { onConflict: 'user_id,role', ignoreDuplicates: true },
      );

      await admin.from('driver_profiles').insert({
        user_id: driverId,
        vehicle_type: d.vehicle_type,
        vehicle_make: d.vehicle_make,
        vehicle_model: d.vehicle_model,
        license_plate: d.license_plate,
        is_active: false,
        is_demo: true,
        rating: d.rating,
        total_rides: d.jobs,
        verification_status: d.status,
        verified_at: d.status === 'approved' ? new Date().toISOString() : null,
        current_location: {
          lat: LUSAKA.lat + (Math.random() - 0.5) * 0.05,
          lng: LUSAKA.lng + (Math.random() - 0.5) * 0.05,
        },
      });

      for (let i = 0; i < d.jobs; i++) {
        const fare = 45 + Math.round(Math.random() * 120);
        const completedAt = new Date(Date.now() - (i + 1) * 86_400_000).toISOString();

        const { data: ride } = await admin
          .from('rides')
          .insert({
            driver_id: driverId,
            passenger_id: callerId,
            pickup_location: { lat: LUSAKA.lat, lng: LUSAKA.lng, address: 'Cairo Road, Lusaka' },
            destination_location: {
              lat: LUSAKA.lat + 0.03,
              lng: LUSAKA.lng + 0.04,
              address: 'Manda Hill, Lusaka',
            },
            status: 'completed',
            fare_amount: fare,
            payment_status: 'paid',
            completed_at: completedAt,
          })
          .select('id')
          .single();

        const commissionRate = 0.06;
        await admin.from('driver_earnings').insert({
          driver_id: driverId,
          ride_id: ride?.id ?? null,
          gross_amount: fare,
          commission_rate: commissionRate,
          commission_amount: Number((fare * commissionRate).toFixed(2)),
          amount: Number((fare * (1 - commissionRate)).toFixed(2)),
          type: 'ride',
          status: i === 0 ? 'pending' : 'paid',
          created_at: completedAt,
        });
      }
    }

    return json({ ok: true, created, password: DEMO_PASSWORD });
  } catch (e) {
    console.error('seed-demo-data error', e);
    return json({ error: 'Could not update demo data' }, 500);
  }
});
