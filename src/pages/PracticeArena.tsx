import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  LogOut, 
  Layers, 
  Hash, 
  Code2, 
  Database, 
  Cpu, 
  Globe,
  Search,
  Bell,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

// --- Types & Interfaces ---

interface UserProfile {
  username: string;
  membershipType: string;
  solvedCount: number;
  rank: number;
}

interface Topic {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  timeEstimate: string;
  status: 'Solved' | 'Unsolved' | 'Attempted';
}

// --- Mock Data (Simulating Database/API) ---

const USER_DATA: UserProfile = {
  username: "USER",
  membershipType: "Premium Member",
  solvedCount: 0,
  rank: 42
};

const TOPICS_DATA: Topic[] = [
  { id: 'all', name: 'All Topics', icon: <Layers size={18} />, count: 156 },
  { id: 'arrays', name: 'Arrays & Hashing', icon: <Hash size={18} />, count: 24 },
  { id: 'dp', name: 'Dynamic Programming', icon: <Code2 size={18} />, count: 35 },
  { id: 'trees', name: 'Trees & Graphs', icon: <Database size={18} />, count: 42 },
  { id: 'system', name: 'System Design', icon: <Cpu size={18} />, count: 18 },
  { id: 'security', name: 'Network Security', icon: <Globe size={18} />, count: 12 },
];

const PROBLEMS_DATA: Problem[] = [
  { id: 1, title: "Two Sum Target", difficulty: "Easy", category: "Arrays", timeEstimate: "15 mins", status: "Unsolved" },
  { id: 2, title: "LRU Cache Implementation", difficulty: "Medium", category: "System Design", timeEstimate: "45 mins", status: "Unsolved" },
  { id: 3, title: "Merge K Sorted Lists", difficulty: "Hard", category: "Linked Lists", timeEstimate: "60 mins", status: "Unsolved" },
  { id: 4, title: "Valid Anagram", difficulty: "Easy", category: "Arrays", timeEstimate: "10 mins", status: "Attempted" },
  { id: 5, title: "Climbing Stairs", difficulty: "Easy", category: "Dynamic Programming", timeEstimate: "20 mins", status: "Unsolved" },
  { id: 6, title: "Longest Palindromic Substring", difficulty: "Medium", category: "String", timeEstimate: "35 mins", status: "Solved" },
];

// --- Sub-Components ---

/**
 * ProfileCard Component
 * Renders the user stats, avatar, and account actions exactly as requested.
 */
