import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const systemUsageData = [
  { date: 'Jan 15', predictions: 245, users: 89 },
  { date: 'Jan 16', predictions: 312, users: 102 },
  { date: 'Jan 17', predictions: 289, users: 95 },
  { date: 'Jan 18', predictions: 401, users: 134 },
  { date: 'Jan 19', predictions: 378, users: 121 },
  { date: 'Jan 20', predictions: 456, users: 156 },
  { date: 'Jan 21', predictions: 523, users: 178 },
];

const userActivityData = [
  { hour: '00:00', active: 12 },
  { hour: '04:00', active: 8 },
  { hour: '08:00', active: 45 },
  { hour: '12:00', active: 89 },
  { hour: '16:00', active: 112 },
  { hour: '20:00', active: 78 },
  { hour: '23:00', active: 34 },
];

const predictionVolumeData = [
  { type: 'Text', count: 8234, color: '#14B8A6' },
  { type: 'URL', count: 5891, color: '#0EA5E9' },
  { type: 'Image', count: 2456, color: '#8B5CF6' },
];

const usersData = [
  { id: 1, name: 'Rajesh Kumar', email: 'rajesh.k@email.com', predictions: 234, joined: '2024-01-10', status: 'Active' },
  { id: 2, name: 'Priya Sharma', email: 'priya.s@email.com', predictions: 189, joined: '2024-01-12', status: 'Active' },
  { id: 3, name: 'Amit Patel', email: 'amit.p@email.com', predictions: 156, joined: '2024-01-08', status: 'Active' },
  { id: 4, name: 'Sneha Reddy', email: 'sneha.r@email.com', predictions: 98, joined: '2024-01-15', status: 'Inactive' },
  { id: 5, name: 'Vikram Singh', email: 'vikram.s@email.com', predictions: 267, joined: '2024-01-05', status: 'Active' },
  { id: 6, name: 'Ananya Iyer', email: 'ananya.i@email.com', predictions: 145, joined: '2024-01-18', status: 'Active' },
];

const feedbackData = [
  { id: 1, user: 'Rajesh Kumar', prediction: 'Fake', feedback: 'The prediction was incorrect. This news was verified by multiple sources.', date: '2024-01-20', status: 'Pending' },
  { id: 2, user: 'Priya Sharma', prediction: 'Real', feedback: 'Accurate detection. The system correctly identified the authentic news.', date: '2024-01-19', status: 'Reviewed' },
  { id: 3, user: 'Amit Patel', prediction: 'Fake', feedback: 'False positive. The article was from a credible source.', date: '2024-01-18', status: 'Pending' },
  { id: 4, user: 'Sneha Reddy', prediction: 'Real', feedback: 'Good analysis but confidence score was too low.', date: '2024-01-17', status: 'Reviewed' },
];

const systemLogs = [
  { id: 1, timestamp: '2024-01-21 14:32:15', level: 'INFO', message: 'Model inference completed successfully', module: 'ML Engine' },
  { id: 2, timestamp: '2024-01-21 14:31:08', level: 'WARNING', message: 'High API request rate detected from IP 192.168.1.45', module: 'Security' },
  { id: 3, timestamp: '2024-01-21 14:29:42', level: 'INFO', message: 'User authentication successful', module: 'Auth' },
  { id: 4, timestamp: '2024-01-21 14:28:19', level: 'ERROR', message: 'OCR processing failed for image ID 8923', module: 'OCR Engine' },
  { id: 5, timestamp: '2024-01-21 14:27:03', level: 'INFO', message: 'Database backup completed', module: 'Database' },
  { id: 6, timestamp: '2024-01-21 14:25:47', level: 'INFO', message: 'Cache cleared successfully', module: 'System' },
];

