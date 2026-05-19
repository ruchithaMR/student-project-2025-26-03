import { useState } from 'react';
import { Link } from 'react-router-dom';

type TabType = 'problem' | 'solution' | 'technology' | 'team';

const technologies = [
  { name: 'DistilBERT', category: 'NLP Model', description: 'Multilingual transformer for text analysis', icon: 'ri-brain-line', bg: 'bg-teal-500/10', color: 'text-teal-600' },
  { name: 'Layer-wise Results', category: 'Transparency', description: 'Expose ML output, LLM reasoning, and fused confidence in responses', icon: 'ri-lightbulb-line', bg: 'bg-amber-500/10', color: 'text-amber-600' },
  { name: 'Tesseract OCR', category: 'Image Processing', description: 'Extract text from screenshots and images (161 languages)', icon: 'ri-image-line', bg: 'bg-violet-500/10', color: 'text-violet-600' },
  { name: 'Fusion Service', category: 'Decision Layer', description: 'Weighted decision combining ML and LLM evidence', icon: 'ri-coin-line', bg: 'bg-emerald-500/10', color: 'text-emerald-600' },
  { name: 'LLM Providers', category: 'Reasoning Layer', description: 'Gemini/OpenAI with Ollama fallback for content reasoning', icon: 'ri-newspaper-line', bg: 'bg-sky-500/10', color: 'text-sky-600' },
  { name: 'React + TypeScript', category: 'Frontend', description: 'Modern, type-safe web application framework', icon: 'ri-code-s-slash-line', bg: 'bg-rose-500/10', color: 'text-rose-600' },
  { name: 'Flask', category: 'Backend', description: 'Python web framework with REST API', icon: 'ri-server-line', bg: 'bg-indigo-500/10', color: 'text-indigo-600' },
  { name: 'TailwindCSS', category: 'UI Framework', description: 'Utility-first responsive design system', icon: 'ri-palette-line', bg: 'bg-teal-500/10', color: 'text-teal-600' },
];

const teamMembers = [
  { name: 'Ruchitha M R', role: 'Developer', expertise: 'Machine Learning & NLP', icon: 'ri-user-star-line', initials: 'RM' },
  { name: 'Nuthan Gowda A P', role: 'Developer', expertise: 'Data Science & Model Training', icon: 'ri-user-settings-line', initials: 'NG' },
  { name: 'Kushal S', role: 'Developer', expertise: 'Web Development & APIs', icon: 'ri-code-box-line', initials: 'KS' },
  { name: 'Anand Reddy', role: 'Developer', expertise: 'System Architecture & Integration', icon: 'ri-bar-chart-box-line', initials: 'AR' },
  { name: 'Prof. Suresh M R', role: 'Project Guide', expertise: 'Associate Professor, Dept of IS&E', icon: 'ri-user-star-line', initials: 'SM' },
];

const datasets = [
  { name: 'ISOT (cleaned)', records: '39,089', description: 'Merged ISOT real+fake samples after preprocessing' },
  { name: 'LIAR (cleaned)', records: '12,765', description: 'Fact-check statements mapped to binary labels' },
  { name: 'WELFake (cleaned)', records: '24,455', description: 'Large mixed-source fake/real news corpus' },
  { name: 'FakeNewsNet (cleaned)', records: '18,130', description: 'GossipCop + PolitiFact subsets after cleanup' },
];

