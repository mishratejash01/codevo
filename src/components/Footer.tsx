import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-[#0c0c0e] pt-16 pb-8 relative z-10 w-full overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column - Top Left */}
          <div className="space-y-6">
            <Link to="/" className="flex flex-col items-start gap-2 group w-fit">
              {/* Logo - Solid Filled */}
              <span className="font-neuropol text-4xl font-bold tracking-wider text-white cursor-pointer select-none">
                COD
                <span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>
                VO
              </span>
            </Link>

            {/* Contact Section */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                For business inquiries, collaborations, or support, please reach out to us directly.
              </p>
              <a 
                href="mailto:reach@codevo.co.in" 
                className="text-sm font-medium text-white hover:text-white transition-colors inline-block border-b border-transparent hover:border-white"
              >
                reach@codevo.co.in
              </a>
            </div>
          </div>
          
          {/* Products Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Products</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/compiler" className="hover:text-white transition-colors">Compiler</Link></li>
              <li><Link to="/practice-arena" className="hover:text-white transition-colors">Solve</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Profile Card</Link></li>
              <li><Link to="/events" className="hover:text-white transition-colors">Events</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Resources</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                {/* Blog Link - Disabled/Coming Soon */}
                <span className="flex items-center gap-2 cursor-not-allowed text-muted-foreground/60 select-none">
                  Blog 
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 tracking-wide uppercase">
                    Coming Soon
                  </span>
                </span>
              </li>
              <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link to="/auth" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal Links (Connecting Paths) */}
          <div>
            <h4 className="font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>

        {/* Know More Section - Full Width */}
        <div className="border-t border-white/5 py-8">
          <div className="w-full">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Know More</h3>
            <p className="text-sm text-muted-foreground/80 leading-7 text-justify md:text-left">
              Real talk: CodeVo isn't just another compiler; it's what happens when obsession meets opportunity. We built this company because we got tired of dev tools that looked like they were designed in the stone age. We wanted a platform that screams 'performance' without the enterprise bloat. CodeVo is our answer to every 'it works on my machine' excuse ever made. We treat latency like a personal enemy and believe that a clean UI is next to godliness. Whether you're here to crush a competitive programming contest or just figure out why your recursion won't stop, we've got the infrastructure to handle it. Welcome to the big leagues—buckle up.
            </p>
          </div>
        </div>

        {/* Bottom Bar Details */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()}. Made with <Heart className="w-3 h-3 inline text-red-500 mx-0.5 fill-red-500" /> by CodeVo.
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
            <img src="/image.png" alt="USA Flag" className="w-5 h-auto object-contain rounded-[2px]" />
            <span>San Francisco, USA</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
