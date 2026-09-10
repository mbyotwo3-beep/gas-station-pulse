import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageSeo } from '@/lib/seo';

export default function Terms() {
  usePageSeo({
    title: 'Terms of Service | Rides, Food & Delivery',
    description:
      'The terms that govern your use of our ride-hailing, food delivery, package and errand services in Lusaka.',
    path: '/terms',
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().getFullYear()}</p>

      <section className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <div>
          <h2 className="text-xl font-semibold">1. About these terms</h2>
          <p>
            By creating an account or using the app you agree to these terms. If you do not agree,
            please do not use the service.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">2. The service</h2>
          <p>
            We connect passengers, customers and merchants with independent drivers and couriers for
            rides, food delivery, package delivery and errands. We are a technology platform; the
            transport or errand itself is performed by the independent driver or courier.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">3. Your account</h2>
          <p>
            You must be at least 18 years old, give accurate information and keep your login details
            private. You are responsible for activity on your account.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">4. Drivers and couriers</h2>
          <p>
            Drivers and couriers must submit identity, licence, vehicle and police clearance
            documents and be approved before accepting work. Approval may be withdrawn or suspended
            at any time if documents expire or a serious complaint is confirmed.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">5. Prices, payments and commission</h2>
          <p>
            Prices are shown before you confirm. Payment is taken through the in-app wallet or an
            approved payment provider. A platform commission of 6% is deducted from each completed
            job; the remainder is paid to the driver or courier.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">6. Cancellations and refunds</h2>
          <p>
            You may cancel before a job starts. Late or repeated cancellations may attract a fee or
            affect your account. Refunds for problems are handled case by case after review of a
            report submitted in the app.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">7. Acceptable use</h2>
          <p>
            Do not use the service for anything illegal, unsafe or abusive, and do not attempt to
            interfere with the app or other users' accounts.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">8. Liability</h2>
          <p>
            We provide the platform as it is and are not liable for the conduct of independent
            drivers, couriers or merchants beyond what the law requires of us.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">9. Changes and contact</h2>
          <p>
            We may update these terms and will show the new date above. Questions? See the{' '}
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
