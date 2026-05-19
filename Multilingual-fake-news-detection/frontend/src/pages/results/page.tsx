import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'text';

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  useEffect(() => {
    // Get result from sessionStorage
    const storedResult = sessionStorage.getItem('analysisResult');
    if (storedResult) {
      const parsedResult = JSON.parse(storedResult);
      setResult(parsedResult);
      setLoading(false);
    } else {
      // If no result, redirect back
      navigate('/verify-text');
    }
  }, [navigate]);

  const handleSaveToHistory = () => {
    // Results are automatically saved to MongoDB on backend
    // Show success message and navigate to history
    setShowSaveMessage(true);
    setTimeout(() => {
      navigate('/history');
    }, 1500);
  };

  if (loading || !result) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <i className="ri-loader-4-line animate-spin text-4xl text-teal-500 mb-3"></i>
          <p className="text-slate-500">Loading results...</p>
        </div>
      </div>
    );
  }

  const typeConfig: Record<string, { icon: string; iconBg: string; label: string; labelColor: string; subtitle: string; backPath: string }> = {
    text: {
      icon: 'ri-file-text-line',
      iconBg: 'from-violet-500 to-indigo-500',
      label: 'Text',
      labelColor: 'bg-violet-100 text-violet-700 border-violet-200',
      subtitle: 'AI-powered text analysis with explainable insights',
      backPath: '/verify-text',
    },
    url: {
      icon: 'ri-link',
      iconBg: 'from-sky-500 to-teal-500',
      label: 'URL',
      labelColor: 'bg-sky-100 text-sky-700 border-sky-200',
      subtitle: 'URL content extracted and analyzed for misinformation',
      backPath: '/verify-url',
    },
    image: {
      icon: 'ri-image-line',
      iconBg: 'from-violet-500 to-pink-500',
      label: 'Image',
      labelColor: 'bg-pink-100 text-pink-700 border-pink-200',
      subtitle: 'OCR-extracted text analyzed for fake news detection',
      backPath: '/verify-image',
    },
  };

  const config = typeConfig[result?.type || type] ?? typeConfig.text;
  const isFake = String(result?.prediction || '').toUpperCase() === 'FAKE';
  const rawConfidence = Number(result?.confidence ?? 0);
  const normalizedConfidence = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
  const mlConfidence = Number(result?.ml_prediction?.confidence ?? 0);
  const fallbackMlConfidence = mlConfidence <= 1 ? mlConfidence * 100 : mlConfidence;
  const displayConfidence = Number(
    (normalizedConfidence > 0 ? normalizedConfidence : fallbackMlConfidence).toFixed(1)
  );
  const displayRiskLevel = result?.riskLevel || result?.risk_level || 'Medium';
  const llmLayerRaw = result?.openai_layer || result?.llm_layer || null;
  const llmPredictionNormalized = String(llmLayerRaw?.prediction || '').trim().toLowerCase();
  const hasValidLlmDecision = Boolean(llmLayerRaw?.used) && ['real', 'fake'].includes(llmPredictionNormalized);
  const llmProvider = String(
    hasValidLlmDecision ? (llmLayerRaw?.provider || 'llm') : 'llm'
  ).toUpperCase();
  const llmModel = hasValidLlmDecision ? (llmLayerRaw?.model || 'unknown-model') : '';
  const llmPrediction = hasValidLlmDecision
    ? (llmPredictionNormalized === 'real' ? 'Real' : 'Fake')
    : 'Unknown';
  const llmConfidence = Number(hasValidLlmDecision ? (llmLayerRaw?.confidence ?? 0) : 0);
  const llmReasoning = hasValidLlmDecision
    ? (
        llmLayerRaw?.reasoning || (
          llmPredictionNormalized === 'fake'
            ? 'The AI model marked this as fake because the content appears unreliable, non-verifiable, or inconsistent with trustworthy reporting patterns.'
            : 'The AI model marked this as real because the content appears coherent and does not show strong misinformation patterns.'
        )
      )
    : '';
  const llmSignals = hasValidLlmDecision && Array.isArray(llmLayerRaw?.signals) ? llmLayerRaw.signals : [];
  const llmError = String(llmLayerRaw?.error || '');
  const llmIsFake = llmPredictionNormalized === 'fake';
  const fusionExplanationText = String(result?.fusion_explanation || '')
    .replace(/OPENAI LLM:/gi, `${llmProvider} LLM:`)
    .replace(/OpenAI Multilingual Check/gi, `${llmProvider} LLM Check`);
  const mlProbabilities = result?.ml_layer?.probabilities || {};
  const mlFakeProb = Number(
    mlProbabilities?.Fake ?? mlProbabilities?.FAKE ?? mlProbabilities?.fake ?? 0
  );
  const mlRealProb = Number(
    mlProbabilities?.Real ?? mlProbabilities?.REAL ?? mlProbabilities?.real ?? 0
  );

  const highlightText = (text: string) => {
    if (!result?.suspiciousKeywords) return text;
    let out = text;
    const sorted = [...result.suspiciousKeywords].sort((a: any, b: any) => b.word.length - a.word.length);
    sorted.forEach((kw: any) => {
      const re = new RegExp(`(${kw.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      out = out.replace(re, '<mark class="bg-rose-200 text-rose-900 px-0.5 rounded font-semibold">$1</mark>');
    });
    return out;
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(config.backPath)}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium mb-4 sm:mb-6 cursor-pointer whitespace-nowrap transition-colors"
      >
        <i className="ri-arrow-left-line"></i>
        Back to Verification
      </button>

      {/* Page Title */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-br ${config.iconBg} rounded-xl shadow-md flex-shrink-0`}>
          <i className={`${config.icon} text-white text-base sm:text-lg`}></i>
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Analysis Results</h1>
          <p className="text-slate-500 text-xs sm:text-sm truncate">{config.subtitle}</p>
        </div>
      </div>

      {/* Main Verdict Card */}
      <div className={`rounded-xl border-2 p-4 sm:p-6 mb-4 sm:mb-5 ${isFake ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl shadow-lg flex-shrink-0 ${isFake ? 'bg-rose-500' : 'bg-emerald-500'}`}>
              <i className={`${isFake ? 'ri-close-circle-fill' : 'ri-checkbox-circle-fill'} text-white text-2xl sm:text-3xl`}></i>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Prediction Result</p>
              <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isFake ? 'text-rose-600' : 'text-emerald-600'}`}>
                {result.prediction} News
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Source Type Badge */}
            <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold shadow-sm border ${config.labelColor}`}>
              <i className={`${config.icon}`}></i>
              {config.label}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-full text-xs font-semibold text-slate-700 shadow-sm border border-slate-100">
              <i className="ri-translate-2 text-teal-500"></i>
              <span className="hidden sm:inline">{result.language}</span>
              <span className="sm:hidden">{result.language.slice(0, 2)}</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-full text-xs font-semibold text-slate-700 shadow-sm border border-slate-100">
              <i className="ri-brain-line text-violet-500"></i>
              <span className="hidden sm:inline">{result.model || 'DistilBERT Multilingual'}</span>
              <span className="sm:hidden">DistilBERT</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-full text-xs font-semibold text-slate-500 shadow-sm border border-slate-100">
              <i className="ri-time-line"></i>
              {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Confidence + Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
        {/* Confidence */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-sky-50 rounded-lg flex-shrink-0">
              <i className="ri-percent-line text-sky-600 text-sm sm:text-base"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Confidence Score</h3>
              <p className="text-xs text-slate-400">Model prediction certainty</p>
            </div>
          </div>
          <div className="flex items-end justify-between mb-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">{displayConfidence}%</span>
            <span className="px-2 sm:px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full whitespace-nowrap">High Confidence</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-teal-500 rounded-full transition-all duration-1000"
              style={{ width: `${displayConfidence}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            Based on linguistic patterns, sentiment analysis, and trained data from 5 benchmark datasets.
          </p>
        </div>

        {/* Risk Level */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-rose-50 rounded-lg flex-shrink-0">
              <i className="ri-alert-line text-rose-500 text-sm sm:text-base"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Risk Level</h3>
              <p className="text-xs text-slate-400">Misinformation severity</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-100 border border-rose-200 text-rose-700 text-lg sm:text-xl font-extrabold rounded-lg whitespace-nowrap">
              {displayRiskLevel} Risk
            </span>
          </div>
          <div className="relative h-2.5 rounded-full overflow-hidden mb-3">
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-emerald-300"></div>
              <div className="flex-1 bg-amber-300"></div>
              <div className="flex-1 bg-rose-400"></div>
            </div>
            <div
              className="absolute top-0 bottom-0 w-1 bg-slate-900 rounded-full"
              style={{ left: displayRiskLevel === 'Low' ? '16%' : displayRiskLevel === 'Medium' ? '50%' : '84%' }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Low</span><span>Medium</span><span>High</span>
          </div>
          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            This content shows strong indicators of misinformation. Treat with extreme caution.
          </p>
        </div>
      </div>

      {/* Explainable AI */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-4 sm:mb-5">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-50 flex items-center gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-violet-50 rounded-lg flex-shrink-0">
            <i className="ri-eye-line text-violet-600 text-xs sm:text-sm"></i>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">Explainable AI - Why This is {result.prediction}</h3>
            <p className="text-xs text-slate-400 truncate">Detailed analysis from 4-layer hybrid intelligence system</p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* 1. ASSESSMENT SUMMARY */}
          {result.explanation?.assessment && (
            <div className={`p-4 rounded-lg border-l-4 ${isFake ? 'bg-rose-50 border-rose-500' : 'bg-emerald-50 border-emerald-500'}`}>
              <div className="flex items-start gap-3">
                <i className={`${isFake ? 'ri-error-warning-fill text-rose-500' : 'ri-checkbox-circle-fill text-emerald-500'} text-xl flex-shrink-0 mt-0.5`}></i>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Overall Assessment</p>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">{result.explanation.assessment}</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. HOW WE DETECTED IT - Layer Analysis */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <i className="ri-shield-check-line text-violet-600"></i>
              <h4 className="text-sm font-bold text-slate-900">Detection Layers Analysis</h4>
            </div>
            
            {/* ML Layer */}
            {result.ml_layer && (
              <div className="mb-3 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-brain-line text-indigo-600"></i>
                  <p className="text-xs font-bold text-indigo-900 uppercase">1. Machine Learning Analysis</p>
                </div>
                <p className="text-sm text-slate-700 mb-2">
                  <strong>Model:</strong> Fine-tuned DistilBERT (Multilingual) detected <strong className={isFake ? 'text-rose-600' : 'text-emerald-600'}>{result.ml_layer.prediction.toUpperCase()}</strong> with {result.ml_layer.confidence.toFixed(1)}% confidence
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-indigo-100">
                    <span className="text-slate-500">Fake Probability:</span>
                    <span className="ml-1 font-bold text-rose-600">{mlFakeProb.toFixed(1)}%</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-100">
                    <span className="text-slate-500">Real Probability:</span>
                    <span className="ml-1 font-bold text-emerald-600">{mlRealProb.toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2 italic">
                  Analysis based on linguistic patterns, writing style, and 5 benchmark training datasets (WELFake, ISOT, LIAR, FakeNewsNet, PolitiFact)
                </p>
              </div>
            )}

            {/* Knowledge Layer */}
            {result.knowledge_layer && result.knowledge_layer.impossible_claims && result.knowledge_layer.impossible_claims.length > 0 && (
              <div className="mb-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-lightbulb-line text-amber-600"></i>
                  <p className="text-xs font-bold text-amber-900 uppercase">2. Knowledge-Based Detection</p>
                </div>
                <p className="text-sm text-slate-700 mb-2">
                  <strong>{result.knowledge_layer.impossible_claims.length} impossibility pattern(s) detected</strong> across medical, financial, and scientific domains:
                </p>
                <div className="space-y-2">
                  {result.knowledge_layer.impossible_claims.map((claim: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded border border-amber-100">
                      <p className="text-sm font-semibold text-rose-600 mb-1">❌ {claim.category}</p>
                      <p className="text-xs text-slate-700 mb-1">{claim.claim}</p>
                      <p className="text-xs text-slate-500 italic">Why impossible: {claim.why_impossible}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Verification Layer */}
            {(result.verification?.verified || result.api_layer?.verified) && (
              <div className="mb-3 p-4 bg-sky-50 border border-sky-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-cloud-line text-sky-600"></i>
                  <p className="text-xs font-bold text-sky-900 uppercase">3. Real-Time API Verification</p>
                </div>
                {result.verification?.verifications && result.verification.verifications.map((v: any, i: number) => (
                  <div key={i} className="mb-2 bg-white p-3 rounded border border-sky-100">
                    <p className="text-sm font-bold text-slate-900 mb-1">{v.cryptocurrency} Price Check</p>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-slate-500">Claimed Price:</span>
                        <span className="ml-1 font-bold text-rose-600">${v.claimed_price?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Actual Price:</span>
                        <span className="ml-1 font-bold text-emerald-600">${v.actual_price?.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{v.message}</p>
                  </div>
                ))}
                {result.news_verification?.total_articles_found !== undefined && (
                  <div className="bg-white p-3 rounded border border-sky-100">
                    <p className="text-sm font-semibold text-slate-900 mb-1">NewsAPI Cross-Reference</p>
                    <p className="text-xs text-slate-700">
                      {result.news_verification.total_articles_found > 0 
                        ? `Found ${result.news_verification.total_articles_found} matching articles from trusted sources`
                        : '❌ No matching articles found in 100+ trusted news sources (AP, Reuters, BBC, CNN, etc.)'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fusion Layer */}
            {hasValidLlmDecision && (
              <div className="mb-3 p-4 bg-cyan-50 border border-cyan-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-robot-2-line text-cyan-700"></i>
                  <p className="text-xs font-bold text-cyan-900 uppercase">AI Reasoning Layer ({llmProvider})</p>
                </div>
                <p className="text-sm text-slate-700 mb-2">
                  <strong>Model:</strong> {llmModel} predicted <strong className={llmIsFake ? 'text-rose-600' : 'text-emerald-600'}>{String(llmPrediction).toUpperCase()}</strong>
                  {llmConfidence > 0 ? ` with ${llmConfidence.toFixed(1)}% confidence` : ''}
                </p>
                <div className="bg-white border border-cyan-100 rounded-md p-3 mb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Why AI marked this as {String(llmPrediction).toUpperCase()}</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{llmReasoning}</p>
                </div>
                {llmSignals.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {llmSignals.map((signal: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-white text-cyan-800 border border-cyan-100 rounded text-xs font-medium">
                        {signal}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {llmLayerRaw && !hasValidLlmDecision && llmError && (
              <div className="mb-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <i className="ri-alert-line text-amber-700"></i>
                  <p className="text-xs font-bold text-amber-900 uppercase">AI Reasoning Layer Unavailable</p>
                </div>
                <p className="text-sm text-amber-900">
                  LLM verification could not complete for this request, so the final decision used other available layers.
                </p>
              </div>
            )}

            {fusionExplanationText && (
              <div className="p-4 bg-violet-50 border border-violet-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-stack-line text-violet-600"></i>
                  <p className="text-xs font-bold text-violet-900 uppercase">4. Fusion Intelligence</p>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{fusionExplanationText}</p>
              </div>
            )}
          </div>

          {/* 3. ANALYZED CONTENT */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-file-text-line text-slate-600"></i>
              <h4 className="text-sm font-bold text-slate-900">Content Analysis</h4>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 overflow-x-auto">
              <p
                className="text-sm text-slate-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightText(result.analyzedText || result.text || '') }}
              ></p>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              <i className="ri-information-line flex-shrink-0"></i>
              <span>Highlighted phrases are top features influencing AI prediction (LIME/SHAP attribution)</span>
            </p>
          </div>

          {/* 4. SUSPICIOUS INDICATORS */}
          {result.suspiciousKeywords && result.suspiciousKeywords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="ri-alert-line text-rose-600"></i>
                <h4 className="text-sm font-bold text-slate-900">Suspicious Indicators Found</h4>
              </div>
              <div className="space-y-2.5">
                {result.suspiciousKeywords.map((kw: any, i: number) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-rose-50 border border-rose-100 rounded-lg">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-rose-500 text-white rounded-lg text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 mb-0.5">"{kw.word}"</p>
                      <p className="text-xs text-slate-500">{kw.reason}</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-extrabold text-rose-600">{(kw.score * 100).toFixed(0)}%</div>
                        <div className="text-[10px] text-slate-400">impact</div>
                      </div>
                      <div className="flex-1 sm:w-20">
                        <div className="h-1.5 bg-rose-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-400 rounded-full" style={{ width: `${kw.score * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. RECOMMENDATIONS */}
          {result.explanation?.recommendations && result.explanation.recommendations.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <i className="ri-lightbulb-flash-line text-teal-600"></i>
                <h4 className="text-sm font-bold text-slate-900">Recommended Actions</h4>
              </div>
              <ul className="space-y-2">
                {result.explanation.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-teal-500 text-white rounded-full text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/verify-text')}
          className="flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-lg font-semibold text-sm hover:bg-teal-700 transition-all shadow-md shadow-teal-500/20 cursor-pointer whitespace-nowrap"
        >
          <i className="ri-refresh-line"></i>
          Analyze New Content
        </button>
        <button 
          onClick={handleSaveToHistory}
          className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
        >
          <i className="ri-save-line"></i>
          View in History
        </button>
      </div>

      {/* Success Message Toast */}
      {showSaveMessage && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50">
          <i className="ri-checkbox-circle-fill text-2xl"></i>
          <div>
            <p className="font-semibold">Analysis Saved!</p>
            <p className="text-xs text-emerald-100">Redirecting to history...</p>
          </div>
        </div>
      )}
    </div>
  );
}