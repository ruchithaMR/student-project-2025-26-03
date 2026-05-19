import DashboardLayout from '../../components/feature/DashboardLayout';

export default function ModelInsightsPage() {
  const comparisonData = [
    { model: 'Logistic Regression', dot: 'bg-slate-400', accuracy: '82.3%', precision: '79.8%', recall: '81.2%', f1: '80.5%', trainTime: '2 min', inferSpeed: '0.05s', highlight: false },
    { model: 'Support Vector Machine', dot: 'bg-sky-400', accuracy: '85.7%', precision: '83.4%', recall: '84.9%', f1: '84.1%', trainTime: '15 min', inferSpeed: '0.12s', highlight: false },
    { model: 'Random Forest', dot: 'bg-violet-400', accuracy: '88.4%', precision: '86.2%', recall: '87.6%', f1: '86.9%', trainTime: '8 min', inferSpeed: '0.08s', highlight: false },
    { model: 'DistilBERT (Primary)', dot: 'bg-teal-500', accuracy: '94.2%', precision: '91.6%', recall: '88.7%', f1: '90.1%', trainTime: '45 min', inferSpeed: '0.18s', highlight: true },
  ];

  const datasets = [
    { name: 'ISOT Fake News', count: '44,898', unit: 'articles', desc: 'Labeled fake and real news articles', iconBg: 'bg-teal-500/10', iconColor: 'text-teal-600' },
    { name: 'LIAR Dataset', count: '12,836', unit: 'statements', desc: 'Political statements with fact-checking labels', iconBg: 'bg-sky-500/10', iconColor: 'text-sky-600' },
    { name: 'FakeNewsNet', count: '23,196', unit: 'articles', desc: 'Social media news with engagement metrics', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600' },
    { name: 'WELFake', count: '72,134', unit: 'articles', desc: 'Merged dataset from multiple reliable sources', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600' },
    { name: 'NELA-GT', count: '1.1M+', unit: 'articles', desc: 'News source reliability ground truth dataset', iconBg: 'bg-rose-500/10', iconColor: 'text-rose-600' },
    { name: 'Multilingual Data', count: '18,456', unit: 'articles', desc: 'Hindi and Kannada news for regional support', iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-600' },
  ];

  const pipeline = [
    { step: 1, title: 'Lowercasing', desc: 'Convert all text to lowercase for consistency', input: '"Breaking NEWS: Major Event"', output: '"breaking news: major event"', color: 'bg-teal-500' },
    { step: 2, title: 'HTML Tag Removal', desc: 'Strip HTML tags from web-scraped content', input: '"&lt;p&gt;News article&lt;/p&gt;"', output: '"News article"', color: 'bg-sky-500' },
    { step: 3, title: 'URL Removal', desc: 'Remove URLs that don\'t contribute to meaning', input: '"Read more at https://example.com"', output: '"Read more at"', color: 'bg-violet-500' },
    { step: 4, title: 'Tokenization', desc: 'Split text into tokens using WordPiece tokenizer', input: '"artificial intelligence"', output: '["artificial", "intelligence"]', color: 'bg-amber-500' },
    { step: 5, title: 'Stop Word Removal', desc: 'Remove common words without significant meaning', input: '"the quick brown fox"', output: '"quick brown fox"', color: 'bg-rose-500' },
    { step: 6, title: 'Lemmatization', desc: 'Reduce words to their base dictionary form', input: '"running runs ran"', output: '"run run run"', color: 'bg-indigo-500' },
  ];

  const capabilities = [
    { icon: 'ri-global-line', bg: 'bg-teal-500/10', color: 'text-teal-600', title: 'Multilingual Support', desc: 'Supports 104 languages including English, Hindi, and Kannada' },
    { icon: 'ri-speed-line', bg: 'bg-sky-500/10', color: 'text-sky-600', title: 'Fast Inference', desc: '40% faster than BERT with 97% performance retention' },
    { icon: 'ri-brain-line', bg: 'bg-violet-500/10', color: 'text-violet-600', title: 'Contextual Understanding', desc: 'Bidirectional attention for deep semantic analysis' },
    { icon: 'ri-shield-check-line', bg: 'bg-amber-500/10', color: 'text-amber-600', title: 'Robust Detection', desc: 'Trained on diverse datasets for strong generalization' },
  ];

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 flex items-center justify-center bg-teal-500/10 rounded-lg">
          <i className="ri-cpu-line text-teal-600 text-base"></i>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Model Insights</h1>
          <p className="text-xs text-slate-500">Deep learning architecture and training methodology</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Model Architecture */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-brain-line text-teal-600 text-sm"></i>
            </div>
            <span className="text-sm font-semibold text-slate-800">Model Architecture</span>
          </div>
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Specs */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Primary Model: DistilBERT</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Model Name', value: 'distilbert-base-multilingual-cased', bg: 'bg-teal-500/8', text: 'text-teal-700', val: 'text-teal-900' },
                  { label: 'Architecture', value: 'Transformer (Distilled BERT)', bg: 'bg-sky-500/8', text: 'text-sky-700', val: 'text-sky-900' },
                  { label: 'Parameters', value: '134 Million', bg: 'bg-violet-500/8', text: 'text-violet-700', val: 'text-violet-900' },
                  { label: 'Layers', value: '6 Transformer Layers', bg: 'bg-amber-500/8', text: 'text-amber-700', val: 'text-amber-900' },
                ].map((item) => (
                  <div key={item.label} className={`p-3 rounded-lg ${item.bg}`}>
                    <div className={`text-xs ${item.text} mb-1`}>{item.label}</div>
                    <div className={`text-sm font-semibold ${item.val}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: Capabilities */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Model Capabilities</p>
              <div className="space-y-2">
                {capabilities.map((cap) => (
                  <div key={cap.title} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-7 h-7 flex items-center justify-center ${cap.bg} rounded-md flex-shrink-0`}>
                      <i className={`${cap.icon} ${cap.color} text-sm`}></i>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{cap.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{cap.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Training Datasets */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-database-2-line text-teal-600 text-sm"></i>
            </div>
            <span className="text-sm font-semibold text-slate-800">Training Datasets</span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((ds) => (
              <div key={ds.name} className="border border-slate-100 rounded-xl p-4 hover:border-teal-200 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 flex items-center justify-center ${ds.iconBg} rounded-lg`}>
                    <i className={`ri-database-2-line ${ds.iconColor} text-base`}></i>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{ds.name}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{ds.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-slate-900">{ds.count}</span>
                  <span className="text-xs text-slate-400">{ds.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preprocessing Pipeline */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-flow-chart text-teal-600 text-sm"></i>
            </div>
            <span className="text-sm font-semibold text-slate-800">Text Preprocessing Pipeline</span>
          </div>
          <div className="p-5 space-y-4">
            {pipeline.map((step) => (
              <div key={step.step} className="flex items-start gap-4">
                <div className={`w-8 h-8 ${step.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                  {step.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-800">{step.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{step.desc}</p>
                  <div className="p-3 bg-slate-50 rounded-lg font-mono text-xs space-y-1">
                    <div><span className="text-slate-400">Input: </span><span className="text-slate-700" dangerouslySetInnerHTML={{ __html: step.input }} /></div>
                    <div><span className="text-slate-400">Output: </span><span className="text-teal-700">{step.output}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Comparison Table */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-bar-chart-grouped-line text-teal-600 text-sm"></i>
            </div>
            <span className="text-sm font-semibold text-slate-800">Model Performance Comparison</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {['Model', 'Accuracy', 'Precision', 'Recall', 'F1-Score', 'Train Time', 'Inference'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {comparisonData.map((row) => (
                  <tr key={row.model} className={row.highlight ? 'bg-teal-500/5' : 'hover:bg-slate-50'}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.dot}`}></div>
                        <span className={`text-sm font-medium ${row.highlight ? 'text-teal-800' : 'text-slate-700'}`}>{row.model}</span>
                        {row.highlight && <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">Best</span>}
                      </div>
                    </td>
                    {[row.accuracy, row.precision, row.recall, row.f1, row.trainTime, row.inferSpeed].map((val, i) => (
                      <td key={i} className={`px-5 py-3.5 text-sm ${row.highlight ? 'font-semibold text-teal-800' : 'text-slate-600'}`}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-slate-50 bg-teal-500/5">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 flex items-center justify-center bg-teal-500/10 rounded-lg flex-shrink-0">
                <i className="ri-lightbulb-line text-teal-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">Why DistilBERT?</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  DistilBERT was selected as the primary model due to its superior accuracy (94.2%) and multilingual capabilities. While it has slightly longer inference time, the 5.8% accuracy improvement over Random Forest and its ability to understand context and semantic meaning makes it ideal for detecting sophisticated misinformation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
