import { useState, useEffect } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

const SECTIONS = [
  { id: 'what-are-cookies', title: '1. What Are Cookies' },
  { id: 'how-we-use', title: '2. How We Use Them' },
  { id: 'essential', title: '3. Essential Cookies' },
  { id: 'analytics', title: '4. Analytics & Performance' },
  { id: 'advertising', title: '5. Advertising & Targeting' },
  { id: 'third-party', title: '6. Third-Party Cookies' },
  { id: 'managing', title: '7. Managing Preferences' },
  { id: 'updates', title: '8. Policy Updates' },
  { id: 'contact', title: '9. Contact Us' },
];

const CookiePolicy = () => {
  const [session, setSession] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('what-are-cookies');

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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Cookie Policy</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-6 text-sm text-gray-500 font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500/80 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></span>
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
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    You can change your cookie preferences at any time through your browser settings.
                  </p>
                  <a href="mailto:privacy@codevo.co.in" className="text-xs font-bold text-white hover:underline flex items-center gap-1">
                    Contact Privacy Team <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
              <div className="prose prose-invert prose-p:text-gray-400 prose-headings:text-white prose-headings:font-semibold prose-a:text-white prose-li:text-gray-400 max-w-none space-y-16">
                
                {/* 1. What Are Cookies */}
                <section id="what-are-cookies" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">1. What Are Cookies</h2>
                  <p>
                    Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to the owners of the site.
                  </p>
                  <p>
                    CodeVo uses cookies to distinguish you from other users of our Service. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site.
                  </p>
                </section>

                {/* 2. How We Use Them */}
                <section id="how-we-use" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">2. How We Use Cookies</h2>
                  <p>
                    We use cookies to:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mt-4">
                    <li>Authenticate you and keep you signed in.</li>
                    <li>Remember your preferences and settings (e.g., code editor theme, layout).</li>
                    <li>Analyze how you use our Service to improve performance.</li>
                    <li>Measure the effectiveness of our marketing campaigns.</li>
                  </ul>
                </section>

                {/* 3. Essential Cookies */}
                <section id="essential" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">3. Essential Cookies</h2>
                  <p>
                    These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms.
                  </p>
                  <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-lg mt-4">
                    <p className="text-xs text-gray-400 mb-0">
                      <strong>Examples:</strong> Authentication tokens, session IDs, security nonces.
                    </p>
                  </div>
                </section>

                {/* 4. Analytics */}
                <section id="analytics" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">4. Analytics & Performance</h2>
                  <p>
                    These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.
                  </p>
                </section>

                {/* 5. Advertising */}
                <section id="advertising" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">5. Advertising & Targeting</h2>
                  <p>
                    These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information but are based on uniquely identifying your browser and internet device.
                  </p>
                </section>

                {/* 6. Third-Party */}
                <section id="third-party" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">6. Third-Party Cookies</h2>
                  <p>
                    In some special cases, we also use cookies provided by trusted third parties. The following section details which third party cookies you might encounter through this site:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mt-4">
                    <li><strong>Google Analytics:</strong> To understand how you use the site and ways that we can improve your experience.</li>
                    <li><strong>Stripe:</strong> To provide fraud prevention and process payments securely.</li>
                    <li><strong>Supabase:</strong> To manage user sessions and authentication state.</li>
                  </ul>
                </section>

                {/* 7. Managing */}
                <section id="managing" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">7. Managing Preferences</h2>
                  <p>
                    Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">www.aboutcookies.org</a> or <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">www.allaboutcookies.org</a>.
                  </p>
                  <p className="mt-4">
                    You can choose to enable or disable cookies in your internet browser. By default, most internet browsers accept cookies but this can be changed. For further details, please consult the help menu in your internet browser.
                  </p>
                </section>

                {/* 8. Updates */}
                <section id="updates" className="scroll-mt-32">
                  <h2 className="text-2xl mb-6">8. Policy Updates</h2>
                  <p>
                    We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
                  </p>
                </section>

                {/* 9. Contact */}
                <section id="contact" className="scroll-mt-32 border-t border-white/10 pt-16">
                  <h2 className="text-2xl mb-6">9. Contact Us</h2>
                  <p>
                    If you have any questions about our use of cookies or other technologies, please email us at:
                  </p>
                  <div className="mt-6 flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 w-24">Email:</span>
                      <a href="mailto:privacy@codevo.co.in" className="text-white hover:underline">reach@codevo.co.in</a>
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

export default CookiePolicy;
