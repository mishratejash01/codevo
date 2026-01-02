// mishratejash01/codevo/codevo-1890e334b2b9948d077d3cae82ff7478bd54648e/src/pages/PrivacyPolicy.tsx

import { Lock, Eye, Database, Globe } from 'lucide-react';
import { Header } from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PrivacyPolicy = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-primary/20">
      <Header session={session} onLogout={() => supabase.auth.signOut()} />
      
      <div className="container mx-auto px-4 md:px-6 py-24 max-w-4xl">
        <div className="mb-12 border-b border-white/10 pb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg">
              Effective Date: December 14, 2025
            </p>
        </div>

        <div className="space-y-12 text-gray-300 leading-relaxed">
          
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
             <p className="italic text-gray-400">
                At CodeVo, we prioritize data sovereignty and exam integrity. This policy outlines how we handle 
                your data, specifically regarding proctored environments and code execution.
             </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" /> 1. Information We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
                <li><strong className="text-white">Account Data:</strong> Email address, full name, and authentication identifiers provided via Supabase.</li>
                <li><strong className="text-white">Usage Data:</strong> Code submissions, compilation errors, execution time, and performance metrics.</li>
                <li><strong className="text-white">Proctoring Data:</strong> During exams, we may collect video/audio feeds, screen focus events, and browser metadata to ensure integrity. This data is stored transiently.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" /> 2. How We Use Your Data
            </h2>
            <p>
              We use the collected data for the following purposes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-[#1a1a1c] p-4 rounded border border-white/5">
                    <h3 className="font-bold text-white mb-2">Service Delivery</h3>
                    <p className="text-sm text-gray-400">To execute your code in our sandboxed environments and provide real-time feedback.</p>
                </div>
                <div className="bg-[#1a1a1c] p-4 rounded border border-white/5">
                    <h3 className="font-bold text-white mb-2">Exam Integrity</h3>
                    <p className="text-sm text-gray-400">To generate automated proctoring reports for educational institutions.</p>
                </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Lock className="w-6 h-6 text-primary" /> 3. Data Security
            </h2>
            <p>
              We employ industry-standard security measures including encryption at rest and in transit. 
              Code submissions are executed in isolated containers (sandboxes) to prevent unauthorized access to our infrastructure.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" /> 4. International Data Transfers
            </h2>
            <p>
              Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, 
              province, country, or other governmental jurisdiction. Our primary servers are located in the United States.
            </p>
          </section>

          {/* Contact */}
          <section className="pt-8 border-t border-white/10">
            <p className="text-sm text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at <a href="mailto:reach@codevo.co.in" className="text-primary hover:underline">reach@codevo.co.in</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
