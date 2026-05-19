import { useState } from 'react';

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState('incorrect');
  const [predictionId, setPredictionId] = useState('');
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setPredictionId('');
      setComments('');
    }, 3000);
  };

  const ratingLabels: Record<number, string> = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

  const feedbackTypes = [
    { id: 'incorrect', icon: 'ri-error-warning-line', iconBg: 'bg-rose-500/10', iconColor: 'text-rose-600', label: 'Incorrect Prediction', desc: 'Report wrong classification' },
    { id: 'bug', icon: 'ri-bug-line', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600', label: 'Technical Issue', desc: 'Report bugs or errors' },
    { id: 'suggestion', icon: 'ri-lightbulb-line', iconBg: 'bg-teal-500/10', iconColor: 'text-teal-600', label: 'Suggestion', desc: 'Share improvement ideas' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 flex items-center justify-center bg-teal-500/10 rounded-lg">
          <i className="ri-feedback-line text-teal-600 text-base"></i>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Submit Feedback</h1>
          <p className="text-xs text-slate-500">Help us improve our AI detection system by reporting issues</p>
        </div>
      </div>

      {/* Success Banner */}
      {submitted && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5">
          <div className="w-7 h-7 flex items-center justify-center bg-emerald-100 rounded-lg flex-shrink-0">
            <i className="ri-checkbox-circle-fill text-emerald-600 text-sm"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Feedback submitted successfully!</p>
            <p className="text-xs text-emerald-600">Thank you — we'll review your feedback shortly.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Rating */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-star-line text-teal-600 text-sm"></i>
              </div>
              <span className="text-sm font-semibold text-slate-800">Overall Experience</span>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="w-10 h-10 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <i className={`text-2xl transition-all ${star <= (hoveredRating || rating) ? 'ri-star-fill text-amber-400' : 'ri-star-line text-slate-300'}`}></i>
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-3 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                    {ratingLabels[rating]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Feedback Type */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-list-check text-teal-600 text-sm"></i>
              </div>
              <span className="text-sm font-semibold text-slate-800">Feedback Type</span>
            </div>
            <div className="p-5 grid grid-cols-3 gap-3">
              {feedbackTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFeedbackType(type.id)}
                  className={`p-4 border-2 rounded-xl transition-all cursor-pointer text-center ${
                    feedbackType === type.id
                      ? 'border-teal-500 bg-teal-500/5'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 flex items-center justify-center ${type.iconBg} rounded-lg mx-auto mb-2`}>
                    <i className={`${type.icon} ${type.iconColor} text-base`}></i>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mb-0.5">{type.label}</p>
                  <p className="text-xs text-slate-400">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-edit-line text-teal-600 text-sm"></i>
              </div>
              <span className="text-sm font-semibold text-slate-800">Details</span>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Prediction ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={predictionId}
                  onChange={(e) => setPredictionId(e.target.value)}
                  placeholder="e.g., pred_001"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
                />
                <p className="text-xs text-slate-400 mt-1">Find the prediction ID in your History page</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Detailed Comments <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setComments(e.target.value);
                  }}
                  placeholder="Describe the issue or share your feedback in detail..."
                  rows={5}
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors resize-none"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-slate-400">Be specific to help us address your concern</p>
                  <p className={`text-xs font-medium ${comments.length >= 480 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {comments.length} / 500
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-send-plane-line mr-2"></i>
                Submit Feedback
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-question-line text-teal-600 text-sm"></i>
              </div>
              <span className="text-sm font-semibold text-slate-800">Need Help?</span>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Check our FAQ section or contact support for immediate assistance with any issues.
              </p>
              <button className="w-full px-3 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer">
                <i className="ri-customer-service-line mr-1.5"></i>
                Contact Support
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-heart-line text-teal-600 text-sm"></i>
              </div>
              <span className="text-sm font-semibold text-slate-800">Your Voice Matters</span>
            </div>
            <div className="p-5 space-y-3">
              {[
                { icon: 'ri-shield-check-line', text: 'Improves detection accuracy' },
                { icon: 'ri-bug-line', text: 'Helps fix technical issues' },
                { icon: 'ri-lightbulb-line', text: 'Shapes new features' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 flex items-center justify-center bg-teal-500/10 rounded-md flex-shrink-0">
                    <i className={`${item.icon} text-teal-600 text-xs`}></i>
                  </div>
                  <span className="text-xs text-slate-600">{item.text}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-50 flex items-center gap-1.5 text-xs text-teal-600 font-medium">
                <i className="ri-heart-fill text-rose-400"></i>
                Thank you for contributing!
              </div>
            </div>
          </div>

          <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-teal-700 mb-1">Response Time</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              We review all feedback within <strong className="text-slate-700">24–48 hours</strong> and may reach out for clarification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
