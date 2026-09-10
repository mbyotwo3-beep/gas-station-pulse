import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageSeo } from '@/lib/seo';

export default function Privacy() {
  usePageSeo({
    title: 'Privacy Policy | Rides, Food & Delivery',
    description:
      'How we collect, use and protect your personal information, location data and payment details.',
    path: '/privacy',
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().getFullYear()}</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold">What we collect</h2>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Account details: name, email, profile photo and the role you sign up with.</li>
            <li>Location: your device location while you are using a map, requesting or doing a job.</li>
            <li>Trip and order records: pickup and drop-off points, prices, ratings and messages.</li>
            <li>Driver documents: identity, licence, vehicle and police clearance documents.</li>
            <li>Payment records: wallet balance and transaction history. Card details are handled by our payment provider, never stored by us.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Why we use it</h2>
          <p className="mt-2">
            To match you with a nearby driver or courier, show live tracking, calculate fares, take
            payments, keep everyone safe, verify drivers, resolve reports and improve the service.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Who can see it</h2>
          <p className="mt-2">
            Only what is needed: your driver sees your pickup point and first name; you see your
            driver's name, photo, rating, vehicle and plate. Driver documents are private and can be
            opened only by the driver and our verification team. We do not sell your data.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Keeping it safe</h2>
          <p className="mt-2">
            Data is stored on secured servers with strict per-user access rules. Documents live in a
            private store that cannot be reached by other users.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Your choices</h2>
          <p className="mt-2">
            You can edit your profile, turn off location sharing in your device settings (parts of
            the app will stop working), request a copy of your data, or delete your account from
            Profile → Account. Deleting removes your profile; trip and payment records are kept only
            as long as the law requires.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-2">
            Questions about your data? Visit the{' '}
            <Link to="/help" className="underline">
              help page
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
