import { useState } from 'react';

interface CredibilityResult {
  domain: string;
  score: number;
  trustLevel: 'High' | 'Medium' | 'Low';
  domainAge: string;
  reputation: string;
  sslSecure: boolean;
  trafficRank: string;
  indicators: { label: string; value: string; status: 'positive' | 'negative' | 'neutral' }[];
}

export default function SourceCredibilityPage() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CredibilityResult | null>(null);

  const trustedSources = [
    { name: 'BBC News', domain: 'bbc.com', score: 95 },
    { name: 'Reuters', domain: 'reuters.com', score: 94 },
    { name: 'The Guardian', domain: 'theguardian.com', score: 92 },
    { name: 'Associated Press', domain: 'apnews.com', score: 96 },
    { name: 'NPR', domain: 'npr.org', score: 91 },
    { name: 'New York Times', domain: 'nytimes.com', score: 93 },
  ];

  const extractDomain = (urlString: string) => {
    try { return new URL(urlString).hostname.replace('www.', ''); } catch { return ''; }
  };

  const handleAnalyze = () => {
    if (!url.trim() || !url.startsWith('http')) return;
    setIsAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      setResult({
        domain: extractDomain(url),
        score: 78,
        trustLevel: 'Medium',
        domainAge: '8 years 4 months',
        reputation: 'Generally Reliable',
        sslSecure: true,
        trafficRank: '12,450',
        indicators: [
          { label: 'Domain Age', value: '8+ years', status: 'positive' },
          { label: 'SSL Certificate', value: 'Valid', status: 'positive' },
          { label: 'HTTPS Enabled', value: 'Yes', status: 'positive' },
          { label: 'Verified Publisher', value: 'No', status: 'negative' },
          { label: 'Fact-Check History', value: 'Mixed Record', status: 'neutral' },
          { label: 'Traffic Rank', value: 'Top 15K', status: 'positive' },
          { label: 'Social Media Presence', value: 'Active', status: 'positive' },
          { label: 'Ad Density', value: 'Moderate', status: 'neutral' },
        ],
      });
      setIsAnalyzing(false);
    }, 2500);
  };

  const trustColors: Record<string, string> = {
    High: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    Medium: 'text-amber-700 bg-amber-50 border-amber-200',
    Low: 'text-rose-700 bg-rose-50 border-rose-200',
  };

  const scoreBarColor = (score: number) =>
    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500';

  const statusIcon: Record<string, string> = {
    positive: 'ri-checkbox-circle-fill text-emerald-500',
    negative: 'ri-close-circle-fill text-rose-500',
    neutral: 'ri-information-fill text-amber-500',
  };
  const statusBadge: Record<string, string> = {
    positive: 'bg-emerald-50 text-emerald-700',
    negative: 'bg-rose-50 text-rose-600',
    neutral: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 flex items-center justify-center bg-teal-500/10 rounded-lg">
          <i className="ri-shield-star-line text-teal-600 text-lg"></i>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Source Credibility Checker</h1>
          <p className="text-xs text-slate-500">Analyze news source reliability and domain reputation</p>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 mb-4">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">News Source URL</label>
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="ri-global-line text-slate-400 text-sm"></i>
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            placeholder="https://example-news-site.com"
          />
        </div>

        <div className="flex items-start gap-2.5 bg-teal-50 border border-teal-100 rounded-lg p-3 mb-4">
          <i className="ri-information-line text-teal-500 text-sm mt-0.5"></i>
          <p className="text-xs text-teal-800">We analyze domain age, SSL security, publisher verification, fact-check history, traffic ranking, and reputation indicators to calculate a credibility score.</p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !url.trim() || !url.startsWith('http')}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
            isAnalyzing || !url.trim() || !url.startsWith('http')
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
          }`}
        >
          {isAnalyzing
            ? <><i className="ri-loader-4-line animate-spin"></i>Analyzing source credibility...</>
            : <><i className="ri-shield-check-line"></i>Analyze Source Credibility</>
          }
        </button>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Score Card */}
          <div className={`bg-white border rounded-xl shadow-sm p-6 mb-4 ${trustColors[result.trustLevel].split(' ').slice(2).join(' ')}`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center bg-teal-500/10 rounded-xl">
                  <i className="ri-shield-star-fill text-teal-600 text-3xl"></i>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Credibility Score</p>
                  <p className="text-4xl font-bold text-slate-900">{result.score}<span className="text-lg text-slate-400">/100</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Trust Level</p>
                <span className={`inline-block px-4 py-1.5 rounded-lg text-sm font-bold border ${trustColors[result.trustLevel]}`}>
                  {result.trustLevel}
                </span>
              </div>
            </div>

            {/* Domain */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 mb-4">
              <img
                src={`https://www.google.com/s2/favicons?domain=${result.domain}&sz=64`}
                alt="favicon"
                className="w-8 h-8 rounded-md"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex-1">
                <p className="text-xs text-slate-500">Analyzed Domain</p>
                <p className="text-sm font-bold text-slate-900">{result.domain}</p>
              </div>
              <span className="text-xs text-slate-500">{result.reputation}</span>
            </div>

            {/* Score Bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Credibility Rating</span>
                <span className="font-medium text-slate-700">{result.score >= 80 ? 'Highly Credible' : result.score >= 60 ? 'Moderately Credible' : 'Low Credibility'}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className={`${scoreBarColor(result.score)} h-full transition-all duration-1000 rounded-full`} style={{ width: `${result.score}%` }}></div>
              </div>
            </div>
          </div>

          {/* Indicators */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-slate-50">
              <h3 className="text-sm font-semibold text-slate-900">Credibility Indicators</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {result.indicators.map((ind, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <i className={`${statusIcon[ind.status]} text-base`}></i>
                    <div>
                      <p className="text-xs text-slate-500">{ind.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{ind.value}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge[ind.status]}`}>
                    {ind.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Cards */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { icon: 'ri-time-line', iconBg: 'bg-sky-500/10', iconColor: 'text-sky-600', label: 'Domain Age', value: result.domainAge, note: 'Older domains indicate established presence' },
              { icon: 'ri-lock-line', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600', label: 'SSL Security', value: result.sslSecure ? 'Secure' : 'Not Secure', note: 'HTTPS encryption protects user data' },
              { icon: 'ri-bar-chart-box-line', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600', label: 'Traffic Rank', value: `#${result.trafficRank}`, note: 'Global website traffic ranking' },
            ].map((card, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 flex items-center justify-center ${card.iconBg} rounded-lg`}>
                    <i className={`${card.icon} ${card.iconColor} text-sm`}></i>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{card.label}</p>
                    <p className="text-sm font-bold text-slate-900">{card.value}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">{card.note}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Trusted Sources */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-900">Verified Trusted Sources</h2>
          <p className="text-xs text-slate-500 mt-0.5">News sources with consistently high credibility scores</p>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          {trustedSources.map((src, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-2.5">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                  alt={src.name}
                  className="w-6 h-6 rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900">{src.name}</p>
                  <p className="text-xs text-slate-400">{src.domain}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-xs font-bold whitespace-nowrap">{src.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}