import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, Image as ImageIcon, FileText, Upload, Plus, Search, 
  HardDrive, Grid, List, ArrowLeft, Download, Film, Music, Sparkles, ChevronRight
} from 'lucide-react';

const BOT_TOKEN = "8851205680:AAFl-e_KjW2qFN1rGQ-kJ80gcdWDlyPRlyo";
const CHANNEL_ID = "-1003983369108";

export default function App() {
  const [activeTab, setActiveTab] = useState('gallery');
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState(['Camera', 'Screenshots', 'Documents']);
  const [currentFolder, setCurrentFolder] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const cached = localStorage.getItem('tg_cloud_media_v2');
    if (cached) {
      try { setFiles(JSON.parse(cached)); } catch (e) {}
    }
  }, []);

  const saveFiles = (newFiles) => {
    setFiles(newFiles);
    localStorage.setItem('tg_cloud_media_v2', JSON.stringify(newFiles));
  };

  const handleUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (!uploadedFiles.length) return;

    setIsUploading(true);
    setUploadProgress(10);

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const formData = new FormData();
      formData.append('chat_id', CHANNEL_ID);

      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const endpoint = isImg ? 'sendPhoto' : isVid ? 'sendVideo' : 'sendDocument';
      const field = isImg ? 'photo' : isVid ? 'video' : 'document';

      formData.append(field, file);
      formData.append('caption', JSON.stringify({
        name: file.name,
        size: file.size,
        folder: currentFolder,
        date: new Date().toISOString()
      }));

      try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (data.ok) {
          let fileId = '';
          if (isImg) fileId = data.result.photo.slice(-1)[0].file_id;
          else if (isVid) fileId = data.result.video.file_id;
          else fileId = data.result.document.file_id;

          const pathRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
          const pathData = await pathRes.json();
          const fileUrl = pathData.ok ? `https://api.telegram.org/file/bot${BOT_TOKEN}/${pathData.result.file_path}` : '';

          const newItem = {
            id: data.result.message_id,
            name: file.name,
            size: file.size,
            type: file.type,
            folder: currentFolder,
            url: fileUrl,
            fileId,
            date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
          };

          saveFiles([newItem, ...files]);
        }
      } catch (err) {
        console.error(err);
      }
      setUploadProgress(Math.round(((i + 1) / uploadedFiles.length) * 100));
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'gallery') {
      return matchesSearch && (f.type.startsWith('image/') || f.type.startsWith('video/'));
    }
    if (activeTab === 'drive') {
      return matchesSearch && (currentFolder ? f.folder === currentFolder : true);
    }
    return matchesSearch;
  });

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      <header className="px-4 pt-12 pb-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          {currentFolder && activeTab === 'drive' ? (
            <button onClick={() => setCurrentFolder('')} className="p-1.5 rounded-full bg-slate-800 active:scale-95">
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
              <HardDrive size={20} className="text-white" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
              {activeTab === 'gallery' ? 'Gallery' : activeTab === 'drive' ? (currentFolder || 'Cloud Drive') : 'Storage'}
            </h1>
            <p className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Telegram Private Cloud
            </p>
          </div>
        </div>

        {activeTab === 'drive' && (
          <button 
            onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 active:scale-95"
          >
            {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
          </button>
        )}
      </header>

      <div className="px-4 py-2.5 bg-slate-950">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'gallery' ? "Search photos & videos..." : "Search cloud documents..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-24">
        {isUploading && (
          <div className="my-3 p-3 bg-sky-950/60 border border-sky-800 rounded-2xl flex flex-col gap-2">
            <div className="flex justify-between text-xs text-sky-300 font-semibold">
              <span>Backing up to Telegram Channel...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-500 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="mt-2">
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <ImageIcon size={52} className="stroke-[1.2] mb-3 text-slate-600" />
                <p className="text-sm font-medium">No media uploaded yet</p>
                <p className="text-xs text-slate-600 mt-1">Tap the + button below to backup photos</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setSelectedMedia(file)}
                    className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 active:opacity-80 transition"
                  >
                    {file.type.startsWith('video/') ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <Film size={26} className="text-slate-400" />
                      </div>
                    ) : (
                      <img 
                        src={file.url} 
                        alt={file.name} 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'drive' && (
          <div className="mt-2 space-y-4">
            {!currentFolder && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Folders</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {folders.map((f) => (
                    <div
                      key={f}
                      onClick={() => setCurrentFolder(f)}
                      className="p-3 bg-slate-900 border border-slate-800/80 rounded-2xl flex items-center justify-between active:scale-98 active:bg-slate-800 transition"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                          <Folder size={18} />
                        </div>
                        <span className="text-sm font-medium text-slate-200 truncate">{f}</span>
                      </div>
                      <ChevronRight size={16} className="text-slate-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                {currentFolder ? `${currentFolder} Files` : 'All Documents & Files'}
              </p>

              {filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <FileText size={48} className="stroke-[1.2] mb-2 text-slate-600" />
                  <p className="text-sm font-medium">No files found</p>
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.id} 
                      onClick={() => setSelectedMedia(file)}
                      className="p-3 bg-slate-900 border border-slate-800/70 rounded-2xl flex items-center justify-between active:bg-slate-800"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                          {file.type.startsWith('image/') ? <ImageIcon size={18} /> : 
                           file.type.startsWith('video/') ? <Film size={18} /> : 
                           file.type.startsWith('audio/') ? <Music size={18} /> : <FileText size={18} />}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{file.date} • {formatSize(file.size)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.id} 
                      onClick={() => setSelectedMedia(file)}
                      className="p-3 bg-slate-900 border border-slate-800/70 rounded-2xl flex flex-col justify-between aspect-square active:scale-98 transition"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        {file.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{formatSize(file.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="mt-4 space-y-4">
            <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-900/40 rounded-3xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Unlimited Cloud</h2>
                  <p className="text-xs text-indigo-300">Powered by Telegram Channel API</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Total Files:</span>
                  <span className="font-semibold text-slate-200">{files.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Channel ID:</span>
                  <span className="font-semibold text-slate-200">{CHANNEL_ID}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cloud Limit:</span>
                  <span className="font-semibold text-emerald-400">Unlimited (up to 2GB/file)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (window.confirm("Clear offline app cache? Files in your Telegram channel will remain safe.")) {
                  localStorage.removeItem('tg_cloud_media_v2');
                  setFiles([]);
                }
              }}
              className="w-full py-3.5 px-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-semibold active:bg-red-500/20"
            >
              Clear Local App Cache
            </button>
          </div>
        )}
      </main>

      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleUpload} 
        className="hidden" 
      />
      <button
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        className="fixed bottom-20 right-5 w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 active:scale-95 transition-all z-20"
      >
        <Plus size={28} />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-6 flex items-center justify-around z-20">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'gallery' ? 'text-sky-400 font-semibold' : 'text-slate-400'}`}
        >
          <ImageIcon size={20} />
          <span className="text-[11px]">Photos</span>
        </button>

        <button
          onClick={() => setActiveTab('drive')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'drive' ? 'text-sky-400 font-semibold' : 'text-slate-400'}`}
        >
          <Folder size={20} />
          <span className="text-[11px]">Files & Drive</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'stats' ? 'text-sky-400 font-semibold' : 'text-slate-400'}`}
        >
          <HardDrive size={20} />
          <span className="text-[11px]">Cloud</span>
        </button>
      </nav>

      {selectedMedia && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between pt-8">
            <button onClick={() => setSelectedMedia(null)} className="p-2 text-white/80 rounded-full bg-white/10">
              <ArrowLeft size={22} />
            </button>
            <p className="text-sm font-medium text-white truncate max-w-[200px]">{selectedMedia.name}</p>
            <a 
              href={selectedMedia.url} 
              target="_blank" 
              rel="noreferrer" 
              download 
              className="p-2 text-white/80 rounded-full bg-white/10"
            >
              <Download size={20} />
            </a>
          </div>

          <div className="flex-1 flex items-center justify-center p-2">
            {selectedMedia.type.startsWith('image/') ? (
              <img src={selectedMedia.url} alt={selectedMedia.name} className="max-h-full max-w-full rounded-xl object-contain" />
            ) : selectedMedia.type.startsWith('video/') ? (
              <video src={selectedMedia.url} controls className="max-h-full max-w-full rounded-xl" autoPlay />
            ) : (
              <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-3xl">
                <FileText size={48} className="mx-auto text-indigo-400 mb-3" />
                <p className="text-sm font-medium text-slate-200">{selectedMedia.name}</p>
                <p className="text-xs text-slate-500 mt-1">{formatSize(selectedMedia.size)}</p>
              </div>
            )}
          </div>

          <div className="pb-6 text-center text-xs text-slate-400">
            Uploaded {selectedMedia.date} to Telegram Private Channel
          </div>
        </div>
      )}
    </div>
  );
}
