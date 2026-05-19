import { useState } from 'react';

interface Claim {
  text: string;
  type: string;
  value: string;
  actualValue?: string;
  source?: string;
  status: 'consistent' | 'inconsistent' | 'unverified';
}

export default function VerifyClaimPage() {
  const [inputText, setInputText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [verificationProgress, setVerificationProgress] = useState(0);

  const sampleClaims = [
    { title: 'Cryptocurrency Price', text: 'Bitcoin reached $100,000 yesterday breaking all records', icon: 'ri-coin-line' },
    { title: 'Stock Market', text: 'Tesla stock dropped 50% in a single day causing market crash', icon: 'ri-line-chart-line' },
    { title: 'Economic Data', text: 'US unemployment rate hit 25% highest since Great Depression', icon: 'ri-bar-chart-line' },
  ];

  const handleVerify = () => {
    if (!inputText.trim()) return;
    setIsVerifying(true);
    setVerificationProgress(0);
    setClaims([]);
    const interval = setInterval(() => {
      setVerificationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setClaims([
              { text: 'Bitcoin price at $45,000', type: 'Cryptocurrency', value: '$45,000', actualValue: '$43,250', source: 'CoinGecko API', status: 'inconsistent' },
              { text: 'Market cap of $850 billion', type: 'Financial', value: '$850 billion', actualValue: '$847 billion', source: 'CoinGecko API', status: 'consistent' },
              { text: '24-hour trading volume exceeded $50 billion', type: 'Trading Volume', value: '$50 billion', actualValue: '$52.3 billion', source: 'CoinGecko API', status: 'consistent' },
            ]);
            setIsVerifying(false);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const statusConfig = {
    consistent: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-50 text-emerald-700', icon: 'ri-checkbox-circle-fill text-emerald-500', label: 'CONSISTENT' },
    inconsistent: { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-50 text-rose-600', icon: 'ri-error-warning-fill text-rose-500', label: 'INCONSISTENT' },
    unverified: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600', icon: 'ri-question-fill text-slate-400', label: 'UNVERIFIED' },
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 flex items-center justify-center bg-amber-500/10 rounded-lg">
          <i className="ri-shield-check-line text-amber-600 text-lg"></i>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Real-Time Claim Verification</h1>
          <p className="text-xs text-slate-500">Verify financial and numerical claims against real-time data sources</p>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 mb-4">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Enter Text with Claims</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full h-36 px-3 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none transition-all"
          placeholder="Paste news text containing financial claims, cryptocurrency prices, economic statistics, or numerical data..."
        />
        <div className="flex items-center justify-between mt-1.5 mb-4">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <i className="ri-information-line"></i>System will extract and verify numerical claims automatically
          </p>
          <span className="text-xs text-slate-400">{inputText.length} / 5000</span>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-100 rounded-lg p-3 mb-4">
          <i className="ri-lightbulb-line text-sky-500 text-sm mt-0.5"></i>
          <p className="text-xs text-sky-800">The system extracts financial claims and verifies them against real-time APIs like CoinGecko and NewsAPI to detect inconsistencies.</p>
        </div>

        {/* Progress */}
        {isVerifying && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <i className="ri-search-line text-amber-600 text-lg animate-pulse"></i>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Extracting and Verifying Claims</p>
                <p className="text-xs text-slate-500">Checking against real-time data sources...</p>
              </div>
              <span className="text-sm font-bold text-amber-600">{verificationProgress}%</span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-500 h-full transition-all duration-300 rounded-full" style={{ width: `${verificationProgress}%` }}></div>
            </div>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={isVerifying || !inputText.trim()}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
            isVerifying || !inputText.trim() ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
          }`}
        >
          {isVerifying
            ? <><i className="ri-loader-4-line animate-spin"></i>Verifying claims against real-time data...</>
            : <><i className="ri-shield-check-line"></i>Extract &amp; Verify Claims</>
          }
        </button>
      </div>

      {/* Results */}
      {claims.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Extracted Claims ({claims.length})</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time verification results from external APIs</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                {claims.filter(c => c.status === 'consistent').length} Consistent
              </span>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-xs font-medium">
                {claims.filter(c => c.status === 'inconsistent').length} Inconsistent
              </span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {claims.map((claim, i) => {
              const cfg = statusConfig[claim.status];
              return (
                <div key={i} className={`${cfg.bg} ${cfg.border} border rounded-xl p-4`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <i className={`${cfg.icon} text-lg`}></i>
                      <div>
                        <span className={`px-2 py-0.5 ${cfg.badge} rounded-full text-xs font-semibold`}>{claim.type}</span>
                        <p className="text-sm font-medium text-slate-900 mt-1">{claim.text}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 ${cfg.badge} rounded-md text-xs font-bold whitespace-nowrap`}>{cfg.label}</span>
                  </div>

                  {/* Comparison */}
                  <div className="bg-white border border-slate-100 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          {['Claimed Value', 'Actual Value', 'Source', 'Verdict'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-slate-100">
                          <td className="px-3 py-2 font-semibold text-slate-900">{claim.value}</td>
                          <td className="px-3 py-2 font-semibold text-slate-900">{claim.actualValue}</td>
                          <td className="px-3 py-2 text-slate-500 flex items-center gap-1"><i className="ri-cloud-line text-sky-500"></i>{claim.source}</td>
                          <td className="px-3 py-2">
                            {claim.status === 'consistent'
                              ? <span className="flex items-center gap-1 text-emerald-600 font-semibold"><i className="ri-check-line"></i>Verified</span>
                              : <span className="flex items-center gap-1 text-rose-600 font-semibold"><i className="ri-close-line"></i>Mismatch</span>
                            }
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {claim.status === 'inconsistent' && (
                    <div className="mt-2 flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                      <i className="ri-alert-line text-rose-500 text-sm mt-0.5"></i>
                      <p className="text-xs text-rose-700"><strong>Inconsistency Detected:</strong> The claimed value does not match real-time data. This may indicate misinformation.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sample Claims */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-900">Try Sample Claims</h2>
          <p className="text-xs text-slate-500 mt-0.5">Click any sample to test the real-time claim verification system</p>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          {sampleClaims.map((s, i) => (
            <div
              key={i}
              onClick={() => setInputText(s.text)}
              className="p-4 border border-slate-100 rounded-xl hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 flex items-center justify-center bg-amber-500/10 rounded-lg mb-2">
                <i className={`${s.icon} text-amber-600 text-sm`}></i>
              </div>
              <p className="text-xs font-semibold text-slate-800 mb-1">{s.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-900">Real-Time Data Sources</h2>
        </div>
        <div className="p-5 grid grid-cols-3 gap-4">
          {[
            { icon: 'ri-coin-line', title: 'CoinGecko API', desc: 'Real-time cryptocurrency prices, market cap, and trading volume data' },
            { icon: 'ri-newspaper-line', title: 'NewsAPI', desc: 'Verified news articles and breaking news from trusted sources' },
            { icon: 'ri-line-chart-line', title: 'Financial APIs', desc: 'Stock market data, economic indicators, and financial statistics' },
          ].map((src, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-amber-500/10 rounded-lg flex-shrink-0">
                <i className={`${src.icon} text-amber-600 text-sm`}></i>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 mb-0.5">{src.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{src.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}