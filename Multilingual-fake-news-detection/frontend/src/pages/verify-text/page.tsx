import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FakeNewsAPI from '../../services/api';

const sampleInputs = [
  {
    label: 'Financial Misinfo',
    tag: 'Likely Fake',
    tagColor: 'bg-rose-50 text-rose-600',
    icon: 'ri-money-dollar-circle-line',
    iconBg: 'bg-rose-50 text-rose-500',
    text: 'Bitcoin has crashed to $0 and all cryptocurrency exchanges have shut down permanently. Investors have lost everything overnight.',
  },
  {
    label: 'Health Misinfo',
    tag: 'Likely Fake',
    tagColor: 'bg-rose-50 text-rose-600',
    icon: 'ri-heart-pulse-line',
    iconBg: 'bg-orange-50 text-orange-500',
    text: 'Scientists have discovered that drinking lemon water can cure all types of cancer within 30 days without any medical treatment.',
  },
  {
    label: 'Political Misinfo',
    tag: 'Likely Fake',
    tagColor: 'bg-rose-50 text-rose-600',
    icon: 'ri-government-line',
    iconBg: 'bg-violet-50 text-violet-500',
    text: 'Breaking: Government announces mandatory microchip implants for all citizens starting next month to track their movements.',
  },
  {
    label: 'Legitimate News',
    tag: 'Likely Real',
    tagColor: 'bg-emerald-50 text-emerald-600',
    icon: 'ri-newspaper-line',
    iconBg: 'bg-teal-50 text-teal-500',
    text: 'The World Health Organization released new guidelines today recommending increased physical activity for adults to improve cardiovascular health.',
  },
];