const ProfileCard: React.FC = () => {
  return (
    <div className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-6 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      
      {/* Header Section */}
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mr-4 border border-[#333] shadow-inner">
          <User className="text-white w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-white font-bold text-lg tracking-wide uppercase leading-tight">
            {USER_DATA.username}
          </h2>
          <span className="text-[#555] text-xs font-medium tracking-wide">
            {USER_DATA.membershipType}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-[#111] border border-[#1f1f1f] rounded p-3 flex flex-col items-center justify-center transition-colors hover:border-[#333]">
          <span className="text-[#555] text-[10px] font-bold tracking-widest uppercase mb-1">Solved</span>
          <span className="text-white text-xl font-bold">{USER_DATA.solvedCount}</span>
        </div>
        <div className="flex-1 bg-[#111] border border-[#1f1f1f] rounded p-3 flex flex-col items-center justify-center transition-colors hover:border-[#333]">
          <span className="text-[#555] text-[10px] font-bold tracking-widest uppercase mb-1">Rank</span>
          <span className="text-[#00ff9d] text-xl font-bold">#{USER_DATA.rank}</span>
        </div>
      </div>

      {/* Menu Actions */}
      <div className="flex flex-col gap-5 pt-2 border-t border-[#1a1a1a]">
        <button className="flex items-center group cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-5 flex justify-center mr-3">
            <Settings className="text-[#666] w-4 h-4 group-hover:text-white transition-colors" />
          </div>
          <span className="text-[#ccc] group-hover:text-white text-xs font-bold tracking-widest uppercase transition-colors">
            Settings
          </span>
        </button>
        
        <button className="flex items-center group cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-5 flex justify-center mr-3">
             {/* Rotated icon to match the design (arrow pointing right out of bracket) */}
            <LogOut className="text-[#ff4747] w-4 h-4 transform rotate-180" /> 
          </div>
          <span className="text-[#ff4747] text-xs font-bold tracking-widest uppercase">
            Log Out
          </span>
        </button>
      </div>
    </div>
  );
};

// --- Main Application Component ---

const PracticeArena: React.FC = () => {
  // State Management
  const [activeTopicId, setActiveTopicId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>(PROBLEMS_DATA);

  // Filter Logic: Runs whenever topic or search query changes
  useEffect(() => {
    let result = PROBLEMS_DATA;

    // Filter by Topic (Mock logic - in real app, we filter by category mapping)
    if (activeTopicId !== 'all') {
      const selectedTopicName = TOPICS_DATA.find(t => t.id === activeTopicId)?.name.split(' ')[0]; // Simple fuzzy match for demo
      if (selectedTopicName) {
         result = result.filter(p => p.category.includes(selectedTopicName) || p.category === activeTopicId);
      }
    }

    // Filter by Search
    if (searchQuery.trim() !== '') {
      result = result.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProblems(result);
  }, [activeTopicId, searchQuery]);

  // Helper to get difficulty color
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'text-[#00ff9d] bg-[#00ff9d]/10 border-[#00ff9d]/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Hard': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex overflow-hidden selection:bg-[#00ff9d] selection:text-black">
      
      {/* ---------------- Sidebar ---------------- */}
      <aside className="w-80 h-screen bg-black border-r border-[#1f1f1f] flex flex-col shrink-0 z-20">
        
        {/* Scrollable Area for Sidebar */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* 1. Profile Card */}
          <ProfileCard />

          {/* Separator */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#1f1f1f] to-transparent my-6"></div>

          {/* 2. Topics Navigation */}
          <div>
            <h3 className="text-[#444] text-[11px] font-extrabold uppercase tracking-[0.2em] mb-4 px-2">
              Practice Topics
            </h3>
            <nav className="flex flex-col gap-1">
              {TOPICS_DATA.map((topic) => {
                const isActive = activeTopicId === topic.id;
                return (
                  <button 
                    key={topic.id}
                    onClick={() => setActiveTopicId(topic.id)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-md transition-all duration-200 group
                      ${isActive 
                        ? 'bg-[#111] text-[#00ff9d] border-l-2 border-[#00ff9d]' 
                        : 'text-gray-400 hover:bg-[#0a0a0a] hover:text-white border-l-2 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <span className={`mr-3 ${isActive ? 'text-[#00ff9d]' : 'text-[#444] group-hover:text-white'}`}>
                        {topic.icon}
                      </span>
                      <span className="text-sm font-medium tracking-wide">{topic.name}</span>
                    </div>
                    {/* Topic Count Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'bg-[#1a1a1a] text-[#444]'}`}>
                      {topic.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#1f1f1f] bg-black">
          <div className="bg-[#111] rounded p-3 flex items-center justify-between cursor-pointer hover:bg-[#1a1a1a] transition-colors">
            <span className="text-xs text-gray-400 font-medium">Daily Challenge</span>
            <div className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse"></div>
          </div>
        </div>
      </aside>


      {/* ---------------- Main Content ---------------- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* 1. Top Navigation Bar */}
        <header className="h-20 border-b border-[#1f1f1f] bg-black/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          
          {/* Search Bar */}
          <div className="flex items-center bg-[#0a0a0a] border border-[#1f1f1f] focus-within:border-[#333] rounded-full px-4 py-2 w-96 transition-colors">
            <Search className="text-gray-500 w-4 h-4 mr-3" />
            <input 
              type="text" 
              placeholder="Search problems by name or tag..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-600 font-medium"
            />
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold tracking-wider uppercase">Streak</span>
                <div className="flex items-center text-orange-500">
                    <span className="text-sm font-bold mr-1">🔥 0</span>
                </div>
             </div>
             <div className="h-6 w-px bg-[#1f1f1f]"></div>
             <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
             </button>
          </div>
        </header>


        {/* 2. Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            
            {/* Page Title & Breadcrumbs */}
            <div className="mb-10">
              <div className="flex items-center text-xs text-gray-500 mb-2 uppercase tracking-widest font-bold">
                 <span>Codevo</span>
                 <ChevronRight size={12} className="mx-2" />
                 <span className="text-[#00ff9d]">Practice</span>
              </div>
              <h1 className="text-4xl font-bold mb-3 text-white">
                {TOPICS_DATA.find(t => t.id === activeTopicId)?.name || 'All Topics'}
              </h1>
              <p className="text-gray-500 max-w-2xl text-sm leading-relaxed">
                Sharpen your coding skills with our curated list of challenges. 
                Track your progress, improve your rank, and master algorithms.
              </p>
            </div>

            {/* Problem List Header */}
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-white font-bold text-sm uppercase tracking-wide">
                 Problem List <span className="text-[#333] ml-2">({filteredProblems.length})</span>
               </h3>
               
               <div className="flex gap-2">
                 <select className="bg-[#0a0a0a] text-xs text-gray-400 border border-[#1f1f1f] rounded px-3 py-1.5 outline-none hover:border-[#333]">
                   <option>Difficulty: Any</option>
                   <option>Easy</option>
                   <option>Medium</option>
                   <option>Hard</option>
                 </select>
                 <select className="bg-[#0a0a0a] text-xs text-gray-400 border border-[#1f1f1f] rounded px-3 py-1.5 outline-none hover:border-[#333]">
                   <option>Status: Any</option>
                   <option>Solved</option>
                   <option>Unsolved</option>
                 </select>
               </div>
            </div>

            {/* 3. The Grid of Problems */}
            <div className="grid gap-4">
              {filteredProblems.length > 0 ? (
                filteredProblems.map((problem) => (
                  <div 
                    key={problem.id} 
                    className="group bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-5 hover:border-[#333] hover:bg-[#0f0f0f] transition-all duration-200 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className="mt-1">
                        {problem.status === 'Solved' ? (
                          <CheckCircle2 size={20} className="text-[#00ff9d]" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-[#222] group-hover:border-[#444]"></div>
                        )}
                      </div>

                      {/* Problem Details */}
                      <div>
                        <h4 className="text-lg font-bold text-gray-200 group-hover:text-[#00ff9d] transition-colors mb-2">
                          {problem.title}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDifficultyColor(problem.difficulty)} uppercase tracking-wider`}>
                            {problem.difficulty}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {problem.category}
                          </span>
                          <div className="w-1 h-1 bg-[#222] rounded-full"></div>
                          <div className="flex items-center text-xs text-gray-600">
                             <Clock size={12} className="mr-1" />
                             {problem.timeEstimate}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                       <button className="bg-white text-black text-xs font-bold px-4 py-2 rounded flex items-center hover:bg-[#00ff9d] transition-colors">
                          SOLVE
                          <PlayCircle size={14} className="ml-2" />
                       </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 border border-dashed border-[#1f1f1f] rounded-lg">
                  <p className="text-gray-500">No problems found matching your criteria.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default PracticeArena;
