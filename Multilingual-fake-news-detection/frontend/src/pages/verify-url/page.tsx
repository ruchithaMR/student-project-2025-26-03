import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FakeNewsAPI from '../../services/api';

export default function VerifyURLPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [domainInfo, setDomainInfo] = useState<{ domain: string; favicon: string } | null>(null);

  const sampleURLs = [
    { category: 'News', url: 'https://www.bbc.com/news/technology', icon: 'ri-newspaper-line', color: 'teal' },
    { category: 'Finance', url: 'https://www.bbc.com/news/business', icon: 'ri-line-chart-line', color: 'sky' },
    { category: 'Health', url: 'https://www.who.int/news', icon: 'ri-heart-pulse-line', color: 'rose' },
    { category: 'Technology', url: 'https://techcrunch.com', icon: 'ri-computer-line', color: 'violet' },
  ];

  const features = [
    { icon: 'ri-download-line', title: 'Auto Content Extraction', desc: 'Automatically scrapes and extracts article text from any URL' },
    { icon: 'ri-code-s-slash-line', title: 'HTML Cleaning', desc: 'Removes HTML tags, ads, and irrelevant content automatically' },
    { icon: 'ri-shield-check-line', title: 'Source Credibility', desc: 'Analyzes domain reputation and credibility score' },
  ];

  const extractDomain = (urlString: string) => {
    try { return new URL(urlString).hostname.replace('www.', ''); } catch { return ''; }
  };

  const handleURLChange = (value: string) => {
    setUrl(value);
    const domain = extractDomain(value);
    setDomainInfo(domain ? { domain, favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64` } : null);
  };

  const handleFetch = async () => {
    if (!url.trim() || !url.startsWith('http')) return;
    
    setIsFetching(true);
    setError('');
    
    try {
      // Call the actual API
      const result = await FakeNewsAPI.predictURL(url, true);
      
      // Store result in sessionStorage to pass to results page
      sessionStorage.setItem('analysisResult', JSON.stringify({
        ...result,
        analyzedText: result.text || url,
        type: 'url'
      }));
      
      // Navigate to results page
      navigate('/results?type=url');
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch and analyze URL. Please try again.');
      console.error('URL analysis error:', err);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-sky-500/10 rounded-lg flex-shrink-0">
          <i className="ri-link text-sky-600 text-base sm:text-lg"></i>
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-slate-900">URL Verification</h1>
          <p className="text-xs text-slate-500 truncate">Submit article links for automatic content extraction and analysis</p>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 sm:p-6 mb-4">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Article URL</label>
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="ri-link text-slate-400 text-sm"></i>
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => handleURLChange(e.target.value)}
            className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            placeholder="https://example.com/news-article"
          />
        </div>

        {/* Domain Preview */}
        {domainInfo && (
          <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-lg p-3 mb-4">
            <img
              src={domainInfo.favicon}
              alt="favicon"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">Domain detected</p>
              <p className="text-sm font-semibold text-teal-700 truncate">{domainInfo.domain}</p>
            </div>
            <i className="ri-checkbox-circle-fill text-teal-500 text-lg flex-shrink-0"></i>
          </div>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 sm:gap-2.5 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
          <i className="ri-information-line text-amber-500 text-sm mt-0.5 flex-shrink-0"></i>
          <p className="text-xs text-amber-800">The system will fetch the article, extract main content, clean HTML tags, and analyze using our AI models. This takes 5–10 seconds.</p>
        </div>

        {/* Button */}
        {error && (
          <div className="mb-3 flex items-start gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-rose-50 border border-rose-200 rounded-lg">
            <i className="ri-error-warning-line text-rose-500 text-sm mt-0.5 flex-shrink-0"></i>
            <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
          </div>
        )}
        <button
          onClick={handleFetch}
          disabled={isFetching || !url.trim() || !url.startsWith('http')}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
            isFetching || !url.trim() || !url.startsWith('http')
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
          }`}
        >
          {isFetching ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i>
              <span className="hidden sm:inline">Fetching and analyzing article...</span>
              <span className="sm:hidden">Analyzing...</span>
            </>
          ) : (
            <>
              <i className="ri-download-cloud-line"></i>
              <span className="hidden sm:inline">Fetch &amp; Analyze Article</span>
              <span className="sm:hidden">Analyze Article</span>
            </>
          )}
        </button>
      </div>

      {/* Sample URLs */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-900">Try Sample URLs</h2>
          <p className="text-xs text-slate-500 mt-0.5">Click any sample to test the verification system</p>
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sampleURLs.map((s, i) => (
            <div
              key={i}
              onClick={() => handleURLChange(s.url)}
              className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer group"
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-${s.color}-500/10 rounded-lg flex-shrink-0`}>
                <i className={`${s.icon} text-${s.color}-600 text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">{s.category}</p>
                <p className="text-xs text-slate-400 truncate">{s.url}</p>
              </div>
              <i className="ri-arrow-right-line text-slate-300 group-hover:text-teal-500 transition-colors text-sm flex-shrink-0"></i>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-900">URL Verification Features</h2>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-teal-500/10 rounded-lg flex-shrink-0">
                <i className={`${f.icon} text-teal-600 text-sm`}></i>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 mb-0.5">{f.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}