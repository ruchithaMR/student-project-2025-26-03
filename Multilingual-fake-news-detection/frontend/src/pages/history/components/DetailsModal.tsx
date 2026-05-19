import { useEffect, useState } from 'react';
import FakeNewsAPI from '../../../services/api';

interface Prediction {
  id: string;
  type: string;
  content: string;
  prediction: string;
  confidence: number;
  riskLevel: string;
  language: string;
  timestamp: string;
  tags: string[];
  saved: boolean;
  ml_confidence?: number;
  knowledge_flags?: number;
  api_verified?: boolean;
  llm_used?: boolean;
  llm_provider?: string | null;
  llm_model?: string | null;
  llm_prediction?: string | null;
  llm_confidence?: number;
  llm_reasoning?: string | null;
  llm_fallback_from?: string | null;
  llm_error?: string | null;
}

interface DetailsModalProps {
  prediction: Prediction | null;
  onClose: () => void;
  onUpdate?: (updated: Prediction) => void;
}

const typeIcon: Record<string, string> = {
  text: 'ri-file-text-line',
  url: 'ri-link',
  image: 'ri-image-line',
};

const typeBg: Record<string, string> = {
  text: 'bg-teal-500/10 text-teal-600',
  url: 'bg-sky-500/10 text-sky-600',
  image: 'bg-violet-500/10 text-violet-600',
};

const getScoreColor = (score: number) => {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 65) return 'bg-amber-400';
  return 'bg-rose-500';
};

const getScoreTextColor = (score: number) => {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 65) return 'text-amber-600';
  return 'text-rose-600';
};

