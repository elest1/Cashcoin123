import React, { useState, useEffect } from 'react';

const TG_BOT_TOKEN = "8851205680:AAFl-e_KjW2qFN1rGQ-kJ80gcdWDlyPRlyo";
const TG_CHANNEL_ID = "-1003983369108";

const Icons = {
  HardDrive: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="12" x2="2" y2="12"></line>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
      <line x1="6" y1="16" x2="6.01" y2="16"></line>
      <line x1="10" y1="16" x2="10.01" y2="16"></line>
    </svg>
  ),
  Folder: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#38bdf8" stroke="#38bdf8" strokeWidth="1.5">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  Upload: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  ),
  FileText: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  Close: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
};

export default function App() {
  const [currentFolder, setCurrentFolder] = useState('root');
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activePreview, setActivePreview] = useState(null);

  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('tg_folders');
    return saved ? JSON.parse(saved) : [
      { id: 'photos', name: 'Photos & Gallery', parent: 'root' },
      { id: 'docs', name: 'Documents', parent: 'root' }
    ];
  });

  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('tg_files');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('tg_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('tg_files', JSON.stringify(files));
  }, [files]);

  const handleCreateFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    setFolders([...folders, { id: Date.now().toString(), name: folderName, parent: currentFolder }]);
  };

  const handleDeleteFile = (id, e) => {
    e.stopPropagation();
    if (confirm('Remove file record from this view?')) {
      setFiles(files.filter(f => f.id !== id));
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('chat_id', TG_CHANNEL_ID);
      formData.append('caption', `Uploaded via Cloud Drive | Folder: ${currentFolder}`);

      let endpoint = 'sendDocument';
      let fileKey = 'document';

      if (file.type.startsWith('image/')) {
        endpoint = 'sendPhoto';
        fileKey = 'photo';
      }

      formData.append(fileKey, file);

      const res = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/${endpoint}`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.ok) {
        let fileId = '';
        if (endpoint === 'sendPhoto') {
          const photos = data.result.photo;
          fileId = photos[photos.length - 1].file_id;
        } else {
          fileId = data.result.document.file_id;
        }

        const fileInfoRes = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/getFile?file_id=${fileId}`);
        const fileInfo = await fileInfoRes.json();
        
        let downloadUrl = '';
        if (fileInfo.ok) {
          downloadUrl = `https://api.telegram.org/file/bot${TG_BOT_TOKEN}/${fileInfo.result.file_path}`;
        }

        const newFile = {
          id: data.result.message_id.toString(),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          folder: currentFolder,
          url: downloadUrl
        };

        setFiles(prev => [newFile, ...prev]);
      } else {
        alert('Telegram Error: ' + data.description);
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const visibleFolders = folders.filter(f => f.parent === currentFolder);

  const visibleFiles = files.filter(f => {
    const inFolder = f.folder === currentFolder;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || f.type === filterType;
    return inFolder && matchesSearch && matchesFilter;
  });

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#0b1120', color: '#f8fafc', margin: 0 }}>
      {/* Top Navbar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icons.HardDrive />
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '600' }}>Telegram Cloud Gallery</h2>
            <div style={{ fontSize: '11px', color: '#10b981' }}>● Channel Active</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isUploading ? '#475569' : '#2563eb', padding: '8px 16px', borderRadius: '8px', cursor: isUploading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
            <Icons.Upload /> {isUploading ? 'Uploading...' : 'Upload'}
            <input type="file" onChange={handleUpload} disabled={isUploading} style={{ display: 'none' }} />
          </label>
          <button onClick={handleCreateFolder} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
            <Icons.Plus /> New Folder
          </button>
        </div>
      </header>

      {/* Control Strip: Search & Filter */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 16px 0 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Search files..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ background: '#131d33', border: '1px solid #1e293b', color: '#fff', padding: '8px 14px', borderRadius: '8px', outline: 'none', width: '220px', fontSize: '13px' }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'image', 'document'].map(t => (
            <button 
              key={t}
              onClick={() => setFilterType(t)}
              style={{ background: filterType === t ? '#2563eb' : '#131d33', border: '1px solid #1e293b', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textTransform: 'capitalize', cursor: 'pointer' }}
            >
              {t === 'all' ? 'All Files' : t + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          {currentFolder !== 'root' && (
            <button onClick={() => setCurrentFolder('root')} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.ArrowLeft /> Back
            </button>
          )}
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Path: /{currentFolder === 'root' ? '' : currentFolder}</span>
        </div>

        {/* Folders */}
        {visibleFolders.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.05em' }}>FOLDERS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {visibleFolders.map(folder => (
                <div key={folder.id} onClick={() => setCurrentFolder(folder.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#131d33', borderRadius: '10px', cursor: 'pointer', border: '1px solid #1e293b' }}>
                  <Icons.Folder />
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{folder.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Files Grid */}
        <section>
          <h3 style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.05em' }}>MEDIA & FILES ({visibleFiles.length})</h3>
          {visibleFiles.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', background: '#131d33', borderRadius: '12px', border: '1px dashed #334155', fontSize: '13px' }}>
              No files found. Click "Upload" to store directly on Telegram!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {visibleFiles.map(file => (
                <div 
                  key={file.id} 
                  onClick={() => file.type === 'image' && setActivePreview(file)}
                  style={{ background: '#131d33', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e293b', cursor: file.type === 'image' ? 'zoom-in' : 'default', display: 'flex', flexDirection: 'column' }}
                >
                  {file.type === 'image' && file.url ? (
                    <img src={file.url} alt={file.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1120' }}>
                      <Icons.FileText />
                    </div>
                  )}
                  <div style={{ padding: '10px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>{file.size}</div>
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {file.url ? (
                        <a href={file.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#38bdf8', textDecoration: 'none' }}>
                          <Icons.Download /> Open
                        </a>
                      ) : <span />}
                      <button onClick={(e) => handleDeleteFile(file.id, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Full-Screen Lightbox Preview Modal */}
      {activePreview && (
        <div onClick={() => setActivePreview(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ position: 'absolute', top: '16px', right: '20px', cursor: 'pointer', color: '#fff' }}>
            <Icons.Close />
          </div>
          <img src={activePreview.url} alt={activePreview.name} style={{ maxWidth: '90%', maxHeight: '80vh', borderRadius: '8px', objectFit: 'contain' }} />
          <div style={{ color: '#fff', marginTop: '12px', fontSize: '14px', textAlign: 'center' }}>{activePreview.name}</div>
        </div>
      )}
    </div>
  );
}