const datasetsList = [
  { name: 'ISOT Fake News', iconBg: 'bg-teal-500/10', iconColor: 'text-teal-600', total: '44,898', fake: '23,481', real: '21,417', updated: '2024-01-15' },
  { name: 'LIAR Dataset', iconBg: 'bg-sky-500/10', iconColor: 'text-sky-600', total: '12,836', fake: '6,892', real: '5,944', updated: '2024-01-12' },
  { name: 'FakeNewsNet', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600', total: '23,196', fake: '11,234', real: '11,962', updated: '2024-01-18' },
  { name: 'WELFake', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600', total: '72,134', fake: '35,028', real: '37,106', updated: '2024-01-10' },
  { name: 'NELA-GT', iconBg: 'bg-rose-500/10', iconColor: 'text-rose-600', total: '1,127,497', fake: '—', real: '194 sources', updated: '2024-01-20' },
  { name: 'Multilingual Data', iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-600', total: '18,456', fake: '6,222 (KN)', real: '12,234 (HI)', updated: '2024-01-19' },
];

type TabType = 'overview' | 'users' | 'datasets' | 'feedback' | 'logs';

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'ri-dashboard-line' },
  { id: 'users', label: 'Users', icon: 'ri-user-line' },
  { id: 'datasets', label: 'Datasets', icon: 'ri-database-2-line' },
  { id: 'feedback', label: 'Feedback', icon: 'ri-feedback-line' },
  { id: 'logs', label: 'System Logs', icon: 'ri-file-list-line' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 flex items-center justify-center bg-teal-500/10 rounded-lg">
          <i className="ri-shield-keyhole-line text-teal-600 text-base"></i>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Admin Panel</h1>
          <p className="text-xs text-slate-500">System monitoring and management dashboard</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-1 mb-5 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <i className={tab.icon}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: 'ri-user-line', bg: 'bg-teal-500/10', color: 'text-teal-600', value: '1,247', label: 'Total Users', badge: '+12%', badgeColor: 'bg-emerald-50 text-emerald-600' },
              { icon: 'ri-bar-chart-box-line', bg: 'bg-sky-500/10', color: 'text-sky-600', value: '16,581', label: 'Total Predictions', badge: '+8%', badgeColor: 'bg-emerald-50 text-emerald-600' },
              { icon: 'ri-pulse-line', bg: 'bg-violet-500/10', color: 'text-violet-600', value: '178', label: 'Active Users', badge: 'Live', badgeColor: 'bg-slate-100 text-slate-500' },
              { icon: 'ri-cpu-line', bg: 'bg-amber-500/10', color: 'text-amber-600', value: '1.2s', label: 'Avg Response', badge: '98.7%', badgeColor: 'bg-emerald-50 text-emerald-600' },
            ].map((card) => (
              <div key={card.label} className="bg-white border border-slate-100 rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 flex items-center justify-center ${card.bg} rounded-lg`}>
                    <i className={`${card.icon} ${card.color} text-sm`}></i>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${card.badgeColor}`}>{card.badge}</span>
                </div>
                <p className="text-xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50">
                <span className="text-sm font-semibold text-slate-800">System Usage Trends</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={systemUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="predictions" stroke="#14B8A6" strokeWidth={2} dot={false} name="Predictions" />
                    <Line type="monotone" dataKey="users" stroke="#0EA5E9" strokeWidth={2} dot={false} name="Active Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50">
                <span className="text-sm font-semibold text-slate-800">User Activity by Hour</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={userActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="active" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Active Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Prediction Volume */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <span className="text-sm font-semibold text-slate-800">Prediction Volume by Type</span>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={predictionVolumeData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="count" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {predictionVolumeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {predictionVolumeData.map((item) => (
                  <div key={item.type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-medium text-slate-700">{item.type} Verification</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS ── */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">User Management</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search users..."
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer">
                <i className="ri-download-line"></i>Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {['User', 'Email', 'Predictions', 'Joined', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usersData.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-700 text-xs font-bold flex-shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-800 whitespace-nowrap">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{user.email}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{user.predictions}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{user.joined}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <button className="text-teal-600 hover:text-teal-700 cursor-pointer"><i className="ri-eye-line text-sm"></i></button>
                        <button className="text-slate-400 hover:text-slate-600 cursor-pointer"><i className="ri-edit-line text-sm"></i></button>
                        <button className="text-rose-400 hover:text-rose-600 cursor-pointer"><i className="ri-delete-bin-line text-sm"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DATASETS ── */}
      {activeTab === 'datasets' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Dataset Management</span>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer">
                <i className="ri-upload-line"></i>Upload Dataset
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasetsList.map((ds) => (
                <div key={ds.name} className="border border-slate-100 rounded-xl p-4 hover:border-teal-200 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 flex items-center justify-center ${ds.iconBg} rounded-lg`}>
                      <i className={`ri-database-2-line ${ds.iconColor} text-base`}></i>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mb-3">{ds.name}</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Total Records</span><span className="font-semibold text-slate-700">{ds.total}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Fake / False</span><span className="font-semibold text-rose-600">{ds.fake}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Real / True</span><span className="font-semibold text-emerald-600">{ds.real}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Last Updated</span><span className="font-semibold text-slate-600">{ds.updated}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Performance */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <span className="text-sm font-semibold text-slate-800">Model Performance Monitoring</span>
            </div>
            <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Accuracy', value: '94.2%', delta: '+2.1%', bg: 'bg-teal-500/10', text: 'text-teal-700', val: 'text-teal-900' },
                { label: 'Precision', value: '91.6%', delta: '+1.8%', bg: 'bg-sky-500/10', text: 'text-sky-700', val: 'text-sky-900' },
                { label: 'Recall', value: '88.7%', delta: '+1.3%', bg: 'bg-violet-500/10', text: 'text-violet-700', val: 'text-violet-900' },
                { label: 'F1-Score', value: '90.1%', delta: '+1.6%', bg: 'bg-amber-500/10', text: 'text-amber-700', val: 'text-amber-900' },
              ].map((m) => (
                <div key={m.label} className={`p-4 rounded-xl ${m.bg}`}>
                  <p className={`text-xs ${m.text} mb-1`}>{m.label}</p>
                  <p className={`text-2xl font-bold ${m.val}`}>{m.value}</p>
                  <p className={`text-xs ${m.text} mt-1`}>{m.delta} from last week</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FEEDBACK ── */}
      {activeTab === 'feedback' && (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">User Feedback Review</span>
            <div className="flex gap-1.5">
              {['All', 'Pending', 'Reviewed'].map((f) => (
                <button key={f} className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer">{f}</button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {feedbackData.map((fb) => (
              <div key={fb.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-700 text-xs font-bold flex-shrink-0">
                      {fb.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{fb.user}</p>
                      <p className="text-xs text-slate-400">{fb.date}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${fb.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {fb.status}
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Prediction:</span>
                  <span className={`text-xs font-semibold ${fb.prediction === 'Fake' ? 'text-rose-600' : 'text-emerald-600'}`}>{fb.prediction}</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">{fb.feedback}</p>
                {fb.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer">Mark as Reviewed</button>
                    <button className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer">Investigate</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LOGS ── */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">System Logs</span>
            <div className="flex gap-1.5">
              {['All', 'Errors', 'Warnings'].map((f) => (
                <button key={f} className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer">{f}</button>
              ))}
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer">
                <i className="ri-refresh-line"></i>Refresh
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {systemLogs.map((log) => (
              <div key={log.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-slate-400 whitespace-nowrap">{log.timestamp}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                    log.level === 'ERROR' ? 'bg-rose-50 text-rose-600' :
                    log.level === 'WARNING' ? 'bg-amber-50 text-amber-600' :
                    'bg-teal-50 text-teal-600'
                  }`}>{log.level}</span>
                  <span className="text-slate-400 whitespace-nowrap">[{log.module}]</span>
                  <span className="text-slate-700 flex-1">{log.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