const tabList: { id: TabType; label: string; icon: string }[] = [
  { id: 'problem', label: 'Problem Statement', icon: 'ri-error-warning-line' },
  { id: 'solution', label: 'Our Solution', icon: 'ri-lightbulb-flash-line' },
  { id: 'technology', label: 'Technology Stack', icon: 'ri-stack-line' },
  { id: 'team', label: 'Our Team', icon: 'ri-team-line' },
];

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<TabType>('problem');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Public Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md">
              <i className="ri-shield-check-line text-white text-lg"></i>
            </div>
            <span className="font-bold text-slate-900 text-lg">VerifyAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              <i className="ri-arrow-left-line mr-1"></i>
              Back to Home
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 flex items-center justify-center bg-teal-500/10 rounded-lg">
          <i className="ri-information-line text-teal-600 text-base"></i>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">About the Platform</h1>
          <p className="text-xs text-slate-500">Fake News Detection System Using Data Science and Machine Learning with Real-Time Web Application</p>
        </div>
      </div>

      {/* Department Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-xl shadow-sm p-4 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <i className="ri-building-line text-teal-600 text-sm"></i>
          <p className="text-xs font-bold text-teal-900">DEPARTMENT OF INFORMATION SCIENCE AND ENGINEERING</p>
        </div>
        <p className="text-xs text-slate-600 ml-5">Academic Project · Machine Learning & Data Science</p>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-1 mb-5 flex gap-1">
        {tabList.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <i className={tab.icon}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PROBLEM STATEMENT ── */}
      {activeTab === 'problem' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-2">The Misinformation Crisis</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
              Misinformation spreads quickly across online platforms and can influence public opinion before verification happens. Manual fact-checking is often too slow for real-time content flow. This project addresses that gap with a practical, explainable AI workflow that supports text, URL, and image inputs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: 'ri-speed-line', bg: 'bg-rose-500/10', color: 'text-rose-600', title: 'Rapid Spread', desc: 'False claims can propagate before trusted verification reaches users.' },
              { icon: 'ri-global-line', bg: 'bg-amber-500/10', color: 'text-amber-600', title: 'Scale Challenge', desc: 'High-volume online content requires automated, repeatable verification support.' },
              { icon: 'ri-eye-off-line', bg: 'bg-violet-500/10', color: 'text-violet-600', title: 'Lack of Transparency', desc: 'Existing systems lack explainability and multilingual support for diverse users.' },
            ].map((card) => (
              <div key={card.title} className="bg-white border border-slate-100 rounded-xl shadow-sm p-5">
                <div className={`w-9 h-9 flex items-center justify-center ${card.bg} rounded-lg mb-3`}>
                  <i className={`${card.icon} ${card.color} text-base`}></i>
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{card.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 flex items-start gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-teal-500/10 rounded-lg flex-shrink-0">
              <i className="ri-information-line text-teal-600 text-sm"></i>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-1">UN Sustainable Development Goals</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                This project combats misinformation to protect democratic processes (SDG 16: Peace, Justice & Strong Institutions), nurture quality education (SDG 4: Quality Education), and foster partnerships for truth (SDG 17: Partnerships for the Goals).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── OUR SOLUTION ── */}
      {activeTab === 'solution' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-2">Intelligent Data-Driven Solution</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              A hybrid workflow that combines DistilBERT ML scoring, LLM reasoning, and weighted fusion to produce a final prediction with confidence and layer-level transparency.
            </p>
          </div>

          {/* Project Objectives */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-target-line text-teal-600 text-sm"></i>
              </div>
              <span className="text-sm font-semibold text-slate-800">Project Objectives</span>
            </div>
            <div className="p-5 space-y-3">
              {[
                'Design and develop an intelligent web-based system capable of identifying and classifying fake news content using machine learning and data-driven approaches',
                'Apply natural language processing (NLP) techniques for analyzing textual patterns, semantics, and sentiment to differentiate between genuine and misleading information',
                'Implement efficient data processing and model integration techniques for real-time analysis and prediction through a user-friendly web interface',
                'Evaluate the performance of various machine learning models based on accuracy, precision, recall, and F1-score to identify the most suitable approach',
                'Contribute toward promoting digital media reliability and awareness by providing a scalable platform that aids users in verifying authenticity of online news'
              ].map((objective, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <i className="ri-check-line text-teal-600 text-sm mt-0.5 flex-shrink-0"></i>
                  <p className="text-xs text-slate-600 leading-relaxed">{objective}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: 'ri-file-text-line', bg: 'bg-teal-500/10', color: 'text-teal-600', border: 'border-teal-200', title: 'Text Analysis', desc: 'DistilBERT multilingual transformer scores content and returns confidence.', badge: '91.5% Test Accuracy', badgeColor: 'text-teal-600' },
              { icon: 'ri-link', bg: 'bg-sky-500/10', color: 'text-sky-600', border: 'border-sky-200', title: 'URL Verification', desc: 'Automatic article scraping, content extraction, and source credibility analysis.', badge: 'Real-time Processing', badgeColor: 'text-sky-600' },
              { icon: 'ri-image-line', bg: 'bg-violet-500/10', color: 'text-violet-600', border: 'border-violet-200', title: 'Screenshot Analysis', desc: 'OCR technology extracts text from images for verification of social media posts.', badge: 'Multi-format Support', badgeColor: 'text-violet-600' },
              { icon: 'ri-shield-check-line', bg: 'bg-emerald-500/10', color: 'text-emerald-600', border: 'border-emerald-200', title: 'Fusion Decision', desc: 'ML and LLM outputs are fused into a single final verdict and assessment level.', badge: 'Layer Fusion Enabled', badgeColor: 'text-emerald-600' },
            ].map((card) => (
              <div key={card.title} className={`bg-white border-2 ${card.border} rounded-xl p-5 hover:shadow-md transition-shadow`}>
                <div className={`w-9 h-9 flex items-center justify-center ${card.bg} rounded-lg mb-3`}>
                  <i className={`${card.icon} ${card.color} text-base`}></i>
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{card.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{card.desc}</p>
                <div className={`flex items-center gap-1 text-xs font-semibold ${card.badgeColor}`}>
                  <i className="ri-check-line"></i>{card.badge}
                </div>
              </div>
            ))}
          </div>

          {/* Training Data */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-database-2-line text-teal-600 text-sm"></i>
              </div>
              <span className="text-sm font-semibold text-slate-800">Training Data</span>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {datasets.map((ds) => (
                <div key={ds.name} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-lg font-bold text-teal-700 mb-0.5">{ds.records}</p>
                  <p className="text-xs font-semibold text-slate-700 mb-1">{ds.name}</p>
                  <p className="text-xs text-slate-400">{ds.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TECHNOLOGY STACK ── */}
      {activeTab === 'technology' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {technologies.map((tech) => (
              <div key={tech.name} className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 hover:border-teal-200 hover:shadow-md transition-all">
                <div className={`w-9 h-9 flex items-center justify-center ${tech.bg} rounded-lg mb-3`}>
                  <i className={`${tech.icon} ${tech.color} text-base`}></i>
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">{tech.name}</p>
                <p className={`text-xs font-semibold ${tech.color} mb-1`}>{tech.category}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{tech.description}</p>
              </div>
            ))}
          </div>

          {/* Architecture Flow */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-flow-chart text-teal-600 text-sm"></i>
              </div>
              <span className="text-sm font-semibold text-slate-800">System Architecture</span>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                {[
                  { label: 'User Input', bg: 'bg-slate-100', text: 'text-slate-700' },
                  null,
                  { label: 'Preprocessing', bg: 'bg-sky-50', text: 'text-sky-700' },
                  null,
                  { label: 'DistilBERT ML Layer', bg: 'bg-violet-50', text: 'text-violet-700' },
                  null,
                  { label: 'LLM Reasoning Layer', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                  null,
                  { label: 'Fusion Engine', bg: 'bg-teal-50', text: 'text-teal-700' },
                  null,
                  { label: 'Results Display', bg: 'bg-slate-100', text: 'text-slate-700' },
                ].map((item, i) =>
                  item === null ? (
                    <i key={i} className="ri-arrow-right-line text-slate-300"></i>
                  ) : (
                    <div key={i} className={`px-3 py-1.5 rounded-lg border border-slate-200 font-semibold ${item.bg} ${item.text}`}>{item.label}</div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '91.5%', label: 'ML Test Accuracy', bg: 'bg-teal-500/8', text: 'text-teal-700', val: 'text-teal-900' },
              { value: '94,439', label: 'Prepared Samples', bg: 'bg-sky-500/8', text: 'text-sky-700', val: 'text-sky-900' },
              { value: 'ML + LLM + Fusion', label: 'Active Runtime Flow', bg: 'bg-violet-500/8', text: 'text-violet-700', val: 'text-violet-900' },
            ].map((m) => (
              <div key={m.label} className={`bg-white border border-slate-100 rounded-xl shadow-sm p-5 ${m.bg}`}>
                <p className={`text-2xl font-bold ${m.val} mb-1`}>{m.value}</p>
                <p className={`text-xs font-semibold ${m.text}`}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── OUR TEAM ── */}
      {activeTab === 'team' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-2">Project Team</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Our dedicated team of developers and researchers, guided by experienced faculty, working on building an intelligent fake news detection system to combat misinformation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{teamMembers.map((member) => (
              <div key={member.name} className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-teal-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-teal-700">{member.initials}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{member.name}</p>
                  <p className="text-xs font-semibold text-teal-600 mb-1">{member.role}</p>
                  <p className="text-xs text-slate-500">{member.expertise}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Project Info */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-8 text-center">
            <div className="w-12 h-12 flex items-center justify-center bg-teal-500/10 rounded-xl mx-auto mb-4">
              <i className="ri-graduation-cap-line text-teal-600 text-xl"></i>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Academic Excellence</h3>
            <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
              This project represents our commitment to leveraging AI and machine learning to address real-world challenges in digital media literacy and misinformation detection.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
              <i className="ri-shield-check-line text-teal-600"></i>
              <span>Department of Information Science & Engineering</span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
