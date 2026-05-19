import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import FakeNewsAPI from '../../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    fakeCount: 0,
    realCount: 0,
    accuracyRate: 0,
  });
  const [modelInfo, setModelInfo] = useState({
    modelName: 'Unavailable',
    metricSource: 'No artifact',
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch live dashboard data from backend
        const [statsRes, historyRes, modelRes] = await Promise.all([
          FakeNewsAPI.getStats(),
          FakeNewsAPI.getHistory(5),
          FakeNewsAPI.getModelMetrics(),
        ]);

        const testMetrics = modelRes?.metrics?.test_metrics || {};
        const validationMetrics = modelRes?.metrics?.validation_metrics || {};
        const metricContainer = Object.keys(testMetrics).length > 0 ? testMetrics : validationMetrics;
        const rawAccuracy = metricContainer.test_accuracy ?? metricContainer.eval_accuracy ?? 0;
        const accuracyRate = rawAccuracy <= 1 ? rawAccuracy * 100 : rawAccuracy;

        if (statsRes.success && statsRes.stats.connected) {
          setStats({
            totalAnalyses: statsRes.stats.total_predictions || 0,
            fakeCount: statsRes.stats.fake_predictions || 0,
            realCount: statsRes.stats.real_predictions || 0,
            accuracyRate: Number(accuracyRate.toFixed(2)),
          });
        }

        setModelInfo({
          modelName: modelRes?.metrics?.model_name || 'Unavailable',
          metricSource: Object.keys(testMetrics).length > 0 ? 'Test metrics' : 'Validation metrics',
        });

        if (historyRes.success && historyRes.predictions) {
          // Transform backend data to match UI format
          const transformed = historyRes.predictions.map((pred: any) => {
            let content = '';
            
            // Display simple label based on type
            if (pred.prediction_type === 'text') {
              content = 'Text Analysis';
            } else if (pred.prediction_type === 'url') {
              content = 'URL Analysis';
            } else if (pred.prediction_type === 'image') {
              content = 'Image Analysis';
            } else {
              content = 'Analysis';
            }
            
            return {
              id: pred._id,
              type: pred.prediction_type,
              content: content,
              prediction: pred.is_fake ? 'Fake' : 'Real',
              confidence: Math.round(pred.confidence),
              timestamp: pred.timestamp,
            };
          });
          setRecentAnalyses(transformed);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default values if API fails
        setStats({
          totalAnalyses: 0,
          fakeCount: 0,
          realCount: 0,
          accuracyRate: 0,
        });
        setModelInfo({
          modelName: 'Unavailable',
          metricSource: 'No artifact',
        });
        setRecentAnalyses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statsData = [
    { label: 'Total Analyses', value: stats.totalAnalyses, icon: 'ri-file-list-3-line', color: 'bg-teal-50 text-teal-600', badge: 'Live DB', badgeStyle: 'bg-teal-50 text-teal-700' },
    { label: 'Fake Detected', value: stats.fakeCount, icon: 'ri-spam-2-line', color: 'bg-rose-50 text-rose-500', badge: 'Live DB', badgeStyle: 'bg-rose-50 text-rose-700' },
    { label: 'Real Verified', value: stats.realCount, icon: 'ri-checkbox-circle-line', color: 'bg-emerald-50 text-emerald-600', badge: 'Live DB', badgeStyle: 'bg-emerald-50 text-emerald-700' },
    { label: 'Accuracy Rate', value: `${stats.accuracyRate}%`, icon: 'ri-percent-line', color: 'bg-sky-50 text-sky-600', badge: modelInfo.metricSource, badgeStyle: 'bg-sky-50 text-sky-700' },
  ];

  const quickActions = [
    { to: '/verify-text', icon: 'ri-file-text-line', label: 'Verify Text', desc: 'Paste news content', gradient: 'from-teal-500 to-emerald-500' },
    { to: '/verify-url', icon: 'ri-links-line', label: 'Verify URL', desc: 'Submit article link', gradient: 'from-sky-500 to-cyan-500' },
    { to: '/verify-image', icon: 'ri-image-2-line', label: 'Verify Image', desc: 'Upload screenshot', gradient: 'from-violet-500 to-indigo-500' },
  ];

  const typeIcon: Record<string, { icon: string; bg: string; text: string }> = {
    text: { icon: 'ri-file-text-line', bg: 'bg-teal-50', text: 'text-teal-600' },
    url: { icon: 'ri-links-line', bg: 'bg-sky-50', text: 'text-sky-600' },
    image: { icon: 'ri-image-2-line', bg: 'bg-violet-50', text: 'text-violet-600' },
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Welcome back. Here's what's happening today.</p>
        </div>
        <Link
          to="/verify-text"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-all shadow-md shadow-teal-500/20 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line"></i>
          New Analysis
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
        {statsData.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg ${s.color}`}>
                <i className={`${s.icon} text-base sm:text-lg`}></i>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.badgeStyle}`}>
                {s.badge}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-0.5">{s.value}</div>
            <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            {s.label === 'Accuracy Rate' && (
              <div className="text-[10px] text-slate-400 mt-1 truncate">{modelInfo.modelName}</div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-7">
        {quickActions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className={`bg-gradient-to-br ${a.gradient} rounded-xl p-5 text-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg">
                <i className={`${a.icon} text-xl`}></i>
              </div>
              <i className="ri-arrow-right-up-line text-white/60 group-hover:text-white transition-colors text-lg"></i>
            </div>
            <div className="text-base font-bold mb-0.5">{a.label}</div>
            <div className="text-white/70 text-xs">{a.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent Analyses */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Recent Analyses</h2>
          <Link to="/history" className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap">
            View All <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
        <div className="divide-y divide-slate-50 overflow-x-auto">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <i className="ri-loader-4-line text-2xl animate-spin mb-2"></i>
              <p className="text-sm">Loading recent analyses...</p>
            </div>
          ) : recentAnalyses.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <i className="ri-inbox-line text-3xl mb-2"></i>
              <p className="text-sm">No analyses yet. Start by verifying some content!</p>
            </div>
          ) : (
            recentAnalyses.map((a: any) => {
            const t = typeIcon[a.type] ?? typeIcon.text;
            return (
              <div key={a.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-slate-50/60 transition-colors min-w-[500px] sm:min-w-0">
                <div className={`w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 ${t.bg}`}>
                  <i className={`${t.icon} ${t.text} text-base`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{a.content}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(a.timestamp)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-400">Confidence</p>
                    <p className="text-sm font-bold text-slate-800">{a.confidence}%</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    a.prediction === 'Real'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-600'
                  }`}>
                    {a.prediction === 'Real' ? '✓ Real' : '✗ Fake'}
                  </span>
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>
    </>
  );
}