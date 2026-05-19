import { useState, useEffect } from 'react';
import {
  PieChart, Pie, BarChart, Bar, LineChart, Line,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import FakeNewsAPI from '../../services/api';

const COLORS = ['#ef4444', '#10b981', '#f59e0b', '#6366f1'];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30');
  const [analytics, setAnalytics] = useState<any>(null);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const days = parseInt(dateRange) || 30;
        const [analyticsResponse, modelResponse] = await Promise.all([
          FakeNewsAPI.getAnalytics(days),
          FakeNewsAPI.getModelMetrics(),
        ]);
        
        if (analyticsResponse.success) {
          // Transform backend data to frontend format
          const data = analyticsResponse.analytics;
          
          // Fake vs Real for pie chart
          const fakeVsReal = [
            { name: 'Fake', value: data.summary.fake_predictions },
            { name: 'Real', value: data.summary.real_predictions },
          ];
          
          // Trends for line chart (reverse to show oldest first)
          const trends = data.daily_stats.reverse().map((day: any) => ({
            date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fake: day.fake_predictions || 0,
            real: day.real_predictions || 0,
          }));
          
          // Type distribution for bar chart (if we want to add this)
          const byType = data.daily_stats.reduce((acc: any, day: any) => {
            const types = day.by_type || {};
            Object.keys(types).forEach(type => {
              acc[type] = (acc[type] || 0) + types[type];
            });
            return acc;
          }, {});
          
          setAnalytics({
            totalPredictions: data.summary.total_predictions,
            fakeVsReal,
            trends,
            byType,
            fakePercentage: data.summary.fake_percentage,
          });
        }

        if (modelResponse.success && modelResponse.available) {
          setModelMetrics(modelResponse.metrics || null);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        // Set empty data on error
        setAnalytics({
          totalPredictions: 0,
          fakeVsReal: [{ name: 'Fake', value: 0 }, { name: 'Real', value: 0 }],
          trends: [],
          byType: {},
          fakePercentage: 0,
        });
        setModelMetrics(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [dateRange]);

  const getFilteredData = () => {
    switch (dateRange) {
      case '7': return analytics?.trends.slice(-7) || [];
      case '30': return analytics?.trends.slice(-30) || [];
      case '90': return analytics?.trends.slice(-90) || [];
      default: return analytics?.trends || [];
    }
  };

  const filteredTrends = getFilteredData();

  const pickMetrics = () => {
    const test = modelMetrics?.test_metrics || {};
    const validation = modelMetrics?.validation_metrics || {};
    const source = Object.keys(test).length > 0 ? test : validation;

    const toPct = (v: any) => {
      const n = Number(v ?? 0);
      return n <= 1 ? n * 100 : n;
    };

    return {
      accuracy: Number(toPct(source.test_accuracy ?? source.eval_accuracy).toFixed(2)),
      precision: Number(toPct(source.test_precision ?? source.eval_precision).toFixed(2)),
      recall: Number(toPct(source.test_recall ?? source.eval_recall).toFixed(2)),
      f1Score: Number(toPct(source.test_f1 ?? source.eval_f1).toFixed(2)),
    };
  };

  const liveMetrics = pickMetrics();
  const confusionMatrix = modelMetrics?.confusion_matrix || null;

  const summaryCards = analytics ? [
    {
      icon: 'ri-file-list-3-line',
      iconBg: 'bg-teal-500/10',
      iconColor: 'text-teal-600',
      value: analytics.totalPredictions.toLocaleString(),
      label: 'Total Predictions',
      badge: `${analytics.fakePercentage}% fake`,
      badgeColor: 'bg-rose-50 text-rose-700',
    },
    {
      icon: 'ri-percent-line',
      iconBg: 'bg-sky-500/10',
      iconColor: 'text-sky-600',
      value: `${liveMetrics.accuracy}%`,
      label: 'Model Accuracy',
      badge: modelMetrics?.model_name ? 'Live Model' : 'Unavailable',
      badgeColor: 'bg-sky-50 text-sky-700',
    },
    {
      icon: 'ri-error-warning-line',
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-600',
      value: analytics.fakeVsReal[0].value.toLocaleString(),
      label: 'Fake News Detected',
      badge: `${analytics.fakePercentage}%`,
      badgeColor: 'bg-rose-50 text-rose-600',
    },
    {
      icon: 'ri-global-line',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-600',
      value: Object.keys(analytics.byType).length.toString(),
      label: 'Content Types',
      badge: 'Active',
      badgeColor: 'bg-violet-50 text-violet-700',
    },
  ] : [];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center bg-teal-500/10 rounded-lg">
            <i className="ri-bar-chart-2-line text-teal-600 text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Analytics Dashboard</h1>
            <p className="text-xs text-slate-500">Comprehensive insights and trends</p>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDateRange('7')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              dateRange === '7' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setDateRange('30')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              dateRange === '30' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setDateRange('90')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              dateRange === '90' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            90 Days
          </button>
          <button
            onClick={() => setDateRange('365')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              dateRange === '365' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            1 Year
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <i className="ri-loader-4-line text-3xl text-teal-500 animate-spin"></i>
          </div>
        ) : (
          summaryCards.map((card, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 flex items-center justify-center ${card.iconBg} rounded-lg`}>
                  <i className={`${card.icon} ${card.iconColor} text-sm`}></i>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </div>
          ))
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-6">
        {/* Fake vs Real Pie */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <i className="ri-pie-chart-2-line text-teal-600 text-sm"></i>
            <h3 className="text-sm font-semibold text-slate-900">Fake vs Real Distribution</h3>
          </div>
          <div className="p-5">
            {loading || !analytics ? (
              <div className="flex items-center justify-center h-[240px]">
                <i className="ri-loader-4-line text-2xl text-teal-500 animate-spin"></i>
              </div>
            ) : analytics.totalPredictions === 0 ? (
              <div className="flex items-center justify-center h-[240px] text-slate-400">
                <div className="text-center">
                  <i className="ri-pie-chart-2-line text-3xl mb-2"></i>
                  <p className="text-sm">No data available</p>
                </div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={analytics.fakeVsReal}
                      cx="50%" cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {analytics.fakeVsReal.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-5 mt-2">
                  {analytics.fakeVsReal.map((item: any, index: number) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                      <span className="text-xs text-slate-600">{item.name}: <strong>{item. value}</strong></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content Type Distribution */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <i className="ri-bar-chart-line text-teal-600 text-sm"></i>
            <h3 className="text-sm font-semibold text-slate-900">Content Type Distribution</h3>
          </div>
          <div className="p-5">
            {loading || !analytics ? (
              <div className="flex items-center justify-center h-[260px]">
                <i className="ri-loader-4-line text-2xl text-teal-500 animate-spin"></i>
              </div>
            ) : Object.keys(analytics.byType).length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-slate-400">
                <div className="text-center">
                  <i className="ri-bar-chart-line text-3xl mb-2"></i>
                  <p className="text-sm">No data available</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={Object.entries(analytics.byType).map(([type, count]) => ({ 
                  type: type.charAt(0).toUpperCase() + type.slice(1), 
                  count 
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="type" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Full Width Charts */}
      <div className="space-y-4 sm:space-y-5 mb-6">
        {/* Trends Line Chart */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <i className="ri-line-chart-line text-teal-600 text-sm"></i>
            <h3 className="text-sm font-semibold text-slate-900">Misinformation Trends Over Time</h3>
          </div>
          <div className="p-5">
            {loading || !analytics ? (
              <div className="flex items-center justify-center h-[280px]">
                <i className="ri-loader-4-line text-2xl text-teal-500 animate-spin"></i>
              </div>
            ) : filteredTrends.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-slate-400">
                <div className="text-center">
                  <i className="ri-line-chart-line text-3xl mb-2"></i>
                  <p className="text-sm">No trend data available</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={filteredTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="fake" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Fake" />
                  <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Real" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Model Performance */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <i className="ri-dashboard-3-line text-teal-600 text-sm"></i>
            <h3 className="text-sm font-semibold text-slate-900">Model Performance</h3>
            <span className="ml-auto text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">Training Metrics</span>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Accuracy', value: liveMetrics.accuracy, color: 'bg-teal-500' },
              { label: 'Precision', value: liveMetrics.precision, color: 'bg-sky-500' },
              { label: 'Recall', value: liveMetrics.recall, color: 'bg-violet-500' },
              { label: 'F1-Score', value: liveMetrics.f1Score, color: 'bg-amber-500' },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-slate-600">{m.label}</span>
                  <span className="text-xs font-bold text-slate-900">{m.value}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className={`${m.color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${m.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <i className="ri-grid-line text-teal-600 text-sm"></i>
            <h3 className="text-sm font-semibold text-slate-900">Confusion Matrix</h3>
            <span className="ml-auto text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">Model Artifact</span>
          </div>
          <div className="p-5">
            {confusionMatrix ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-center mb-2">
                  <div></div>
                  <div className="text-xs font-semibold text-slate-600">Pred. Fake</div>
                  <div className="text-xs font-semibold text-slate-600">Pred. Real</div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="text-xs font-semibold text-slate-600 flex items-center">Actual Fake</div>
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-rose-700">{confusionMatrix.truePositive}</div>
                    <div className="text-xs text-rose-500 mt-0.5">True Pos.</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-amber-700">{confusionMatrix.falseNegative}</div>
                    <div className="text-xs text-amber-500 mt-0.5">False Neg.</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-xs font-semibold text-slate-600 flex items-center">Actual Real</div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-orange-700">{confusionMatrix.falsePositive}</div>
                    <div className="text-xs text-orange-500 mt-0.5">False Pos.</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-emerald-700">{confusionMatrix.trueNegative}</div>
                    <div className="text-xs text-emerald-500 mt-0.5">True Neg.</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Confusion matrix is not present in the current model artifact.
                {modelMetrics?.model_name ? ` Model: ${modelMetrics.model_name}` : ''}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-50">
              <div className="text-center">
                <p className="text-lg font-bold text-teal-600">{liveMetrics.accuracy}%</p>
                <p className="text-xs text-slate-500">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900">0.8s</p>
                <p className="text-xs text-slate-500">Avg. Speed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-rose-600">
                  {analytics ? analytics.fakePercentage.toFixed(1) : '0.0'}%
                </p>
                <p className="text-xs text-slate-500">Misinfo Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}