export default function DetailsModal({ prediction, onClose, onUpdate }: DetailsModalProps) {
  const [shareSuccess, setShareSuccess] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState(prediction);

  useEffect(() => {
    setCurrentPrediction(prediction);
  }, [prediction]);

  useEffect(() => {
    if (!prediction) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [prediction, onClose]);

  const handleShare = async () => {
    if (!currentPrediction) return;
    
    const shareText = `🤖 Fake News Detection Analysis

📄 Type: ${currentPrediction.type.toUpperCase()} Analysis
🎯 Verdict: ${currentPrediction.prediction} (${currentPrediction.confidence}% confidence)
⚠️ Risk Level: ${currentPrediction.riskLevel}
🌐 Language: ${currentPrediction.language.toUpperCase()}
📅 Analyzed: ${new Date(currentPrediction.timestamp).toLocaleString()}

${currentPrediction.content.startsWith('http') ? `🔗 Source: ${currentPrediction.content}` : `📝 Content: ${currentPrediction.content.substring(0, 200)}...`}

Powered by AI-Powered Fake News Detection System`;

    try {
      if (navigator.share) {
        // Use native share API on mobile
        await navigator.share({
          title: 'Fake News Analysis',
          text: shareText,
        });
      } else {
        // Copy to clipboard on desktop
        await navigator.clipboard.writeText(shareText);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleReanalyze = async () => {
    if (!currentPrediction || reanalyzing) return;
    
    setReanalyzing(true);
    try {
      let result;
      
      if (currentPrediction.type === 'text') {
        // Re-analyze text
        result = await FakeNewsAPI.predictText(currentPrediction.content, true);
      } else if (currentPrediction.type === 'url') {
        // Re-analyze URL
        result = await FakeNewsAPI.predictURL(currentPrediction.content, true);
      } else if (currentPrediction.type === 'image') {
        // For images, we need to fetch the image and re-analyze
        // Note: This requires the image URL to still be valid
        const response = await fetch(currentPrediction.content);
        const blob = await response.blob();
        const file = new File([blob], 'reanalyzed-image.jpg', { type: blob.type });
        result = await FakeNewsAPI.predictImage(file);
      }

      if (result) {
        const apiMlConf = Number(result?.ml_prediction?.confidence ?? 0);
        const mlConfidencePercent = apiMlConf <= 1 ? apiMlConf * 100 : apiMlConf;
        const llmLayer = result?.openai_layer || result?.llm_layer || {};
        // Update prediction with new results
        const updatedPrediction: Prediction = {
          ...currentPrediction,
          prediction: result.prediction === 'FAKE' ? 'Fake' : 'Real',
          confidence: Math.round(result.confidence),
          riskLevel: result.risk_level || (result.prediction === 'FAKE' 
            ? (result.confidence >= 85 ? 'High' : result.confidence >= 65 ? 'Medium' : 'Low')
            : (result.confidence >= 85 ? 'Low' : result.confidence >= 65 ? 'Medium' : 'High')),
          language: result.language || currentPrediction.language,
          timestamp: new Date().toISOString(),
          ml_confidence: Math.round(mlConfidencePercent),
          knowledge_flags: result.knowledge_layer?.impossible_claims?.length || 0,
          api_verified: !!result.api_layer,
          llm_used: !!llmLayer.used,
          llm_provider: llmLayer.provider || null,
          llm_model: llmLayer.model || null,
          llm_prediction: llmLayer.prediction || null,
          llm_confidence: llmLayer.confidence !== undefined ? Number(llmLayer.confidence) : undefined,
          llm_reasoning: llmLayer.reasoning || null,
          llm_fallback_from: llmLayer.fallback_from || null,
          llm_error: llmLayer.error || null,
        };

        setCurrentPrediction(updatedPrediction);
        if (onUpdate) {
          onUpdate(updatedPrediction);
        }
      }
    } catch (error) {
      console.error('Re-analysis failed:', error);
      alert(`Failed to re-analyze: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setReanalyzing(false);
    }
  };

  if (!currentPrediction) return null;

  const formattedDate = new Date(currentPrediction.timestamp).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const verdictConfig = currentPrediction.prediction === 'Real'
    ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'ri-checkbox-circle-fill', label: 'Verified Real' }
    : { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'ri-close-circle-fill', label: 'Detected Fake' };

  const riskConfig: Record<string, { bg: string; text: string; icon: string }> = {
    Low: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'ri-shield-check-line' },
    Medium: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'ri-shield-line' },
    High: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'ri-shield-cross-line' },
  };
  const risk = riskConfig[currentPrediction.riskLevel] || riskConfig.Low;
  const llmPrediction = String(currentPrediction.llm_prediction || '').toLowerCase();
  const hasValidLlm = !!currentPrediction.llm_used && (llmPrediction === 'real' || llmPrediction === 'fake');
  const llmProviderLabel = (currentPrediction.llm_provider || 'LLM').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${typeBg[currentPrediction.type] || 'bg-slate-100 text-slate-500'}`}>
              <i className={`${typeIcon[currentPrediction.type] || 'ri-file-line'} text-sm`}></i>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Analysis Details</h2>
              <p className="text-xs text-slate-500 capitalize">{currentPrediction.type} analysis &middot; {currentPrediction.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Verdict Banner */}
          <div className={`flex items-center gap-4 p-4 rounded-xl border ${verdictConfig.bg} ${verdictConfig.border}`}>
            <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${verdictConfig.bg}`}>
              <i className={`${verdictConfig.icon} text-2xl ${verdictConfig.text}`}></i>
            </div>
            <div className="flex-1">
              <p className={`text-lg font-bold ${verdictConfig.text}`}>{verdictConfig.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">AI confidence score: <span className="font-semibold text-slate-700">{currentPrediction.confidence}%</span></p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-slate-900">{currentPrediction.confidence}%</p>
              <p className="text-xs text-slate-400">confidence</p>
            </div>
          </div>

          {/* Confidence Bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-600">Overall Confidence</span>
              <span className={`text-xs font-bold ${getScoreTextColor(currentPrediction.confidence)}`}>{currentPrediction.confidence}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${getScoreColor(currentPrediction.confidence)}`}
                style={{ width: `${currentPrediction.confidence}%` }}
              ></div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${risk.bg}`}>
              <i className={`${risk.icon} text-xl ${risk.text}`}></i>
              <span className={`text-xs font-semibold ${risk.text}`}>{currentPrediction.riskLevel} Risk</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-sky-50">
              <i className="ri-translate-2 text-xl text-sky-600"></i>
              <span className="text-xs font-semibold text-sky-700">{currentPrediction.language}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50">
              <i className="ri-time-line text-xl text-slate-500"></i>
              <span className="text-xs font-semibold text-slate-600">
                {new Date(currentPrediction.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Verification Layers */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Verification Layers Used</p>
            <div className="grid grid-cols-1 gap-2">
              {/* ML Model Layer */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-100 rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100">
                  <i className="ri-brain-line text-blue-600 text-sm"></i>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">ML Model Analysis</p>
                  <p className="text-xs text-slate-500">Deep learning pattern detection
                    {currentPrediction.ml_confidence !== undefined && (
                      <span className="font-medium text-blue-600"> • {currentPrediction.ml_confidence}% confidence</span>
                    )}
                  </p>
                </div>
                <i className="ri-checkbox-circle-fill text-blue-600 text-lg"></i>
              </div>

              {/* AI Reasoning Layer */}
              <div className={`flex items-center gap-3 p-3 border rounded-lg ${
                hasValidLlm
                  ? 'bg-gradient-to-r from-cyan-50 to-cyan-50/50 border-cyan-100'
                  : currentPrediction.llm_error
                    ? 'bg-gradient-to-r from-amber-50 to-amber-50/50 border-amber-100'
                    : 'bg-gradient-to-r from-slate-50 to-slate-50/50 border-slate-100'
              }`}>
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                  hasValidLlm ? 'bg-cyan-100' : currentPrediction.llm_error ? 'bg-amber-100' : 'bg-slate-100'
                }`}>
                  <i className={`ri-robot-2-line text-sm ${
                    hasValidLlm ? 'text-cyan-700' : currentPrediction.llm_error ? 'text-amber-700' : 'text-slate-400'
                  }`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">AI Reasoning Layer ({llmProviderLabel})</p>
                  <p className="text-xs text-slate-500">
                    {hasValidLlm
                      ? `${currentPrediction.llm_model || 'model'} • ${String(currentPrediction.llm_prediction).toUpperCase()}${currentPrediction.llm_confidence !== undefined ? ` (${Number(currentPrediction.llm_confidence).toFixed(1)}%)` : ''}`
                      : currentPrediction.llm_error
                        ? 'LLM unavailable for this run'
                        : 'No LLM evidence stored for this record'}
                    {currentPrediction.llm_fallback_from ? ` • fallback from ${String(currentPrediction.llm_fallback_from).toUpperCase()}` : ''}
                  </p>
                </div>
                <i className={`text-lg ${
                  hasValidLlm
                    ? 'ri-checkbox-circle-fill text-cyan-700'
                    : currentPrediction.llm_error
                      ? 'ri-error-warning-line text-amber-700'
                      : 'ri-checkbox-circle-line text-slate-400'
                }`}></i>
              </div>

              {/* Fusion Layer - Always Active */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-violet-50 to-violet-50/50 border border-violet-100 rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-100">
                  <i className="ri-git-merge-line text-violet-600 text-sm"></i>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">Fusion Intelligence</p>
                  <p className="text-xs text-slate-500">Combined all evidence with weighted voting</p>
                </div>
                <i className="ri-checkbox-circle-fill text-violet-600 text-lg"></i>
              </div>
            </div>
          </div>

          {/* AI Reasoning Details */}
          {(hasValidLlm || currentPrediction.llm_error) && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">AI Reasoning</p>
              <div className={`rounded-xl border p-4 ${hasValidLlm ? 'bg-cyan-50 border-cyan-100' : 'bg-amber-50 border-amber-200'}`}>
                {hasValidLlm ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <i className="ri-robot-2-line text-cyan-700"></i>
                      <p className="text-sm font-semibold text-slate-900">
                        {llmProviderLabel} said {String(currentPrediction.llm_prediction).toUpperCase()}
                        {currentPrediction.llm_confidence !== undefined ? ` (${Number(currentPrediction.llm_confidence).toFixed(1)}%)` : ''}
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {currentPrediction.llm_reasoning || 'No detailed reasoning text was stored for this record.'}
                    </p>
                    {currentPrediction.llm_fallback_from && (
                      <p className="text-xs text-slate-500 mt-2">
                        Fallback used from {String(currentPrediction.llm_fallback_from).toUpperCase()} to {llmProviderLabel}.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1.5">
                      <i className="ri-error-warning-line text-amber-700"></i>
                      <p className="text-sm font-semibold text-amber-900">AI layer was unavailable for this run</p>
                    </div>
                    <p className="text-sm text-amber-900">{currentPrediction.llm_error}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Analyzed Content</p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              {currentPrediction.type === 'url' && currentPrediction.content.startsWith('http') ? (
                <a 
                  href={currentPrediction.content} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-1.5 font-medium"
                  title={currentPrediction.content}
                >
                  <i className="ri-external-link-line"></i>
                  URL Analysis - {new URL(currentPrediction.content).hostname.replace('www.', '')}
                </a>
              ) : currentPrediction.type === 'image' && currentPrediction.content.startsWith('http') ? (
                <a 
                  href={currentPrediction.content} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-violet-600 hover:text-violet-700 hover:underline inline-flex items-center gap-1.5 font-medium"
                  title={currentPrediction.content}
                >
                  <i className="ri-image-line"></i>
                  Image Analysis
                </a>
              ) : (
                <p className="text-sm text-slate-800 leading-relaxed">{currentPrediction.content}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          {currentPrediction.tags && currentPrediction.tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Analysis Tags</p>
              <div className="flex flex-wrap gap-2">
                {currentPrediction.tags.map((tag, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-1 border-t border-slate-100">
            <i className="ri-calendar-line"></i>
            <span>Analyzed on {formattedDate}</span>
            {currentPrediction.saved && (
              <>
                <span className="mx-1">·</span>
                <i className="ri-bookmark-fill text-amber-500"></i>
                <span className="text-amber-600 font-medium">Saved to bookmarks</span>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all cursor-pointer whitespace-nowrap"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap relative shadow-sm"
            >
              {shareSuccess ? (
                <>
                  <i className="ri-check-line text-sm"></i>Copied!
                </>
              ) : (
                <>
                  <i className="ri-share-line text-sm"></i>Share
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
