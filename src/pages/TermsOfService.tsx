import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

const SECTIONS = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'services', title: '2. Services & Access' },
  { id: 'accounts', title: '3. User Accounts' },
  { id: 'usage', title: '4. Acceptable Use' },
  { id: 'payment', title: '5. Payment & Subscription' },
  { id: 'ip', title: '6. Intellectual Property' },
  { id: 'termination', title: '7. Termination' },
  { id: 'liability', title: '8. Limitation of Liability' },
  { id: 'changes', title: '9. Changes to Terms' },
  { id: 'contact', title: '10. Contact Information' },
];

const TermsOfService = () => {
  const [session, setSession] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('acceptance');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset
      
      for (const section of SECTIONS) {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPosition && (element.offsetTop + element.offsetHeight) > scrollPosition) {
          setActiveSection(section.id);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20">
      <Header session={session} onLogout={() => { supabase.auth.signOut(); setSession(null); }} />

      <main className="pt-32 pb-24 relative">
        <div className="container mx-auto px-6 max-w-7xl">
          
          {/* Page Header */}
          <div className="mb-20 border-b border-white/10 pb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Terms of Service</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-6 text-sm text-gray-500 font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                Effective Date: January 1, 2026
              </span>
              <span className="hidden md:inline text-gray-700">|</span>
              <span>Version 2.4.0</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 relative">
            
            {/* Sidebar Navigation (Sticky) */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-32">
                <nav className="flex flex-col space-y-1">
                  {SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "text-left px-4 py-2 text-sm transition-colors duration-200 block w-full rounded-md",
                        activeSection === section.id
                          ? "text-white font-medium bg-white/5" // Clean active state
                          : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                      )}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
                <div className="mt-10 p-6 rounded-2xl bg-[#0a0a0a] border border-white/5">
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Need clarification on these terms? Our legal team is available to assist enterprise clients.
                  </p>
                  <a href="mailto:legal@codevo.co.in" className="text-xs font-bold text-white hover:underline flex items-center gap-1">
                    Contact Legal <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
              <div className="prose prose-invert prose-p:text-gray-400 prose-headings:text-white prose-headings:font-semibold prose-a:text-white prose-li:text-gray-400 max-w-none space-y-16">
                
                {/* 1. Acceptance */}
                <section id="acceptance" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">1. Acceptance of Terms</h2>
                  <p>
                    By accessing or using the CodeVo platform, website, API, or any associated services (collectively, the "Service"), you agree to be legally bound by these Terms of Service ("Terms"). If you represent an entity, you warrant that you have the legal authority to bind that entity to these Terms.
                  </p>
                  <p>
                    If you do not agree to these Terms, you must not access or use the Service. We reserve the right to update these Terms at any time without prior notice. Continued use of the Service constitutes acceptance of the modified Terms.
                  </p>
                </section>

                {/* 2. Services */}
                <section id="services" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">2. Services & Access</h2>
                  <p>
                    CodeVo provides a cloud-based development environment, coding assessment tools, and educational resources. We strive to maintain 99.9% uptime but do not guarantee uninterrupted access.
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mt-4">
                    <li><strong>Availability:</strong> We may modify, suspend, or discontinue any part of the Service at any time.</li>
                    <li><strong>Beta Features:</strong> Certain features marked as "Beta" or "Experimental" are provided "as-is" and may contain bugs or errors.</li>
                    <li><strong>Restrictions:</strong> Access is granted solely for your internal business or personal educational purposes.</li>
                  </ul>
                </section>

                {/* 3. Accounts */}
                <section id="accounts" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">3. User Accounts</h2>
                  <p>
                    You are responsible for maintaining the security of your account credentials. CodeVo is not liable for any loss or damage arising from your failure to protect your login information.
                  </p>
                  <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-lg mt-6">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Account Requirements</h4>
                    <p className="text-sm mb-0">
                      You must be at least 13 years of age to use the Service. Accounts registered by "bots" or automated methods are not permitted and will be terminated immediately.
                    </p>
                  </div>
                </section>

                {/* 4. Acceptable Use */}
                <section id="usage" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">4. Acceptable Use Policy</h2>
                  <p>
                    You agree not to misuse the Service. Prohibited actions include, but are not limited to:
                  </p>
                  <ul className="grid md:grid-cols-2 gap-4 mt-6 list-none pl-0">
                    {[
                      "Reverse engineering or decompiling the Service.",
                      "Using the Service for crypto-mining or malicious attacks.",
                      "Scraping or automated data collection without consent.",
                      "Hosting illegal, offensive, or infringing content.",
                      "Attempting to bypass security or authentication measures.",
                      "Reselling access to the Service without authorization."
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3 items-start bg-white/5 p-4 rounded-lg border border-white/5 text-sm">
                        <span className="text-red-500 font-mono text-xs mt-1">NO</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* 5. Payment */}
                <section id="payment" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">5. Payment & Subscription</h2>
                  <p>
                    Certain features of the Service are subject to fees. All fees are non-refundable except as required by law.
                  </p>
                  <p>
                    <strong>Subscription Renewal:</strong> Subscriptions automatically renew at the end of each billing cycle unless cancelled. You authorize us to charge your payment method for the renewal term.
                  </p>
                  <p>
                    <strong>Price Changes:</strong> We reserve the right to change pricing with 30 days notice. Continued use after the price change constitutes agreement to the new pricing.
                  </p>
                </section>

                {/* 6. Intellectual Property */}
                <section id="ip" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">6. Intellectual Property</h2>
                  <p>
                    <strong>CodeVo Rights:</strong> The Service, including its "look and feel," code, documentation, and design, is the exclusive property of CodeVo and its licensors.
                  </p>
                  <p>
                    <strong>Your Content:</strong> You retain ownership of any code, text, or data you upload to the Service ("User Content"). By posting User Content, you grant CodeVo a limited license to host, run, and display your content solely as necessary to provide the Service.
                  </p>
                </section>

                {/* 7. Termination */}
                <section id="termination" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">7. Termination</h2>
                  <p>
                    We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease.
                  </p>
                </section>

                {/* 8. Limitation of Liability */}
                <section id="liability" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">8. Limitation of Liability</h2>
                  <div className="p-6 bg-[#0a0a0a] border border-red-900/20 rounded-lg">
                    <p className="text-sm font-mono uppercase tracking-wider text-gray-500 mb-4">Disclaimer</p>
                    <p className="uppercase text-sm font-medium leading-relaxed text-gray-300">
                      To the maximum extent permitted by law, CodeVo shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
                    </p>
                  </div>
                </section>

                {/* 9. Contact */}
                <section id="contact" className="scroll-mt-32 border-t border-white/10 pt-16">
                  <h2 className="text-2xl mb-6">10. Contact Information</h2>
                  <p>
                    If you have any questions about these Terms, please contact us at:
                  </p>
                  <div className="mt-6 flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 w-24">Email:</span>
                      <a href="mailto:reach@codevo.co.in" className="text-white hover:underline">reach@codevo.co.in</a>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 w-24">Address:</span>
                      <span className="text-gray-300">San Francisco, CA, USA</span>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
