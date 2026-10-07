import React, { useState, useEffect, useRef } from 'react';

const BOT_TOKEN = "8851205680:AAFl-e_KjW2qFN1rGQ-kJ80gcdWDlyPRlyo";
const CHANNEL_ID = "-1003983369108";

export default function App() {
  const [activeTab, setActiveTab] = useState('gallery');
  const [files, setFiles] = useState([]);
  const [folders] = useState(['Camera', 'Downloads', 'Documents', 'WhatsApp Media']);
  const [currentFolder, setCurrentFolder] = useState('');
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [previewMedia, setPreviewMedia] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('tg_nexus_vault_v1');
    if (saved) {
      try { setFiles(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveFiles = (list) => {
    setFiles(list);
    localStorage.setItem('tg_nexus_vault_v1', JSON.stringify(list));
  };

  const handleUpload = async (e) => {
    const list = Array.from(e.target.files);
    if (!list.length) return;

    setIsUploading(true);
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setUploadStatus(`Uploading ${i + 1} of ${list.length}...`);

      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const endpoint = isImg ? 'sendPhoto' : isVid ? 'sendVideo' : 'sendDocument';
      const field = isImg ? 'photo' : isVid ? 'video' : 'document';

      const formData = new FormData();
      formData.append('chat_id', CHANNEL_ID);
      formData.append(field, file);
      formData.append('caption', file.name);

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
          const url = pathData.ok ? `https://api.telegram.org/file/bot${BOT_TOKEN}/${pathData.result.file_path}` : '';

          const item = {
            id: data.result.message_id,
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            type: file.type,
            url,
            folder: currentFolder || 'General',
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
          };

          saveFiles([item, ...files]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    setIsUploading(false);
    setUploadStatus('');
  };

  const filtered = files.filter(f => {
    const matches = f.name.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'gallery') return matches && (f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (activeTab === 'drive') return matches && (currentFolder ? f.folder === currentFolder : true);
    return matches;
  });

  return (
    <div style={{
      width: '100vw', height: '100vh', backgroundColor: '#090d16', color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box'
    }}>

      {/* Android Top Header */}
      <div style={{
        padding: '48px 18px 14px 18px', backgroundColor: '#0f172a',
        borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentFolder && activeTab === 'drive' ? (
            <button
              onClick={() => setCurrentFolder('')}
              style={{
                width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1e293b',
                color: '#38bdf8', border: 'none', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '16px', cursor: 'pointer'
              }}
            >
              ←
            </button>
          ) : (
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
            }}>
              ☁️
            </div>
          )}
          <div>
            <div style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.2px' }}>
              {activeTab === 'gallery' ? 'Photos & Videos' : activeTab === 'drive' ? (currentFolder || 'Cloud Drive') : 'Unlimited Storage'}
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              Telegram Sync Active
            </div>
          </div>
        </div>
      </div>

      {/* Modern Search Pill */}
      <div style={{ padding: '10px 16px 6px 16px' }}>
        <input
          type="text"
          placeholder={activeTab === 'gallery' ? 'Search gallery media...' : 'Search files & docs...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 18px', borderRadius: '24px',
            backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#fff',
            fontSize: '14px', outline: 'none', boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Upload Banner */}
      {isUploading && (
        <div style={{
          margin: '6px 16px', padding: '10px 14px', borderRadius: '12px',
          background: 'linear-gradient(90deg, #0369a1, #4338ca)', color: '#fff',
          fontSize: '12px', fontWeight: '600', textAlign: 'center'
        }}>
          {uploadStatus}
        </div>
      )}

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px 90px 16px' }}>

        {/* GALLERY VIEW */}
        {activeTab === 'gallery' && (
          <div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '46px', marginBottom: '10px' }}>🖼️</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#cbd5e1' }}>No media uploaded yet</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Tap + below to store photos on Telegram</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {filtered.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setPreviewMedia(item)}
                    style={{
                      aspectRatio: '1', backgroundColor: '#131d31', borderRadius: '6px',
                      overflow: 'hidden', cursor: 'pointer', position: 'relative'
                    }}
                  >
                    {item.type.startsWith('video/') ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '26px' }}>🎬</div>
                    ) : (
                      <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DRIVE VIEW */}
        {activeTab === 'drive' && (
          <div>
            {!currentFolder && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Folders</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {folders.map(f => (
                    <div
                      key={f}
                      onClick={() => setCurrentFolder(f)}
                      style={{
                        padding: '14px', backgroundColor: '#131d31', borderRadius: '16px',
                        display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                        border: '1px solid #1e293b'
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>📁</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                {currentFolder ? `${currentFolder} Files` : 'All Files'}
              </div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                  <div style={{ fontSize: '38px', marginBottom: '8px' }}>📄</div>
                  <div style={{ fontSize: '13px' }}>Folder is empty</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filtered.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setPreviewMedia(item)}
                      style={{
                        padding: '12px 14px', backgroundColor: '#131d31', borderRadius: '14px',
                        display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #1e293b'
                      }}
                    >
                      <div style={{ fontSize: '24px' }}>
                        {item.type.startsWith('image/') ? '🖼️' : item.type.startsWith('video/') ? '🎬' : '📄'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{item.size} • {item.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLOUD TAB */}
        {activeTab === 'cloud' && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ padding: '20px', backgroundColor: '#131d31', borderRadius: '20px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>Telegram Cloud Engine</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '18px' }}>Private channel-backed unlimited storage</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#64748b' }}>Total Files</span>
                <span style={{ fontWeight: '700' }}>{files.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#64748b' }}>Cloud Capacity</span>
                <span style={{ fontWeight: '700', color: '#10b981' }}>Unlimited</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '10px 0' }}>
                <span style={{ color: '#64748b' }}>Max File Size</span>
                <span style={{ fontWeight: '700' }}>2 GB per file</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Clear local offline cache? Files on Telegram will remain safe.')) {
                  localStorage.removeItem('tg_nexus_vault_v1');
                  setFiles([]);
                }
              }}
              style={{
                marginTop: '16px', width: '100%', padding: '14px', borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
              }}
            >
              Clear Cache
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        style={{
          position: 'fixed', bottom: '78px', right: '18px', width: '56px', height: '56px',
          borderRadius: '18px', background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
          color: '#fff', fontSize: '28px', border: 'none', display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 8px 20px rgba(2, 132, 199, 0.45)', cursor: 'pointer', zIndex: 30
        }}
      >
        +
      </button>

      {/* Native Bottom Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px',
        backgroundColor: '#0b1120', borderTop: '1px solid #1e293b',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 20
      }}>
        <div
          onClick={() => setActiveTab('gallery')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            cursor: 'pointer', color: activeTab === 'gallery' ? '#38bdf8' : '#64748b'
          }}
        >
          <div style={{
            fontSize: '18px', padding: '3px 18px', borderRadius: '14px',
            backgroundColor: activeTab === 'gallery' ? 'rgba(56, 189, 248, 0.15)' : 'transparent'
          }}>
            🖼️
          </div>
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'gallery' ? '700' : '500' }}>Photos</span>
        </div>

        <div
          onClick={() => setActiveTab('drive')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            cursor: 'pointer', color: activeTab === 'drive' ? '#38bdf8' : '#64748b'
          }}
        >
          <div style={{
            fontSize: '18px', padding: '3px 18px', borderRadius: '14px',
            backgroundColor: activeTab === 'drive' ? 'rgba(56, 189, 248, 0.15)' : 'transparent'
          }}>
            📁
          </div>
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'drive' ? '700' : '500' }}>Drive</span>
        </div>

        <div
          onClick={() => setActiveTab('cloud')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            cursor: 'pointer', color: activeTab === 'cloud' ? '#38bdf8' : '#64748b'
          }}
        >
          <div style={{
            fontSize: '18px', padding: '3px 18px', borderRadius: '14px',
            backgroundColor: activeTab === 'cloud' ? 'rgba(56, 189, 248, 0.15)' : 'transparent'
          }}>
            ☁️
          </div>
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'cloud' ? '700' : '500' }}>Cloud</span>
        </div>
      </div>

      {/* Lightbox Preview */}
      {previewMedia && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.96)',
          zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '44px 16px 24px 16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setPreviewMedia(null)}
              style={{ background: '#1e293b', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '10px', fontSize: '13px' }}
            >
              ✕ Close
            </button>
            <div style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {previewMedia.name}
            </div>
            <a
              href={previewMedia.url}
              target="_blank"
              rel="noreferrer"
              download
              style={{ background: '#0284c7', color: '#fff', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', textDecoration: 'none' }}
            >
              Save
            </a>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
            {previewMedia.type.startsWith('image/') ? (
              <img src={previewMedia.url} alt={previewMedia.name} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '14px', objectFit: 'contain' }} />
            ) : previewMedia.type.startsWith('video/') ? (
              <video src={previewMedia.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '14px' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                <div>{previewMedia.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{previewMedia.size}</div>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
            Backed up to Telegram Private Channel
          </div>
        </div>
      )}

    </div>
  );
}