export default function VerifyTextPage() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedLang, setDetectedLang] = useState('');
  const [error, setError] = useState('');
  const maxChars = 5000;

  const normalizeResultForUI = (apiResult: any) => {
    const confidenceValue = Number(apiResult?.confidence ?? 0);
    const confidencePercent = confidenceValue <= 1 ? confidenceValue * 100 : confidenceValue;
    const mlConfidenceRaw = Number(apiResult?.ml_prediction?.confidence ?? 0);
    const mlConfidencePercent = mlConfidenceRaw <= 1 ? mlConfidenceRaw * 100 : mlConfidenceRaw;

    return {
      ...apiResult,
      prediction: String(apiResult?.prediction || '').toUpperCase(),
      confidence: Number(confidencePercent.toFixed(1)),
      riskLevel: apiResult?.riskLevel || apiResult?.risk_level || 'Medium',
      ml_layer: apiResult?.ml_prediction
        ? {
            prediction: String(apiResult.ml_prediction.prediction || '').toUpperCase(),
            confidence: Number(mlConfidencePercent.toFixed(1)),
            probabilities: apiResult?.ml_prediction?.probabilities || null,
          }
        : null,
    };
  };

  const handleAnalyze = async () => {
    if (text.trim().length < 50) return;
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      // Call the actual API
      const result = await FakeNewsAPI.predictText(text, true);
      const uiResult = normalizeResultForUI(result);
      
      // Set detected language
      setDetectedLang(uiResult.language || 'English');
      
      // Store result in sessionStorage to pass to results page
      sessionStorage.setItem('analysisResult', JSON.stringify({
        ...uiResult,
        analyzedText: text,
        type: 'text'
      }));
      
      // Navigate to results page
      navigate('/results?type=text');
      
    } catch (err: any) {
      setError(err.message || 'Failed to analyze text. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pct = Math.min((text.length / maxChars) * 100, 100);

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-7">
        <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-md flex-shrink-0">
          <i className="ri-file-text-line text-white text-base sm:text-lg"></i>
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Text Verification</h1>
          <p className="text-slate-500 text-xs sm:text-sm truncate">Paste news content for AI-powered fake news detection</p>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-4 sm:mb-5">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">News Content</label>
            <div className="flex items-center gap-2 sm:gap-3">
              {detectedLang && (
                <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold">
                  <i className="ri-translate-2 text-xs"></i>
                  <span className="hidden sm:inline">{detectedLang}</span>
                  <span className="sm:hidden">{detectedLang.slice(0, 2)}</span>
                </span>
              )}
              <button
                onClick={() => { setText(''); setDetectedLang(''); }}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <i className="ri-delete-bin-6-line"></i> <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= maxChars) {
                setText(e.target.value);
                setDetectedLang('');
              }
            }}
            rows={8}
            className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none transition-all focus:bg-white leading-relaxed"
            placeholder="Paste the news article or content you want to verify here…&#10;&#10;The system will analyze it using DistilBERT multilingual transformer, NLP preprocessing, and real-time fact-checking APIs to detect potential misinformation."
          />

          {/* Progress bar */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex-1 mr-3 sm:mr-4">
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${pct > 90 ? 'bg-rose-400' : 'bg-teal-400'}`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${pct > 90 ? 'text-rose-500' : 'text-slate-400'}`}>
              {text.length} / {maxChars}
            </span>
          </div>
        </div>

        {/* Privacy note */}
        <div className="mx-4 sm:mx-6 mb-4 sm:mb-5 flex items-start gap-2 sm:gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 bg-sky-50 border border-sky-100 rounded-lg">
          <i className="ri-shield-keyhole-line text-sky-500 text-sm mt-0.5 flex-shrink-0"></i>
          <p className="text-xs text-sky-700 leading-relaxed">
            <strong>Privacy & Security:</strong> Your content is analyzed securely and never stored permanently. All transmissions are encrypted end-to-end.
          </p>
        </div>

        {/* Analyze Button */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {error && (
            <div className="mb-3 flex items-start gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-rose-50 border border-rose-200 rounded-lg">
              <i className="ri-error-warning-line text-rose-500 text-sm mt-0.5 flex-shrink-0"></i>
              <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
            </div>
          )}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || text.trim().length < 50}
            className={`w-full py-3 sm:py-3.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 sm:gap-2.5 ${
              isAnalyzing || text.trim().length < 50
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20 hover:shadow-xl'
            }`}
          >
            {isAnalyzing ? (
              <>
                <i className="ri-loader-4-line animate-spin text-base"></i>
                <span className="hidden sm:inline">Analyzing with DistilBERT — please wait…</span>
                <span className="sm:hidden">Analyzing…</span>
              </>
            ) : (
              <>
                <i className="ri-search-eye-line text-base"></i>
                Analyze Content
                {text.trim().length >= 50 && (
                  <span className="hidden sm:inline ml-1 px-2 py-0.5 bg-white/20 rounded text-xs font-semibold">
                    {text.trim().split(/\s+/).length} words
                  </span>
                )}
              </>
            )}
          </button>
          {text.trim().length > 0 && text.trim().length < 50 && (
            <p className="text-center text-xs text-slate-400 mt-2">
              Enter at least 50 characters for accurate analysis ({50 - text.trim().length} more needed)
            </p>
          )}
        </div>
      </div>

      {/* Sample Inputs */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-4 sm:mb-5">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-50">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <i className="ri-lightbulb-flash-line text-amber-500"></i>
            Try Sample Inputs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Click any sample to load it into the editor</p>
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sampleInputs.map((s) => (
            <button
              key={s.label}
              onClick={() => { setText(s.text); setDetectedLang(''); }}
              className="text-left p-3 sm:p-4 border border-slate-100 rounded-lg hover:border-teal-300 hover:bg-teal-50/40 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg ${s.iconBg}`}>
                    <i className={`${s.icon} text-xs sm:text-sm`}></i>
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700 transition-colors">{s.label}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.tagColor}`}>{s.tag}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{s.text}</p>
            </button>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-50">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <i className="ri-cpu-line text-teal-500"></i>
            How Text Verification Works
          </h2>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: 'ri-file-text-line', step: '01', title: 'Text Input', desc: 'Paste up to 5,000 characters' },
            { icon: 'ri-translate-2', step: '02', title: 'Language Detection', desc: 'Auto-detect EN / HI / KN' },
            { icon: 'ri-brain-line', step: '03', title: 'AI Analysis', desc: 'DistilBERT + NLP pipeline' },
            { icon: 'ri-shield-check-line', step: '04', title: 'Results', desc: 'Fake/Real + confidence score' },
          ].map((w) => (
            <div key={w.step} className="text-center">
              <div className="relative inline-flex mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl">
                  <i className={`${w.icon} text-teal-600 text-lg sm:text-xl`}></i>
                </div>
                <span className="absolute -top-1 sm:-top-1.5 -right-1 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center bg-teal-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full">{w.step}</span>
              </div>
              <p className="text-xs font-bold text-slate-800 mb-1">{w.title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}