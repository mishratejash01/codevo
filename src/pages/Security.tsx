import { useState, useEffect } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

const SECTIONS = [
  { id: 'philosophy', title: '1. Security Philosophy' },
  { id: 'infrastructure', title: '2. Infrastructure' },
  { id: 'encryption', title: '3. Data Encryption' },
  { id: 'authentication', title: '4. Authentication & Access' },
  { id: 'monitoring', title: '5. Monitoring & Response' },
  { id: 'sdlc', title: '6. Secure Development' },
  { id: 'compliance', title: '7. Compliance' },
  { id: 'disclosure', title: '8. Vulnerability Disclosure' },
  { id: 'contact', title: '9. Contact Security' },
];

const Security = () => {
  const [session, setSession] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('philosophy');

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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Security</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-6 text-sm text-gray-500 font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span>
                Status: Systems Operational
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
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Found a vulnerability? We operate a bug bounty program for responsible disclosure.
                  </p>
                  <a href="mailto:security@codevo.co.in" className="text-xs font-bold text-white hover:underline flex items-center gap-1">
                    Report Issue <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
              <div className="prose prose-invert prose-p:text-gray-400 prose-headings:text-white prose-headings:font-semibold prose-a:text-white prose-li:text-gray-400 max-w-none space-y-16">
                
                {/* 1. Philosophy */}
                <section id="philosophy" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">1. Security Philosophy</h2>
                  <p>
                    Security is not an afterthought at CodeVo; it is the foundation of our platform. We believe that trust is earned through transparency, rigorous engineering, and a relentless commitment to protecting user data.
                  </p>
                  <p>
                    We employ a defense-in-depth strategy, layering multiple security controls to protect our infrastructure, application, and data from evolving threats.
                  </p>
                </section>

                {/* 2. Infrastructure */}
                <section id="infrastructure" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">2. Infrastructure</h2>
                  <p>
                    Our services are hosted on industry-leading cloud providers (AWS and Google Cloud Platform) that maintain world-class security standards, including SOC 2 and ISO 27001 certifications.
                  </p>
                  <p>
                    We utilize isolated execution environments (sandboxes) for running user code, ensuring that code execution is secure, contained, and cannot affect the underlying host system or other users.
                  </p>
                </section>

                {/* 3. Encryption */}
                <section id="encryption" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">3. Data Encryption</h2>
                  <p>
                    <strong>In Transit:</strong> All data transmitted between your device and our servers is encrypted using strong TLS 1.2+ (Transport Layer Security) protocols. We score an "A+" on Qualys SSL Labs tests.
                  </p>
                  <p>
                    <strong>At Rest:</strong> Sensitive data, including source code and personal information, is encrypted at rest using AES-256 standards. Key management is handled through secure cloud KMS services.
                  </p>
                </section>

                {/* 4. Authentication */}
                <section id="authentication" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">4. Authentication & Access</h2>
                  <p>
                    We rely on robust authentication mechanisms provided by Supabase Auth. We do not store passwords directly; instead, we use secure hashing algorithms or delegate authentication to trusted OAuth providers (GitHub, Google).
                  </p>
                  <p>
                    Access to production systems is strictly limited to authorized engineering staff and is protected by Multi-Factor Authentication (MFA) and VPNs.
                  </p>
                </section>

                {/* 5. Monitoring */}
                <section id="monitoring" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">5. Monitoring & Incident Response</h2>
                  <p>
                    We maintain comprehensive logging and monitoring of our infrastructure. Automated systems detect anomalous behavior and alert our security team immediately.
                  </p>
                  <p>
                    In the event of a security incident, we have a defined Incident Response Plan that includes rapid containment, investigation, and transparent communication with affected users.
                  </p>
                </section>

                {/* 6. SDLC */}
                <section id="sdlc" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">6. Secure Development Lifecycle</h2>
                  <p>
                    Security is integrated into our CI/CD pipelines. We perform:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mt-4">
                    <li>Static Application Security Testing (SAST) on every commit.</li>
                    <li>Dependency scanning to identify known vulnerabilities in libraries.</li>
                    <li>Regular code reviews with a focus on security best practices.</li>
                  </ul>
                </section>

                {/* 7. Compliance */}
                <section id="compliance" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">7. Compliance</h2>
                  <p>
                    We are committed to complying with global data protection regulations, including GDPR and CCPA. We minimize data collection and provide tools for users to manage their own data privacy.
                  </p>
                </section>

                {/* 8. Disclosure */}
                <section id="disclosure" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">8. Vulnerability Disclosure</h2>
                  <p>
                    We value the contributions of the security research community. If you discover a vulnerability in CodeVo, please report it to us responsibly.
                  </p>
                  <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-lg mt-4">
                    <p className="text-xs text-gray-400 mb-0">
                      <strong>Policy:</strong> We pledge not to pursue legal action against researchers who discover and report security vulnerabilities in accordance with this policy and who make a good faith effort to avoid privacy violations or service disruptions.
                    </p>
                  </div>
                </section>

                {/* 9. Contact */}
                <section id="contact" className="scroll-mt-32 border-t border-white/10 pt-16">
                  <h2 className="text-2xl mb-6">9. Contact Security Team</h2>
                  <p>
                    For security inquiries, reports, or concerns, please contact our dedicated security team:
                  </p>
                  <div className="mt-6 flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 w-24">Email:</span>
                      <a href="mailto:security@codevo.co.in" className="text-white hover:underline">reach@codevo.co.in</a>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 w-24">PGP Key:</span>
                      <a href="#" className="text-white hover:underline">Download Public Key</a>
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

export default Security;
