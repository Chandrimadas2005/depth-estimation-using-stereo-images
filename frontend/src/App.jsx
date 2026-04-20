import React, { useState } from 'react';
import { 
  Camera, Layers, Download, Activity, Info, 
  Cpu, Focus, Upload, Zap, CheckCircle2, 
  FileText, AlertCircle 
} from 'lucide-react';

const App = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('stereo');
  const [images, setImages] = useState({ left: null, right: null });
  const [files, setFiles] = useState({ left: null, right: null });
  const [baseline, setBaseline] = useState("0.065");
  const [isDone, setIsDone] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileUpload = (side, e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [side]: file }));
      const reader = new FileReader();
      reader.onload = (event) => setImages(prev => ({ ...prev, [side]: event.target.result }));
      reader.readAsDataURL(file);
      setIsDone(false);
    }
  };

  const startAnalysis = async () => {
    if (!files.left || !files.right) return;
    setAnalyzing(true);
    
    const formData = new FormData();
    formData.append('left_image', files.left);
    formData.append('right_image', files.right);
    formData.append('baseline', baseline);

    try {
      const response = await fetch('http://127.0.0.1:5000/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setResults(data);
      setIsDone(true);
      setAnalyzing(false);
      setActiveTab('depth');
    } catch (error) {
      console.error("Analysis failed", error);
      setAnalyzing(false);
      alert("Error connecting to Python backend. Ensure app.py is running.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans p-4 md:p-8">
      {/* Header */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg"><Layers className="text-white w-5 h-5" /></div>
          <h1 className="text-2xl font-bold tracking-tight">StereoVision <span className="text-indigo-400 font-light">Pro</span></h1>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase">Engine Online</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#16161a] border border-white/5 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-6 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Inputs
            </h2>
            
            <div className="space-y-4">
              {['left', 'right'].map((side) => (
                <div key={side} className="relative group">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">{side} lens</label>
                  <div className={`border-2 border-dashed rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer transition-all ${images[side] ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 hover:border-indigo-500/30'}`}>
                    {images[side] ? <img src={images[side]} className="w-full h-full object-cover rounded-xl" /> : <Camera className="w-6 h-6 text-slate-600" />}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(side, e)} />
                  </div>
                </div>
              ))}
              
              <div className="pt-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Baseline (Meters)</label>
                <input type="number" step="0.001" value={baseline} onChange={(e) => setBaseline(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-indigo-400 font-mono focus:border-indigo-500 outline-none" />
              </div>
            </div>

            <button onClick={startAnalysis} disabled={analyzing || !images.left || !images.right} className={`w-full mt-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${analyzing ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'}`}>
              {analyzing ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
              {analyzing ? 'PROCESSING...' : 'RUN DEPTH ENGINE'}
            </button>
          </div>
        </div>

        {/* Main Viewport */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#16161a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex gap-2">
              <button onClick={() => setActiveTab('stereo')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'stereo' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Source</button>
              <button onClick={() => setActiveTab('depth')} disabled={!isDone} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'depth' ? 'bg-indigo-600 text-white' : 'text-slate-500 disabled:opacity-30'}`}>Heatmap</button>
            </div>
            
            <div className="aspect-[4/3] bg-black relative flex items-center justify-center">
              {activeTab === 'stereo' ? (
                <div className="grid grid-cols-2 gap-1 w-full h-full p-2">
                  <div className="bg-slate-900 rounded-xl overflow-hidden">{images.left && <img src={images.left} className="w-full h-full object-cover" />}</div>
                  <div className="bg-slate-900 rounded-xl overflow-hidden">{images.right && <img src={images.right} className="w-full h-full object-cover" />}</div>
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <img src={results?.heatmapUrl} className="w-full h-full object-contain" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
                       <Focus className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                       <p className="text-3xl font-mono font-bold text-white">{results?.targetDepth} cm</p>
                       <p className="text-[10px] text-indigo-300 uppercase tracking-widest mt-1">Calculated Point</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#16161a] border border-white/5 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Live Data
            </h2>
            
            <div className="space-y-6">
              <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-center">
                <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Z-Axis Depth</p>
                <p className={`text-5xl font-mono font-bold ${isDone ? 'text-white' : 'text-slate-800'}`}>
                  {isDone ? results.targetDepth : '0.0'}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-bold">CENTIMETERS</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'Focal Length', val: results?.actualFocal, unit: 'mm' },
                  { label: '35mm Equiv', val: results?.focal35mm, unit: 'mm' },
                  { label: 'Min Range', val: results?.minRange, unit: 'cm' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{item.label}</span>
                    <span className={`text-xs font-mono font-bold ${isDone ? 'text-indigo-400' : 'text-slate-800'}`}>
                      {isDone ? `${item.val} ${item.unit}` : '--'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;