import { useState, useEffect } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ChevronRight, Shield, Lock, Eye, Database, Globe } from 'lucide-react';

const SECTIONS = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'collection', title: '2. Data We Collect' },
  { id: 'usage', title: '3. How We Use Data' },
  { id: 'sharing', title: '4. Data Sharing' },
  { id: 'storage', title: '5. Storage & Retention' },
  { id: 'rights', title: '6. Your Rights' },
  { id: 'security', title: '7. Security Measures' },
  { id: 'cookies', title: '8. Cookies & Tracking' },
  { id: 'children', title: '9. Children’s Privacy' },
  { id: 'contact', title: '10. Contact Us' },
];

const PrivacyPolicy = () => {
  const [session, setSession] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('introduction');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for sticky header
      
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Privacy Policy</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-6 text-sm text-gray-500 font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                Last Updated: January 1, 2026
              </span>
              <span className="hidden md:inline text-gray-700">|</span>
              <span>Global Edition</span>
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
                  <div className="flex items-center gap-3 mb-3 text-white">
                     <Shield className="w-5 h-5" />
                     <span className="font-bold text-sm">Data Protection</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    We process data in compliance with GDPR, CCPA, and global privacy standards.
                  </p>
                  <a href="mailto:privacy@codevo.co.in" className="text-xs font-bold text-white hover:underline flex items-center gap-1">
                    Contact DPO <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
              <div className="prose prose-invert prose-p:text-gray-400 prose-headings:text-white prose-headings:font-semibold prose-a:text-white prose-li:text-gray-400 max-w-none space-y-16">
                
                {/* 1. Introduction */}
                <section id="introduction" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">1. Introduction</h2>
                  <p>
                    CodeVo ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we look after your personal data when you visit our website, use our compiler, or participate in our coding challenges, and tells you about your privacy rights.
                  </p>
                  <p>
                    By using CodeVo, you agree to the collection and use of information in accordance with this policy. We prioritize transparency and ensure that your data is handled with the utmost care.
                  </p>
                </section>

                {/* 2. Data We Collect */}
                <section id="collection" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">2. Data We Collect</h2>
                  <p>We collect several types of information for various purposes to provide and improve our Service to you:</p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
                    <div className="p-4 rounded-lg border border-white/10 bg-[#0a0a0a]">
                        <div className="flex items-center gap-2 mb-2 text-white font-semibold text-sm">
                            <Database className="w-4 h-4 text-blue-500" /> Personal Data
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">Email address, First name and last name, Cookies and Usage Data, Github/LinkedIn profile links.</p>
                    </div>
                    <div className="p-4 rounded-lg border border-white/10 bg-[#0a0a0a]">
                        <div className="flex items-center gap-2 mb-2 text-white font-semibold text-sm">
                            <Eye className="w-4 h-4 text-purple-500" /> Usage Data
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">IP address, browser type, browser version, pages visited, time and date of visit, and unique device identifiers.</p>
                    </div>
                  </div>
                </section>

                {/* 3. Usage */}
                <section id="usage" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">3. How We Use Data</h2>
                  <p>CodeVo uses the collected data for various purposes:</p>
                  <ul className="list-disc pl-5 space-y-2 mt-4">
                    <li>To provide and maintain the Service (e.g., executing your code submissions).</li>
                    <li>To notify you about changes to our Service.</li>
                    <li>To allow you to participate in interactive features when you choose to do so.</li>
                    <li>To provide customer care and support.</li>
                    <li>To provide analysis or valuable information so that we can improve the Service.</li>
                    <li>To monitor the usage of the Service and detect technical issues.</li>
                  </ul>
                </section>

                {/* 4. Sharing */}
                <section id="sharing" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">4. Data Sharing</h2>
                  <p>
                    We do not sell your personal data. We may share your data with:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mt-4">
                    <li><strong>Service Providers:</strong> Third-party companies (e.g., hosting, payment processors) bound by confidentiality agreements.</li>
                    <li><strong>Legal Requirements:</strong> If required to do so by law or in response to valid requests by public authorities.</li>
                    <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition.</li>
                  </ul>
                </section>

                {/* 5. Storage */}
                <section id="storage" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">5. Storage & Retention</h2>
                  <p>
                    Your data is stored on secure servers located in the US and EU. We retain your personal data only for as long as is necessary for the purposes set out in this Privacy Policy.
                  </p>
                  <p>
                    Code submissions and problem solutions may be anonymized and retained indefinitely for improving our judging algorithms and plagiarism detection systems.
                  </p>
                </section>

                {/* 6. Rights */}
                <section id="rights" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">6. Your Rights</h2>
                  <p>Depending on your location, you may have the following rights regarding your data:</p>
                  <div className="mt-6 space-y-4">
                    {[
                      { title: "Right to Access", desc: "You have the right to request copies of your personal data." },
                      { title: "Right to Rectification", desc: "You have the right to request that we correct any information you believe is inaccurate." },
                      { title: "Right to Erasure", desc: "You have the right to request that we erase your personal data, under certain conditions." },
                      { title: "Right to Object", desc: "You have the right to object to our processing of your personal data." }
                    ].map((right, i) => (
                      <div key={i} className="flex gap-4 border-l-2 border-white/10 pl-4">
                         <div className="flex-1">
                            <h4 className="text-white font-medium text-sm">{right.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">{right.desc}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 7. Security */}
                <section id="security" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">7. Security Measures</h2>
                  <div className="flex items-start gap-4 bg-[#0a0a0a] border border-white/5 p-6 rounded-lg">
                    <Lock className="w-6 h-6 text-green-500 mt-1 shrink-0" />
                    <div>
                      <h4 className="text-white font-bold text-sm mb-2">Enterprise-Grade Security</h4>
                      <p className="text-sm text-gray-400">
                        We use SSL/TLS encryption for all data in transit. Our databases are encrypted at rest. We employ strict access controls and conduct regular security audits to ensure your code and personal information remain secure.
                      </p>
                    </div>
                  </div>
                </section>

                {/* 8. Cookies */}
                <section id="cookies" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">8. Cookies & Tracking</h2>
                  <p>
                    We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
                  </p>
                </section>

                {/* 9. Children */}
                <section id="children" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">9. Children’s Privacy</h2>
                  <p>
                    Our Service does not address anyone under the age of 13 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us.
                  </p>
                </section>

                {/* 10. Contact */}
                <section id="contact" className="scroll-mt-32 border-t border-white/10 pt-16">
                  <h2 className="text-2xl mb-6">10. Contact Us</h2>
                  <p>
                    If you have any questions about this Privacy Policy, please contact us:
                  </p>
                  <div className="mt-6 flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 w-24">Email:</span>
                      <a href="mailto:privacy@codevo.co.in" className="text-white hover:underline">privacy@codevo.co.in</a>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 w-24">Post:</span>
                      <span className="text-gray-300">Data Protection Officer, CodeVo Inc., San Francisco, CA</span>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
