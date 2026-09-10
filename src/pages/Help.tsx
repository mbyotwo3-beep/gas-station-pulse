import { Link } from 'react-router-dom';
import { ArrowLeft, LifeBuoy, Mail, ShieldAlert, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { usePageSeo } from '@/lib/seo';

const SUPPORT_EMAIL = 'support@example.com';

const FAQS = [
  {
    q: 'How do I request a ride?',
    a: 'Open the app, tap "Where to?", pick your destination and confirm. We match you with the nearest approved driver and show their photo, name, vehicle and plate before pickup.',
  },
  {
    q: 'What is the 4-digit code for?',
    a: 'It confirms you are getting into the right car. Give the code to the driver at pickup; the trip cannot start without it.',
  },
  {
    q: 'How do I pay?',
    a: 'Top up your wallet in the app and pay from it, or use one of your saved payment methods at checkout.',
  },
  {
    q: 'Can I cancel an order or ride?',
    a: 'Yes, before it starts. Open the active order or ride and tap Cancel, then choose a reason. Frequent cancellations may affect your account.',
  },
  {
    q: 'Something went wrong with my order.',
    a: 'Tap "Report a problem" on the order and describe what happened. Our support team reviews every report.',
  },
  {
    q: 'How do I become a driver?',
    a: 'Sign up as a driver and upload your identity document, driving licence, vehicle registration and police clearance. You can accept jobs once our team approves you.',
  },
];

export default function Help() {
  usePageSeo({
    title: 'Help & Support | Rides, Food & Delivery',
    description:
      'Answers to common questions about rides, food delivery, payments and driver sign-up, plus how to reach support.',
    path: '/help',
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LifeBuoy className="h-7 w-7" />
          Help &amp; support
        </h1>
        <p className="text-muted-foreground mt-2">
          Find quick answers below, or get in touch and we will come back to you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 underline">
            <Mail className="h-4 w-4" />
            {SUPPORT_EMAIL}
          </a>
          <p className="flex items-center gap-3 text-muted-foreground">
            <Phone className="h-4 w-4" />
            Support hours: 07:00 – 21:00, every day
          </p>
          <p className="flex items-start gap-3 text-muted-foreground">
            <ShieldAlert className="h-4 w-4 mt-0.5" />
            In an emergency during a trip, use the safety button in the ride screen or call local
            emergency services first.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Common questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        See our{' '}
        <Link to="/terms" className="underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}
