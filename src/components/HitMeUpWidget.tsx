import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Send, Github, Linkedin, Mail, Twitter } from "lucide-react";

export function HitMeUpWidget() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-white text-black p-3 pr-3 rounded-l-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:pr-5 hover:bg-zinc-200 transition-all duration-300 group border-l border-t border-b border-white/10 flex items-center gap-2"
          aria-label="Connect"
        >
          <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {/* Optional Label on Hover */}
          <span className="text-xs font-bold uppercase tracking-wider hidden group-hover:inline-block animate-in fade-in duration-200">
            Connect
          </span>
        </button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-[420px] bg-[#050505] border-l border-white/10 p-0 shadow-2xl">
        <div className="flex flex-col h-full">
            
            {/* Header / Profile Section */}
            <div className="p-8 pb-8 border-b border-white/5 bg-[#0a0a0a]">
                <SheetHeader className="text-left space-y-2">
                    <SheetTitle className="text-3xl font-bold text-white font-sans tracking-tight">Let's Connect</SheetTitle>
                    <SheetDescription className="text-gray-400 text-sm leading-relaxed">
                        Have a project in mind or just want to say hi? <br/> 
                        Connect with us on social or drop a message.
                    </SheetDescription>
                </SheetHeader>

                {/* Profile Card */}
                <div className="mt-8 flex items-center gap-5 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[1.5px] shrink-0">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                            <span className="text-lg font-bold text-white">CV</span> 
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-lg">Team Codevo</h4>
                        <p className="text-xs text-blue-400 font-mono">@codevo_official</p>
                    </div>
                </div>

                {/* Social Actions */}
                <div className="flex gap-3 mt-6">
                    {[Github, Linkedin, Twitter, Mail].map((Icon, i) => (
                        <Button key={i} variant="outline" size="icon" className="w-10 h-10 rounded-full border-white/10 bg-white/5 hover:bg-white hover:text-black hover:border-transparent transition-all">
                            <Icon className="w-4 h-4" />
                        </Button>
                    ))}
                </div>
            </div>

            {/* Contact Form Section */}
            <div className="flex-1 p-8 overflow-y-auto">
                <form className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Your Name</label>
                        <Input className="bg-[#111] border-white/10 focus:border-white/30 h-12 rounded-lg text-white placeholder:text-zinc-600" placeholder="John Doe" />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                        <Input className="bg-[#111] border-white/10 focus:border-white/30 h-12 rounded-lg text-white placeholder:text-zinc-600" placeholder="john@example.com" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Message</label>
                        <Textarea className="bg-[#111] border-white/10 focus:border-white/30 min-h-[140px] rounded-lg text-white resize-none placeholder:text-zinc-600 p-4" placeholder="How can we help you today?" />
                    </div>

                    <Button className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg text-sm tracking-wide mt-4 transition-transform active:scale-[0.98]">
                        Send Message <Send className="w-3.5 h-3.5 ml-2" />
                    </Button>
                </form>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
