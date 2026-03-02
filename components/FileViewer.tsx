
import React from 'react';

interface FileViewerProps {
  fileName: string;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ fileName, onClose }) => {
  const isImage = fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg') || fileName.toLowerCase().endsWith('.png');
  const isPdf = fileName.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleUp">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <i className={`fas ${isPdf ? 'fa-file-pdf' : 'fa-file-image'}`}></i>
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Document Viewer</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{fileName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8 bg-slate-100 flex items-center justify-center min-h-[400px]">
          {isImage ? (
            <img 
              src={`https://picsum.photos/seed/${fileName}/1200/800`} 
              alt={fileName} 
              className="max-w-full h-auto rounded-xl shadow-lg border border-white/20"
              referrerPolicy="no-referrer"
            />
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
              <div className="w-full max-w-2xl aspect-[1/1.4] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                <div className="h-12 bg-slate-800 flex items-center px-4 justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PDF Preview: {fileName}</div>
                </div>
                <div className="flex-1 p-10 space-y-6">
                  <div className="h-8 bg-slate-100 rounded w-3/4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-50 rounded w-full"></div>
                    <div className="h-4 bg-slate-50 rounded w-full"></div>
                    <div className="h-4 bg-slate-50 rounded w-5/6"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-10">
                    <div className="h-32 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200"></div>
                    <div className="h-32 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200"></div>
                  </div>
                  <div className="pt-10 flex justify-end">
                    <div className="h-10 bg-blue-600 rounded-lg w-32"></div>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Mock PDF Viewer for {fileName}</p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-white rounded-[2rem] mx-auto flex items-center justify-center text-slate-200 shadow-xl">
                <i className="fas fa-file-alt text-3xl"></i>
              </div>
              <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Unsupported File Format</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-4">
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
          >
            <i className="fas fa-print mr-2"></i> Print
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
