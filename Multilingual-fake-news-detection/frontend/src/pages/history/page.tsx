import { useState, useEffect } from 'react';
import FakeNewsAPI from '../../services/api';
import DetailsModal from './components/DetailsModal';

export default function HistoryPage() {
  const [filterType, setFilterType] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<any | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await FakeNewsAPI.getHistory(100);
        if (response.success && response.predictions) {
          // Transform backend data to match UI format with clean, scannable content
          const transformed = response.predictions.map((pred: any) => {
            const llmLayer = pred.openai_layer || pred.llm_layer || {};
            let displayContent = 'Analysis';
            let fullContent = pred.text || pred.url || pred.image_url || '';
            
            // Create clean, concise display content based on type
            if (pred.prediction_type === 'url') {
              // For URLs, show the complete URL
              displayContent = pred.url || 'URL Analysis';
              // URL re-analyze must use canonical URL, not scraped article text.
              fullContent = pred.url || pred.text || '';
            } else if (pred.prediction_type === 'image') {
              // For images, show the Cloudinary URL
              displayContent = pred.image_url || 'Image Analysis';
              fullContent = pred.image_url || pred.text || '';
            } else if (pred.prediction_type === 'text') {
              // For text, show first 100 chars
              displayContent = pred.text ? pred.text.substring(0, 100).trim() + (pred.text.length > 100 ? '...' : '') : 'Text Analysis';
              fullContent = pred.text || '';
            }
            
            return {
              id: pred._id,
              type: pred.prediction_type,
              content: displayContent,
              fullContent, // Type-aware source payload for re-analysis
              prediction: pred.is_fake ? 'Fake' : 'Real',
              confidence: Math.round(pred.confidence),
              // Risk level logic: For FAKE news, high confidence = high risk. For REAL news, high confidence = low risk
              riskLevel: pred.is_fake 
                ? (pred.confidence >= 85 ? 'High' : pred.confidence >= 65 ? 'Medium' : 'Low')
                : (pred.confidence >= 85 ? 'Low' : pred.confidence >= 65 ? 'Medium' : 'High'),
              language: pred.language || 'en',
              timestamp: pred.timestamp,
              tags: pred.tags || [],
              saved: false, // Backend doesn't store saved status yet
              ml_confidence: pred.ml_confidence !== undefined ? Math.round(pred.ml_confidence) : undefined,
              knowledge_flags: pred.knowledge_flags,
              api_verified: pred.api_verified,
              llm_used: !!llmLayer.used,
              llm_provider: llmLayer.provider || null,
              llm_model: llmLayer.model || null,
              llm_prediction: llmLayer.prediction || null,
              llm_confidence: llmLayer.confidence !== undefined ? Number(llmLayer.confidence) : undefined,
              llm_reasoning: llmLayer.reasoning || null,
              llm_fallback_from: llmLayer.fallback_from || null,
              llm_error: llmLayer.error || null,
              source_domain: pred.source || null,
              source_url: pred.url || null,
            };
          });
          setPredictions(transformed);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredPredictions = predictions.filter((pred) => {
    const matchesType = filterType === 'all' || pred.type === filterType;
    const matchesResult = filterResult === 'all' || pred.prediction.toLowerCase() === filterResult;
    const matchesSearch =
      pred.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pred.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesResult && matchesSearch;
  });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const mapApiResultToPrediction = (original: any, result: any) => {
    const confidence = Number(result?.confidence ?? 0);
    const confidencePercent = confidence <= 1 ? confidence * 100 : confidence;
    const mlConfRaw = Number(result?.ml_prediction?.confidence ?? 0);
    const mlConfPercent = mlConfRaw <= 1 ? mlConfRaw * 100 : mlConfRaw;
    const llmLayer = result?.openai_layer || result?.llm_layer || {};
    const predictionLabel = String(result?.prediction || '').toUpperCase() === 'FAKE' ? 'Fake' : 'Real';

    return {
      ...original,
      prediction: predictionLabel,
      confidence: Math.round(confidencePercent),
      riskLevel: result?.risk_level || (predictionLabel === 'Fake'
        ? (confidencePercent >= 85 ? 'High' : confidencePercent >= 65 ? 'Medium' : 'Low')
        : (confidencePercent >= 85 ? 'Low' : confidencePercent >= 65 ? 'Medium' : 'High')),
      language: result?.language || original.language,
      timestamp: new Date().toISOString(),
      ml_confidence: Math.round(mlConfPercent),
      knowledge_flags: result?.knowledge_layer?.impossible_claims?.length || 0,
      api_verified: !!result?.api_layer,
      llm_used: !!llmLayer.used,
      llm_provider: llmLayer.provider || null,
      llm_model: llmLayer.model || null,
      llm_prediction: llmLayer.prediction || null,
      llm_confidence: llmLayer.confidence !== undefined ? Number(llmLayer.confidence) : undefined,
      llm_reasoning: llmLayer.reasoning || null,
      llm_fallback_from: llmLayer.fallback_from || null,
      llm_error: llmLayer.error || null,
    };
  };

  const handleReanalyzePrediction = async (prediction: any) => {
    try {
      let result;

      const normalizeUrl = (raw: string) => {
        const candidate = String(raw || '').trim();
        if (!candidate) return '';
        if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate;
        return `https://${candidate.replace(/^\/+/, '')}`;
      };

      if (prediction.type === 'text') {
        result = await FakeNewsAPI.predictText(prediction.fullContent || prediction.content, true);
      } else if (prediction.type === 'url') {
        const urlCandidate = normalizeUrl(prediction.source_url || prediction.fullContent || prediction.content || prediction.source_domain || '');
        if (!urlCandidate) {
          throw new Error('No URL found in this history record');
        }
        result = await FakeNewsAPI.predictURL(urlCandidate, true);
      } else if (prediction.type === 'image') {
        const imageUrl = prediction.fullContent || prediction.content;
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'history-reanalyze.jpg', { type: blob.type || 'image/jpeg' });
        result = await FakeNewsAPI.predictImage(file);
      }

      if (result) {
        const updated = mapApiResultToPrediction(prediction, result);
        setPredictions((prev) => prev.map((p) => (p.id === prediction.id ? updated : p)));
        if (selectedPrediction && selectedPrediction.id === prediction.id) {
          setSelectedPrediction(updated);
        }
      }
    } catch (error) {
      console.error('Re-analysis failed:', error);
      alert(`Failed to re-analyze: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSharePrediction = async (prediction: any) => {
    const shareText = `Fake News Analysis\n\nType: ${String(prediction.type || '').toUpperCase()}\nVerdict: ${prediction.prediction} (${prediction.confidence}% confidence)\nRisk: ${prediction.riskLevel}\nLanguage: ${String(prediction.language || '').toUpperCase()}\nDate: ${new Date(prediction.timestamp).toLocaleString()}\n\n${(prediction.fullContent || prediction.content || '').toString().slice(0, 300)}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Fake News Analysis', text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Content', 'Prediction', 'Confidence (%)', 'Risk Level', 'Language', 'Date', 'Tags', 'Saved'];
    const rows = filteredPredictions.map((p) => [
      p.id,
      p.type.toUpperCase(),
      `"${p.content.replace(/"/g, '""')}"`,
      p.prediction,
      p.confidence,
      p.riskLevel,
      p.language,
      new Date(p.timestamp).toLocaleString('en-US'),
      `"${p.tags.join(', ')}"`,
      p.saved ? 'Yes' : 'No',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'prediction_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const rows = filteredPredictions.map((p, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;">${i + 1}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${
            p.type === 'text' ? '#f0fdfa' : p.type === 'url' ? '#f0f9ff' : '#faf5ff'
          };color:${
            p.type === 'text' ? '#0d9488' : p.type === 'url' ? '#0284c7' : '#7c3aed'
          };text-transform:uppercase;">${p.type}</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#1e293b;max-width:280px;">${p.content}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">
          <span style="display:inline-block;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;background:${
            p.prediction === 'Real' ? '#ecfdf5' : '#fff1f2'
          };color:${p.prediction === 'Real' ? '#059669' : '#e11d48'};">${p.prediction}</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#0f172a;">${p.confidence}%</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${
            p.riskLevel === 'Low' ? '#ecfdf5' : p.riskLevel === 'Medium' ? '#fffbeb' : '#fff1f2'
          };color:${
            p.riskLevel === 'Low' ? '#059669' : p.riskLevel === 'Medium' ? '#d97706' : '#e11d48'
          };">${p.riskLevel}</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;">${p.language}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;white-space:nowrap;">${new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">${p.tags.map(t => '#' + t).join(', ')}</td>
      </tr>`).join('');

    const realCount = filteredPredictions.filter(p => p.prediction === 'Real').length;
    const fakeCount = filteredPredictions.filter(p => p.prediction === 'Fake').length;
    const avgConf = filteredPredictions.length
      ? (filteredPredictions.reduce((s, p) => s + p.confidence, 0) / filteredPredictions.length).toFixed(1)
      : '0';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Prediction History Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff; color: #1e293b; padding: 40px; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
    .header-left h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .header-left p { font-size: 13px; color: #64748b; }
    .badge { display: inline-block; padding: 6px 14px; background: #f0fdfa; color: #0d9488; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid #99f6e4; }
    .stats { display: flex; gap: 16px; margin-bottom: 28px; }
    .stat-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; }
    .stat-card .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .stat-card .value { font-size: 24px; font-weight: 700; color: #0f172a; }
    .stat-card .sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .stat-real .value { color: #059669; }
    .stat-fake .value { color: #e11d48; }
    .stat-conf .value { color: #0d9488; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #f1f5f9; }
    th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 11px; color: #94a3b8; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>&#x1F4CA; Prediction History Report</h1>
      <p>Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
    </div>
    <span class="badge">${filteredPredictions.length} Records Exported</span>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="label">Total Analyses</div>
      <div class="value">${filteredPredictions.length}</div>
      <div class="sub">in this export</div>
    </div>
    <div class="stat-card stat-real">
      <div class="label">Real</div>
      <div class="value">${realCount}</div>
      <div class="sub">${filteredPredictions.length ? ((realCount / filteredPredictions.length) * 100).toFixed(0) : 0}% of total</div>
    </div>
    <div class="stat-card stat-fake">
      <div class="label">Fake</div>
      <div class="value">${fakeCount}</div>
      <div class="sub">${filteredPredictions.length ? ((fakeCount / filteredPredictions.length) * 100).toFixed(0) : 0}% of total</div>
    </div>
    <div class="stat-card stat-conf">
      <div class="label">Avg. Confidence</div>
      <div class="value">${avgConf}%</div>
      <div class="sub">across all records</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Type</th>
        <th>Content</th>
        <th>Result</th>
        <th>Confidence</th>
        <th>Risk</th>
        <th>Language</th>
        <th>Date</th>
        <th>Tags</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <p>FakeShield &mdash; AI-Powered Misinformation Detection</p>
    <p>This report is auto-generated and for reference only.</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
    setShowExportMenu(false);
  };

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

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center bg-teal-500/10 rounded-lg">
            <i className="ri-history-line text-teal-600 text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Prediction History</h1>
            <p className="text-xs text-slate-500">View and manage all previous analyses</p>
          </div>
        </div>

        {/* Export */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <i className="ri-download-line text-slate-500"></i>
            Export
            <i className="ri-arrow-down-s-line text-slate-400"></i>
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20">
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <i className="ri-file-excel-line text-emerald-600"></i>Export as CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <i className="ri-file-pdf-line text-rose-600"></i>Export as PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="ri-search-line text-slate-400 text-sm"></i>
            </div>
            <input
              type="text"
              placeholder="Search by content or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 cursor-pointer bg-white"
            >
              <option value="all">All Types</option>
              <option value="text">Text</option>
              <option value="url">URL</option>
              <option value="image">Image</option>
            </select>
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 cursor-pointer bg-white"
            >
              <option value="all">All Results</option>
              <option value="real">Real</option>
              <option value="fake">Fake</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap text-center sm:text-left">
            <span className="font-semibold text-slate-900">{filteredPredictions.length}</span> of {predictions.length}
          </span>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-16 text-center">
            <i className="ri-loader-4-line text-3xl text-teal-500 animate-spin mb-3"></i>
            <p className="text-sm text-slate-500">Loading history...</p>
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-16 text-center">
            <div className="w-14 h-14 flex items-center justify-center bg-slate-100 rounded-xl mx-auto mb-4">
              <i className="ri-inbox-line text-2xl text-slate-400"></i>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              {predictions.length === 0 ? 'No History Yet' : 'No Results Found'}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {predictions.length === 0 
                ? 'Start analyzing content to see your history here'
                : 'Try adjusting your filters or search query'
              }
            </p>
            {predictions.length > 0 && (
              <button
                onClick={() => { setFilterType('all'); setFilterResult('all'); setSearchQuery(''); }}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-all whitespace-nowrap cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredPredictions.map((prediction) => (
          <div
            key={prediction.id}
            className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 sm:p-5 hover:border-slate-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className={`w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 ${typeBg[prediction.type] || 'bg-slate-100 text-slate-500'}`}>
                <i className={`${typeIcon[prediction.type] || 'ri-file-line'} text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase whitespace-nowrap ${typeBg[prediction.type] || 'bg-slate-100 text-slate-600'}`}>
                        {prediction.type}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-xs whitespace-nowrap">
                        {prediction.language.toUpperCase()}
                      </span>
                      {prediction.saved && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs flex items-center gap-1 whitespace-nowrap">
                          <i className="ri-bookmark-fill text-xs"></i>Saved
                        </span>
                      )}
                      <span className="text-xs text-slate-400 ml-auto">{formatDate(prediction.timestamp)}</span>
                    </div>
                    {/* Display clickable labels for URL and Image */}
                    {prediction.type === 'url' && prediction.content.startsWith('http') ? (
                      <a 
                        href={prediction.content} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-sky-600 hover:text-sky-700 hover:underline mb-2.5 block inline-flex items-center gap-1.5 font-medium"
                        title={prediction.content}
                      >
                        <i className="ri-external-link-line"></i>
                        URL Analysis - {new URL(prediction.content).hostname.replace('www.', '')}
                      </a>
                    ) : prediction.type === 'image' && prediction.content.startsWith('http') ? (
                      <a 
                        href={prediction.content} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-violet-600 hover:text-violet-700 hover:underline mb-2.5 block inline-flex items-center gap-1.5 font-medium"
                        title={prediction.content}
                      >
                        <i className="ri-image-line"></i>
                        Image Analysis
                      </a>
                    ) : (
                      <p className="text-sm text-slate-700 line-clamp-1 mb-2.5">{prediction.content}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {prediction.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-xs whitespace-nowrap">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap shadow-sm ${
                      prediction.prediction === 'Real' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {prediction.prediction}
                    </span>
                    <div className="text-center">
                      <span className="text-xl font-bold text-slate-900">{prediction.confidence}%</span>
                      <p className="text-xs text-slate-400">confidence</p>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      prediction.confidence >= 90 ? 'bg-gradient-to-r from-teal-400 to-teal-600' :
                      prediction.confidence >= 70 ? 'bg-gradient-to-r from-sky-400 to-sky-600' : 
                      'bg-gradient-to-r from-amber-400 to-amber-600'
                    }`}
                    style={{ width: `${prediction.confidence}%` }}
                  ></div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                    prediction.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    prediction.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {prediction.riskLevel} Risk
                  </span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedPrediction(prediction)}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-eye-line"></i>Details
                    </button>
                    <button
                      onClick={() => handleSharePrediction(prediction)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
                    >
                      <i className="ri-share-line"></i>Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
        )}
      </div>

      <DetailsModal
        prediction={selectedPrediction}
        onClose={() => setSelectedPrediction(null)}
        onUpdate={(updated) => {
          // Update the prediction in the list
          setPredictions((prev) => prev.map(p => (p.id === updated.id ? updated : p)));
          setSelectedPrediction(updated);
        }}
      />
    </>
  );
}