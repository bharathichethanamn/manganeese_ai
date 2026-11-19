import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Sliders,
  Check,
  ShieldAlert,
  Cpu,
  Layers,
  Sparkles,
  Undo2,
  Table,
  CheckCheck,
  Info,
  ChevronRight,
  X,
  Gauge
} from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function UploadPage({ activeUploadInfo, onAnalysisComplete, onSwitchBack, onNavigate }) {
  // Stepper state: 1: Upload, 2: Map, 3: Quality & Clean, 4: Run Analysis
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Uploaded session state
  const [sessionId, setSessionId] = useState(null);
  const [filename, setFilename] = useState('');
  const [rawColumns, setRawColumns] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [standardFields, setStandardFields] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [mappingSummary, setMappingSummary] = useState(null);

  // Step 2: Mapping user selections (standard_field -> uploaded_column)
  const [userMapping, setUserMapping] = useState({});

  // Step 3: Quality validation & Cleaning states
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [cleanOptions, setCleanOptions] = useState({
    drop_invalid_rows: false,
    impute_numeric_median: true,
    remove_duplicates: true,
    normalize_zone_ids: true,
  });
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState(null);

  // Step 4: Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  const fileInputRef = useRef(null);

  // Step 1: File selection & drag-and-drop handlers
  const handleFileChange = (file) => {
    setUploadError(null);
    if (!file) return;

    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValidExt) {
      setUploadError('Invalid file type. Please upload a CSV, XLSX, or XLS spreadsheet.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 10 MB maximum limit.`);
      return;
    }

    if (file.size === 0) {
      setUploadError('The selected file is empty (0 bytes).');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Step 1: Upload file to backend
  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data;
      setSessionId(data.session_id);
      setFilename(data.filename);
      setRawColumns(data.raw_columns);
      setPreviewRows(data.preview_rows);
      setStandardFields(data.standard_fields);
      setMappings(data.mappings);
      setMappingSummary(data.summary);

      // Initialize user mapping state from server auto-mapping
      const initialMap = {};
      data.mappings.forEach((m) => {
        initialMap[m.standard_field] = m.uploaded_column || '';
      });
      setUserMapping(initialMap);

      // Advance to Step 2
      setCurrentStep(2);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to upload and parse file.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Step 2: Trigger Validation with current mappings
  const handleValidateMappings = async () => {
    setIsValidating(true);
    setUploadError(null);

    try {
      const res = await axios.post('/api/validate', {
        session_id: sessionId,
        column_mapping: userMapping,
      });

      setValidationResult(res.data);
      // Reset any previous clean result
      setCleanResult(null);
      setCurrentStep(3);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Validation request failed.';
      setUploadError(msg);
    } finally {
      setIsValidating(false);
    }
  };

  // Step 3: Apply selected cleaning options
  const handleApplyCleaning = async () => {
    setIsCleaning(true);
    try {
      const res = await axios.post('/api/clean', {
        session_id: sessionId,
        column_mapping: userMapping,
        drop_invalid_rows: cleanOptions.drop_invalid_rows,
        impute_numeric_median: cleanOptions.impute_numeric_median,
        remove_duplicates: cleanOptions.remove_duplicates,
        normalize_zone_ids: cleanOptions.normalize_zone_ids,
      });

      setCleanResult(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to apply data cleaning.');
    } finally {
      setIsCleaning(false);
    }
  };

  // Step 4: Run ML Inference on Uploaded Dataset
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await axios.post('/api/analyze-uploaded', {
        session_id: sessionId,
      });

      setAnalysisResult(res.data);

      if (onAnalysisComplete) {
        onAnalysisComplete({
          is_uploaded: true,
          filename: res.data.filename,
          confidence_score: res.data.confidence_score,
          score_rating: res.data.score_rating,
          score_color: res.data.score_color,
          zone_count: res.data.zone_count,
          zones: res.data.zones,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to run analysis on uploaded dataset.';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Download template helper
  const handleDownloadTemplate = () => {
    window.location.href = '/api/template';
  };

  // Reset Stepper
  const handleStartOver = () => {
    setSelectedFile(null);
    setSessionId(null);
    setValidationResult(null);
    setCleanResult(null);
    setAnalysisResult(null);
    setCurrentStep(1);
    setUploadError(null);
  };

  // Score color helper
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getScoreBadgeBg = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <UploadCloud className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Data Upload & Quality Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Import borehole exploration drilling, ore thickness assays, operational telemetry, or environmental observations.
            Features automated RapidFuzz fuzzy column mapping, syntax & domain quality audits, transparent score breakdown, and isolated ML inference.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Download CSV Template</span>
          </button>

          {activeUploadInfo?.is_uploaded && (
            <button
              onClick={onSwitchBack}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-all shadow-2xs"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Switch to Built-in Data</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-Step Stepper Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, title: 'Upload File', desc: 'CSV, XLSX up to 10MB' },
            { step: 2, title: 'Map Columns', desc: 'Fuzzy RapidFuzz Matcher' },
            { step: 3, title: 'Quality & Clean', desc: '0-100 Confidence Score' },
            { step: 4, title: 'Run Analysis', desc: 'ML Model Inference' },
          ].map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <div
                key={s.step}
                className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-slate-100 bg-slate-50/50 opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.step}
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-xs font-bold truncate ${
                      isCurrent ? 'text-blue-900' : isCompleted ? 'text-emerald-900' : 'text-slate-600'
                    }`}
                  >
                    {s.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: FILE UPLOAD */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all bg-white ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 scale-[1.005]'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFileChange(e.target.files[0])}
              className="hidden"
            />

            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Drag and drop your mine dataset here
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Supports comma-separated values (.csv) and Microsoft Excel (.xlsx, .xls) files up to 10 MB.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Browse Local Files</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-4 pt-2">
                <span>✓ Isolated memory session</span>
                <span>✓ RapidFuzz matching</span>
                <span>✓ Zero file persistence</span>
              </div>
            </div>
          </div>

          {/* Selected File Card */}
          {selectedFile && (
            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900">{selectedFile.name}</div>
                  <div className="text-xs text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Tabular Data'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Remove
                </button>

                <button
                  onClick={handleUploadSubmit}
                  disabled={isUploading}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-xs transition-all flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing & Matching Columns...</span>
                    </>
                  ) : (
                    <>
                      <span>Upload & Proceed to Mapping</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {uploadError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">File Upload Error</div>
                <div className="mt-0.5">{uploadError}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Mapping Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500">Uploaded Columns</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{rawColumns.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Found in {filename}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <div className="text-[11px] font-semibold text-emerald-700">Auto-Matched</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {mappingSummary?.auto_matched_count || 0}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Confidence ≥ 85%</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
              <div className="text-[11px] font-semibold text-amber-700">Needs Review</div>
              <div className="text-2xl font-black text-amber-700 mt-1">
                {mappingSummary?.needs_review_count || 0}
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">Confidence 60% – 84%</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500">Missing Standard Fields</div>
              <div className="text-2xl font-black text-slate-600 mt-1">
                {mappingSummary?.missing_count || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Optional features</div>
            </div>
          </div>

          {/* Interactive Mapping Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  Standard Field Column Mapping
                </h3>
                <p className="text-[11px] text-slate-500">
                  Review matches determined by RapidFuzz and aliases. Use dropdowns to override any mapping before validation.
                </p>
              </div>
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-medium">
                * Note: <span className="font-bold">zone_id</span> is required to identify mine blocks.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Standard ManganeseAI Field</th>
                    <th className="py-3 px-4">Expected Type</th>
                    <th className="py-3 px-4">Uploaded Column in File</th>
                    <th className="py-3 px-4">Match Confidence</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {standardFields.map((fieldMeta) => {
                    const stdKey = fieldMeta.field;
                    const selectedUploadedCol = userMapping[stdKey] || '';
                    const matchInfo = mappings.find((m) => m.standard_field === stdKey);
                    const confidence = matchInfo?.match_confidence || 0;
                    const status = !selectedUploadedCol
                      ? 'Missing'
                      : confidence >= 85
                      ? 'Auto-matched'
                      : 'Needs review';

                    return (
                      <tr key={stdKey} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{fieldMeta.label}</span>
                            {fieldMeta.required && (
                              <span className="text-rose-500 font-black text-xs" title="Required field">*</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 max-w-sm">
                            {fieldMeta.description}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] border border-slate-200">
                            {fieldMeta.type}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={selectedUploadedCol}
                            onChange={(e) => {
                              setUserMapping({
                                ...userMapping,
                                [stdKey]: e.target.value,
                              });
                            }}
                            className={`w-full max-w-xs text-xs font-semibold py-1.5 px-2.5 rounded-xl border transition-all ${
                              selectedUploadedCol
                                ? 'border-blue-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500'
                                : 'border-slate-200 bg-slate-50 text-slate-400'
                            }`}
                          >
                            <option value="">-- Unmapped (Not present) --</option>
                            {rawColumns.map((rc) => (
                              <option key={rc} value={rc}>
                                {rc}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3 px-4">
                          {selectedUploadedCol ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    confidence >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.max(10, confidence)}%` }}
                                ></div>
                              </div>
                              <span className="font-mono text-[11px] font-bold text-slate-600">
                                {confidence}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {status === 'Auto-matched' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Auto-matched
                            </span>
                          )}
                          {status === 'Needs review' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Needs review
                            </span>
                          )}
                          {status === 'Missing' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              Missing
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Step 2 Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to File Upload</span>
              </button>

              <button
                onClick={handleValidateMappings}
                disabled={isValidating}
                className="px-6 py-2.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Quality & Calculating Score...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Mappings & Audit Quality</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW DATA QUALITY & CLEAN */}
      {currentStep === 3 && validationResult && (
        <div className="space-y-6">
          {/* Main Quality Gauge Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Score Display */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50/70 border border-slate-100 text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Data Confidence Score
                </div>

                <div className="my-3 relative flex items-center justify-center">
                  <div
                    className={`text-5xl font-black tracking-tight ${
                      (cleanResult ? cleanResult.after_score : validationResult.confidence_score) >= 80
                        ? 'text-emerald-600'
                        : (cleanResult ? cleanResult.after_score : validationResult.confidence_score) >= 50
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {cleanResult ? cleanResult.after_score : validationResult.confidence_score}
                  </div>
                  <span className="text-xl font-bold text-slate-400 ml-1">/100</span>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getScoreColorClass(
                    cleanResult ? cleanResult.after_score : validationResult.confidence_score
                  )}`}
                >
                  {cleanResult ? cleanResult.after_rating : validationResult.score_rating} QUALITY
                </div>

                <div className="mt-4 text-[10px] text-slate-400 leading-tight">
                  {validationResult.disclaimer}
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="lg:col-span-2 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Transparent Score Breakdown & Deductions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Missing Values Penalty</div>
                      <div className="text-[10px] text-slate-400">Up to 30 points maximum</div>
                    </div>
                    <div className="font-mono font-bold text-rose-600">
                      -{validationResult.penalties?.missing_values_deduction || 0} pts
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Out-of-Range Penalty</div>
                      <div className="text-[10px] text-slate-400">Up to 40 points maximum</div>
                    </div>
                    <div className="font-mono font-bold text-rose-600">
                      -{validationResult.penalties?.out_of_range_deduction || 0} pts
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Missing Required Fields</div>
                      <div className="text-[10px] text-slate-400">15 points per required field</div>
                    </div>
                    <div className="font-mono font-bold text-rose-600">
                      -{validationResult.penalties?.missing_required_deduction || 0} pts
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Duplicate Records Penalty</div>
                      <div className="text-[10px] text-slate-400">Up to 10 points maximum</div>
                    </div>
                    <div className="font-mono font-bold text-rose-600">
                      -{validationResult.penalties?.duplicate_records_deduction || 0} pts
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-500">
                  <span>
                    Total Identified Issues:{' '}
                    <span className="font-bold text-slate-800">
                      {validationResult.issues_summary?.total_issues || 0}
                    </span>
                  </span>
                  <span>
                    Rows audited:{' '}
                    <span className="font-bold text-slate-800">
                      {validationResult.total_rows}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Issues Audit List */}
          {validationResult.issues_list && validationResult.issues_list.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Detailed Data Quality Issues ({validationResult.issues_list.length})
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">Showing detected abnormalities</span>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                {validationResult.issues_list.map((issue, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between gap-4 hover:bg-slate-50">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                          issue.severity === 'critical'
                            ? 'bg-rose-600'
                            : issue.severity === 'error'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                      ></span>
                      <div>
                        <div className="font-bold text-slate-800">
                          {issue.reason}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Column: <span className="font-mono text-slate-600 font-semibold">{issue.column}</span>
                          {issue.row ? ` • Row: ${issue.row}` : ''}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        issue.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : issue.severity === 'error'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Data Cleaning Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Data Cleaning & Normalization Options
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select transformations to apply to the uploaded dataset. Changes are recorded in an audit log and verified before ML inference.
                </p>
              </div>

              <button
                onClick={handleApplyCleaning}
                disabled={isCleaning}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                {isCleaning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cleaning Data...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply Selected Cleaning</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <label className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex items-start gap-3 cursor-pointer bg-slate-50/50">
                <input
                  type="checkbox"
                  checked={cleanOptions.impute_numeric_median}
                  onChange={(e) =>
                    setCleanOptions({ ...cleanOptions, impute_numeric_median: e.target.checked })
                  }
                  className="mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-800">Fill eligible numeric missing values with median</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Replaces empty cells in ore thickness, drill depth, rainfall, etc. with column median.
                  </div>
                </div>
              </label>

              <label className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex items-start gap-3 cursor-pointer bg-slate-50/50">
                <input
                  type="checkbox"
                  checked={cleanOptions.remove_duplicates}
                  onChange={(e) =>
                    setCleanOptions({ ...cleanOptions, remove_duplicates: e.target.checked })
                  }
                  className="mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-800">Remove duplicate zone/date records</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    De-duplicates conflicting mining observation rows to keep ground truth clean.
                  </div>
                </div>
              </label>

              <label className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex items-start gap-3 cursor-pointer bg-slate-50/50">
                <input
                  type="checkbox"
                  checked={cleanOptions.normalize_zone_ids}
                  onChange={(e) =>
                    setCleanOptions({ ...cleanOptions, normalize_zone_ids: e.target.checked })
                  }
                  className="mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-800">Normalize Zone IDs (e.g. Z7 → Z07)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Ensures standard 2-digit format compatible with GIS maps and charts.
                  </div>
                </div>
              </label>

              <label className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex items-start gap-3 cursor-pointer bg-slate-50/50">
                <input
                  type="checkbox"
                  checked={cleanOptions.drop_invalid_rows}
                  onChange={(e) =>
                    setCleanOptions({ ...cleanOptions, drop_invalid_rows: e.target.checked })
                  }
                  className="mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-800">Drop invalid / corrupted rows</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Filters out rows with missing required zone IDs or unrecoverable text errors.
                  </div>
                </div>
              </label>
            </div>

            {/* Clean Result Audit Log */}
            {cleanResult && (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Data Cleaning Applied Successfully</span>
                  </div>
                  <span className="text-[11px] font-mono">
                    Score: {cleanResult.before_score} →{' '}
                    <span className="text-emerald-700 font-extrabold">{cleanResult.after_score} / 100</span>
                  </span>
                </div>

                <div className="text-[11px] text-emerald-800 space-y-1 pl-5 list-disc">
                  {cleanResult.changes_log.map((log, i) => (
                    <div key={i}>• {log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 3 Navigation Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Mappings</span>
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <span>Proceed to ML Compatibility & Inference</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RUN ANALYSIS & ML COMPATIBILITY */}
      {currentStep === 4 && (
        <div className="space-y-6">
          {/* ML Modules Compatibility Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Machine Learning Module Compatibility
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Existing trained models inspect uploaded fields before inference. Missing features are never hallucinated or randomly filled.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {validationResult?.ml_compatibility?.modules ? (
                Object.entries(validationResult.ml_compatibility.modules).map(([modKey, mod]) => (
                  <div
                    key={modKey}
                    className={`p-4 rounded-2xl border transition-all ${
                      mod.compatible
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-800">{mod.name}</div>
                      {mod.compatible ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Unavailable
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-2">
                      {mod.compatible ? (
                        <span className="text-emerald-700">All required features mapped and valid.</span>
                      ) : (
                        <span className="text-rose-600">
                          Missing required features: {mod.missing_features?.join(', ') || 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">Loading module compatibility...</div>
              )}
            </div>

            {/* Unseen Mine Ground Truth Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Important Field Variance Notice</div>
                <div className="mt-0.5 leading-relaxed text-[11px] text-amber-800">
                  Pre-trained ML models were calibrated on Central Indian Manganese Belt ground truth.
                  Predictions on unseen or remote mines may exhibit higher variance. Always cross-reference AI reserve estimates with certified drill logs.
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Execution Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                Ready to Run AI Inference on Uploaded Mine Blocks
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Will compute reserve potential, monthly production forecasts, and shortfall risks for all uploaded zones.
              </div>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="px-6 py-3 text-xs font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running ML Inference...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Run Analysis on Dataset</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Error Alert */}
          {analysisError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Inference Error</div>
                <div className="mt-0.5">{analysisError}</div>
              </div>
            </div>
          )}

          {/* Analysis Success Banner */}
          {analysisResult && (
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      AI Analysis Complete & Active!
                    </h3>
                    <p className="text-xs text-emerald-300">
                      Processed {analysisResult.zone_count} mining zones from{' '}
                      <span className="font-semibold">{analysisResult.filename}</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-sm"
                  >
                    View Main Dashboard
                  </button>
                  <button
                    onClick={() => onNavigate('reserve')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                  >
                    Explore Reserve Intelligence
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
                  <div className="text-[10px] text-slate-300">Active Zones</div>
                  <div className="text-lg font-bold text-white mt-0.5">{analysisResult.zone_count}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
                  <div className="text-[10px] text-slate-300">Data Quality Score</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    {analysisResult.confidence_score} / 100
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
                  <div className="text-[10px] text-slate-300">Source Isolation</div>
                  <div className="text-lg font-bold text-teal-300 mt-0.5">Session Memory</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
                  <div className="text-[10px] text-slate-300">Target Field</div>
                  <div className="text-lg font-bold text-white mt-0.5">Active Session</div>
                </div>
              </div>
            </div>
          )}

          {/* Back button */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Quality Audit</span>
            </button>

            <button
              onClick={handleStartOver}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Upload Another Dataset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
