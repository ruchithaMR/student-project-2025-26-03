import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FakeNewsAPI from '../../services/api';

export default function VerifyImagePage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxFileSize = 10 * 1024 * 1024;

  const handleFileSelect = (file: File) => {
    if (!allowedTypes.includes(file.type)) return;
    if (file.size > maxFileSize) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setOcrProgress(0);
    setError('');
    
    // Show progress animation
    const progressInterval = setInterval(() => {
      setOcrProgress((prev) => Math.min(prev + 10, 90));
    }, 200);
    
    try {
      // Call the actual API
      const result = await FakeNewsAPI.predictImage(selectedFile);
      
      clearInterval(progressInterval);
      setOcrProgress(100);
      
      // Store result in sessionStorage to pass to results page
      sessionStorage.setItem('analysisResult', JSON.stringify({
        ...result,
        analyzedText: result.extracted_text || 'Image analysis completed',
        type: 'image'
      }));
      
      // Short delay before navigation
      setTimeout(() => {
        setIsProcessing(false);
        navigate('/results?type=image');
      }, 500);
      
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'Failed to process image. Please try again.');
      console.error('Image analysis error:', err);
      setIsProcessing(false);
      setOcrProgress(0);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setOcrProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const steps = [
    { icon: 'ri-upload-2-line', label: 'Upload Image', desc: 'Drag & drop or select file' },
    { icon: 'ri-scan-line', label: 'OCR Extraction', desc: 'Extract text from image' },
    { icon: 'ri-brain-line', label: 'AI Analysis', desc: 'Analyze with ML models' },
    { icon: 'ri-shield-check-line', label: 'Results', desc: 'Get confidence score' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-violet-500/10 rounded-lg flex-shrink-0">
          <i className="ri-image-line text-violet-600 text-base sm:text-lg"></i>
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-slate-900">Screenshot Verification</h1>
          <p className="text-xs text-slate-500 truncate">Upload images containing news content for OCR extraction and analysis</p>
        </div>
      </div>

      {/* Upload Card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 sm:p-6 mb-4">
        {!selectedFile ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
              isDragging ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50/60'
            }`}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-violet-500/10 rounded-xl mx-auto mb-3 sm:mb-4">
              <i className="ri-upload-cloud-line text-violet-600 text-xl sm:text-2xl"></i>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              {isDragging ? 'Drop image here' : 'Upload Screenshot or Image'}
            </h3>
            <p className="text-xs text-slate-500 mb-3 sm:mb-4">Drag and drop your image here, or click to browse</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><i className="ri-file-image-line"></i>JPEG, PNG, WebP</span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1"><i className="ri-file-line"></i>Max 10MB</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              className="hidden"
            />
          </div>
        ) : (
          <div>
            {/* Preview */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Image Preview</h3>
              <button onClick={handleRemove} className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap">
                <i className="ri-delete-bin-line"></i>Remove
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl overflow-hidden mb-4 border border-slate-100">
              <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-60 sm:max-h-72 object-contain mx-auto" />
            </div>

            {/* File Info */}
            <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-lg p-3 mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-violet-500/10 rounded-lg flex-shrink-0">
                <i className="ri-file-image-line text-violet-600 text-sm"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {selectedFile.type.split('/')[1].toUpperCase()}</p>
              </div>
              <i className="ri-checkbox-circle-fill text-violet-500 text-lg flex-shrink-0"></i>
            </div>

            {/* OCR Progress */}
            {isProcessing && (
              <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <i className="ri-scan-line text-sky-600 text-lg animate-pulse flex-shrink-0"></i>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">OCR Processing</p>
                    <p className="text-xs text-slate-500">Extracting text from image...</p>
                  </div>
                  <span className="text-sm font-bold text-sky-600 flex-shrink-0">{ocrProgress}%</span>
                </div>
                <div className="w-full bg-sky-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-sky-500 h-full transition-all duration-300 rounded-full" style={{ width: `${ocrProgress}%` }}></div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-3 flex items-start gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-rose-50 border border-rose-200 rounded-lg">
                <i className="ri-error-warning-line text-rose-500 text-sm mt-0.5 flex-shrink-0"></i>
                <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={isProcessing}
              className={`w-full py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
                isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
              }`}
            >
              {isProcessing
                ? <><i className="ri-loader-4-line animate-spin"></i><span className="hidden sm:inline">Processing OCR and analyzing...</span><span className="sm:hidden">Processing...</span></>
                : <><i className="ri-scan-line"></i><span className="hidden sm:inline">Extract Text &amp; Analyze</span><span className="sm:hidden">Analyze</span></>
              }
            </button>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {[
          { icon: 'ri-eye-line', title: 'OCR Technology', desc: 'Advanced Optical Character Recognition extracts text from screenshots, social media posts, and news images with high accuracy.' },
          { icon: 'ri-translate-2', title: 'Multilingual OCR', desc: 'Supports text extraction in English, Hindi, and Kannada with automatic language detection for accurate analysis.' },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 sm:p-5 flex items-start gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-violet-500/10 rounded-lg flex-shrink-0">
              <i className={`${card.icon} text-violet-600 text-sm`}></i>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{card.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-900">How Screenshot Verification Works</h2>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-violet-500/10 rounded-xl mx-auto mb-2">
                <i className={`${step.icon} text-violet-600 text-sm sm:text-base`}></i>
              </div>
              <p className="text-xs font-semibold text-slate-800 mb-0.5">{step.label}</p>
              <p className="text-xs text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}