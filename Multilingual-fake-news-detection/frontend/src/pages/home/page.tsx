import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { value: '94,439', label: 'Training Samples' },
    { value: '91.5%', label: 'Test Accuracy' },
    { value: '3', label: 'Input Types' },
    { value: 'ML + LLM + Fusion', label: 'Active Pipeline' },
  ];

  const features = [
    {
      icon: 'ri-file-text-line',
      title: 'Text Verification',
      desc: 'Paste any news content and get instant AI-powered classification using DistilBERT multilingual transformer.',
      color: 'from-teal-500 to-emerald-500',
      bg: 'bg-teal-50',
    },
    {
      icon: 'ri-links-line',
      title: 'URL Verification',
      desc: 'Submit article links for automatic content extraction, NLP cleaning, and comprehensive fake news detection.',
      color: 'from-sky-500 to-cyan-500',
      bg: 'bg-sky-50',
    },
    {
      icon: 'ri-image-2-line',
      title: 'Screenshot Analysis',
      desc: 'Upload images containing news content. OCR extracts text and our AI analyzes it for authenticity.',
      color: 'from-violet-500 to-indigo-500',
      bg: 'bg-violet-50',
    },
    {
      icon: 'ri-translate-2',
      title: 'Multilingual Support',
      desc: 'Language detection and translation are applied before ML scoring for non-English content.',
      color: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50',
    },
    {
      icon: 'ri-flashlight-line',
      title: 'Hybrid Decision Engine',
      desc: 'Combines DistilBERT prediction with LLM reasoning and fuses both signals into one final verdict.',
      color: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-50',
    },
    {
      icon: 'ri-eye-line',
      title: 'Layer Transparency',
      desc: 'Returns layer-wise output (ML score, LLM verdict, fusion confidence) so users can inspect decisions.',
      color: 'from-teal-500 to-cyan-500',
      bg: 'bg-teal-50',
    },
  ];

  const workflow = [
    { step: '01', icon: 'ri-upload-cloud-2-line', title: 'Submit Content', desc: 'Text, URL, or Screenshot' },
    { step: '02', icon: 'ri-cpu-line', title: 'ML Scoring', desc: 'DistilBERT Classification' },
    { step: '03', icon: 'ri-brain-line', title: 'LLM Reasoning', desc: 'Provider-Based Analysis' },
    { step: '04', icon: 'ri-bar-chart-box-line', title: 'Fusion Result', desc: 'Final Verdict + Confidence' },
  ];

  const models = [
    { name: 'DistilBERT Multilingual', accuracy: '91.5%', type: 'ML Layer (Test Accuracy)', badge: 'bg-teal-100 text-teal-700' },
    { name: 'Gemini/OpenAI/Ollama', accuracy: 'Provider-Based', type: 'LLM Layer', badge: 'bg-sky-100 text-sky-700' },
    { name: 'Weighted Fusion Service', accuracy: 'Runtime', type: 'Decision Layer', badge: 'bg-violet-100 text-violet-700' },
    { name: 'MongoDB User Scoping', accuracy: 'Per Account', type: 'Data Layer', badge: 'bg-slate-100 text-slate-700' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg shadow-md">
              <i className="ri-shield-check-fill text-white text-lg"></i>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">TruthGuard <span className="text-teal-600">AI</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 hover:text-teal-600 font-medium transition-colors cursor-pointer">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-600 hover:text-teal-600 font-medium transition-colors cursor-pointer">How It Works</a>
            <a href="#technology" className="text-sm text-slate-600 hover:text-teal-600 font-medium transition-colors cursor-pointer">Technology</a>
            <Link to="/about" className="text-sm text-slate-600 hover:text-teal-600 font-medium transition-colors cursor-pointer">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm text-slate-700 hover:text-teal-600 font-medium transition-colors whitespace-nowrap cursor-pointer">Sign In</Link>
            <Link to="/signup" className="px-5 py-2 bg-teal-600 text-white text-sm rounded-lg font-semibold hover:bg-teal-700 transition-all shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://readdy.ai/api/search-image?query=abstract%20dark%20navy%20blue%20digital%20network%20data%20visualization%20with%20glowing%20nodes%20and%20connections%2C%20futuristic%20technology%20background%2C%20deep%20space%20aesthetic%20with%20subtle%20grid%20lines%20and%20particle%20effects%2C%20professional%20and%20sophisticated&width=1440&height=900&seq=hero-bg-001&orientation=landscape"
            alt="hero background"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-900/60"></div>
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-full text-xs font-semibold mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span>
              AI-Powered Misinformation Detection Platform
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
              Detect Fake News<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                Before It Spreads
              </span>
            </h1>

            <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-2xl">
              Hybrid fake-news detection for text, URLs, and screenshots using DistilBERT + LLM reasoning + fusion scoring. Current recorded model test accuracy is 91.5% on the prepared dataset.
            </p>

            <div className="flex items-center gap-4 mb-16">
              <Link to="/signup" className="px-7 py-3.5 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-400 transition-all shadow-xl shadow-teal-500/30 whitespace-nowrap cursor-pointer text-sm">
                Start Analyzing Free
              </Link>
              <Link to="/login" className="px-7 py-3.5 bg-white/10 text-white border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-all backdrop-blur-sm whitespace-nowrap cursor-pointer text-sm">
                Sign In
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-extrabold text-white mb-1">{s.value}</div>
                  <div className="text-xs text-slate-400 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl font-extrabold text-white mt-3 mb-4">From Input to Insight in Seconds</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">The runtime flow uses ML scoring, LLM reasoning, and fusion to produce a final verdict with confidence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
            {workflow.map((w, i) => (
              <div key={w.step} className="relative flex flex-col items-center text-center px-6">
                {i < workflow.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-px bg-gradient-to-r from-teal-500/50 to-transparent z-0"></div>
                )}
                <div className="relative z-10 w-20 h-20 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-2xl mb-5 shadow-xl">
                  <i className={`${w.icon} text-teal-400 text-3xl`}></i>
                  <span className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-teal-500 text-white text-xs font-bold rounded-full">{w.step}</span>
                </div>
                <h4 className="text-white font-bold mb-2">{w.title}</h4>
                <p className="text-slate-400 text-sm">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Platform Features</span>
            <h2 className="text-4xl font-extrabold text-slate-900 mt-3 mb-4">Everything You Need to Fight Misinformation</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">A complete suite of AI-powered tools to detect, verify, and understand fake news across multiple formats and languages.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${f.color} mb-5 shadow-md`}>
                  <i className={`${f.icon} text-white text-xl`}></i>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Technology Stack</span>
              <h2 className="text-4xl font-extrabold text-slate-900 mt-3 mb-5">State-of-the-Art ML Models</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">Powered by DistilBERT multilingual transformer trained on ISOT, LIAR, FakeNewsNet, and WELFake datasets, then combined with an LLM reasoning layer and fusion scoring.</p>

              <div className="space-y-4">
                {models.map((m) => (
                  <div key={m.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-teal-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-100">
                        <i className="ri-brain-line text-teal-600"></i>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.badge}`}>{m.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-slate-900">{m.accuracy}</div>
                      <div className="text-xs text-slate-400">Accuracy</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <img
                src="https://readdy.ai/api/search-image?query=modern%20AI%20machine%20learning%20dashboard%20interface%20with%20neural%20network%20visualization%2C%20glowing%20data%20nodes%2C%20teal%20and%20dark%20theme%2C%20professional%20technology%20illustration%20with%20charts%20and%20metrics%2C%20clean%20minimal%20design&width=700&height=600&seq=tech-visual-001&orientation=portrait"
                alt="AI Technology"
                className="w-full h-96 object-cover object-top rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-teal-100 rounded-xl">
                    <i className="ri-shield-check-fill text-teal-600 text-xl"></i>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-slate-900">91.5%</div>
                    <div className="text-xs text-slate-500">Recorded Test Accuracy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Get Started Today</span>
          <h2 className="text-4xl font-extrabold text-white mt-3 mb-5">Ready to Combat Misinformation?</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">Built for students, researchers, and teams who need fast, explainable credibility checks across text, URL, and image inputs.</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/signup" className="px-8 py-3.5 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-400 transition-all shadow-xl shadow-teal-500/30 whitespace-nowrap cursor-pointer text-sm">
              Create Free Account
            </Link>
            <Link to="/login" className="px-8 py-3.5 bg-white/10 text-white border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-all whitespace-nowrap cursor-pointer text-sm">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg">
                  <i className="ri-shield-check-fill text-white text-sm"></i>
                </div>
                <span className="text-base font-bold text-white">TruthGuard <span className="text-teal-400">AI</span></span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">Hybrid fake-news detection platform using ML, LLM reasoning, and fusion confidence scoring.</p>
            </div>
            <div>
              <h5 className="text-white font-semibold text-sm mb-4">Platform</h5>
              <ul className="space-y-2.5">
                <li><Link to="/verify-text" className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Text Verification</Link></li>
                <li><Link to="/verify-url" className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">URL Analysis</Link></li>
                <li><Link to="/verify-image" className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Screenshot Check</Link></li>
                <li><Link to="/analytics" className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Analytics</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold text-sm mb-4">Resources</h5>
              <ul className="space-y-2.5">
                <li><Link to="/model-insights" className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Documentation</Link></li>
                <li><Link to="/model-insights" className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">API Reference</Link></li>
                <li><Link to="/model-insights" className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Model Insights</Link></li>
                <li><Link to="/about" className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">About Project</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold text-sm mb-4">Support</h5>
              <ul className="space-y-2.5">
                <li><Link to="/about" className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Help Center</Link></li>
                <li><Link to="/feedback" className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Contact Us</Link></li>
                <li><Link to="/feedback" className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Feedback</Link></li>
                <li><Link to="/about" className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">© 2026 TruthGuard AI. All rights reserved.</p>
            <div className="flex items-center gap-3">
              {['ri-twitter-x-line', 'ri-linkedin-fill', 'ri-github-fill'].map(icon => (
                <a key={icon} href="#" className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-teal-600 rounded-lg transition-colors cursor-pointer">
                  <i className={`${icon} text-white text-sm`}></i>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
