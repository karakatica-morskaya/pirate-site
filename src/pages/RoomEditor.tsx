import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as fabric from 'fabric';
import {
  Anchor, ArrowLeft, Download, Eraser, Feather, Image as ImageIcon,
  Palette, Save, Slash, Trash2, BookOpen, Compass, Map,
} from 'lucide-react';
import { createRoom, getRoom, saveRoom } from '../lib/rooms';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type Tool = 'draw' | 'select' | 'eraser';

const BRUSH_SIZES = [2, 5, 10, 18, 30];
const COLORS = ['#2A1A10', '#3D2914', '#5A3D1A', '#8A5A16', '#C9972B', '#1a3a4a', '#5a1a1a', '#1a3a1a'];
const PARCHMENT_BG = '#F3E1B8';
const SAVE_DEBOUNCE = 1500;

export default function RoomEditor() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Critical flags to prevent save loops
  const isInitialLoadingRef = useRef(true);
  const isSavingRef = useRef(false);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [tool, setTool] = useState<Tool>('draw');
  const [color, setColor] = useState('#2A1A10');
  const [brushSize, setBrushSize] = useState(5);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [roomName, setRoomName] = useState(roomId ?? '');

  // ---- Save logic with proper debouncing and flag checks ----
  const scheduleSave = useCallback(() => {
    // Skip save during initial load
    if (isInitialLoadingRef.current) {
      console.log('[Save] Skipped during initial load');
      return;
    }

    console.log('[Save] Scheduled');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      const canvas = fabricRef.current;
      if (!canvas || !roomId || isInitialLoadingRef.current || isSavingRef.current) return;

      isSavingRef.current = true;
      setSaveStatus('saving');
      console.log('[Save] Saving to localStorage');

      const canvasData = canvas.toJSON(['selectable', 'evented']);
      const previewImage = canvas.toDataURL({ format: 'png', multiplier: 0.4 });

      const ok = await saveRoom(roomId, canvasData, previewImage);

      if (ok) {
        console.log('[Save] Saved successfully');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        console.log('[Save] Error');
        setSaveStatus('error');
      }
      isSavingRef.current = false;
    }, SAVE_DEBOUNCE);
  }, [roomId]);

  // ---- Apply tool ----
  const applyTool = useCallback((t: Tool, c: string, bs: number, canvas: fabric.Canvas) => {
    if (t === 'select') {
      canvas.isDrawingMode = false;
      canvas.getObjects().forEach(o => { o.selectable = true; o.evented = true; });
    } else if (t === 'draw') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = c;
      canvas.freeDrawingBrush.width = bs;
    } else if (t === 'eraser') {
      canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(canvas);
      brush.color = PARCHMENT_BG;
      brush.width = bs * 3;
      canvas.freeDrawingBrush = brush;
    }
  }, []);

  // ---- Canvas initialization ----
  useEffect(() => {
    if (!canvasElRef.current || !roomId) return;

    const container = canvasElRef.current.parentElement!;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: w,
      height: h,
      backgroundColor: PARCHMENT_BG,
      selection: true,
    });
    fabricRef.current = canvas;
    console.log('[Canvas] Initialized');

    // Load or create room
    (async () => {
      isInitialLoadingRef.current = true;
      console.log('[Room] Loading room', roomId);

      let room = await getRoom(roomId);
      if (!room) {
        room = await createRoom(roomId);
        console.log('[Room] Room created');
      } else {
        console.log('[Room] Room loaded');
      }

      if (room?.canvas_data && Object.keys(room.canvas_data).length > 0) {
        console.log('[Canvas] Loaded from DB');
        await new Promise<void>(resolve => {
          canvas.loadFromJSON(room!.canvas_data!, () => {
            canvas.renderAll();
            canvas.requestRenderAll();
            resolve();
          });
        });
      } else {
        // Empty canvas - just render it visible
        canvas.backgroundColor = PARCHMENT_BG;
        canvas.renderAll();
        canvas.requestRenderAll();
        console.log('[Canvas] Empty canvas rendered');
      }

      setRoomName(room?.room_id ?? roomId);
      isInitialLoadingRef.current = false;
      setCanvasReady(true);

      // Apply default tool AFTER loading is complete
      applyTool('draw', '#2A1A10', 5, canvas);

      // Bind save events ONLY after initial load
      canvas.on('path:created', scheduleSave);
      canvas.on('object:added', scheduleSave);
      canvas.on('object:modified', scheduleSave);
      canvas.on('object:removed', scheduleSave);
    })();

    // Keyboard delete
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
          canvas.remove(activeObj);
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
    }
    window.addEventListener('keydown', onKey);

    // Resize handler
    function onResize() {
      const w2 = container.clientWidth;
      const h2 = container.clientHeight;
      canvas.setWidth(w2);
      canvas.setHeight(h2);
      canvas.renderAll();
    }
    window.addEventListener('resize', onResize);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      canvas.dispose();
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Tool/color changes ----
  useEffect(() => {
    if (!canvasReady || !fabricRef.current) return;
    applyTool(tool, color, brushSize, fabricRef.current);
  }, [tool, color, brushSize, canvasReady, applyTool]);

  // ---- Upload image ----
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      fabric.FabricImage.fromURL(src).then(img => {
        const canvas = fabricRef.current!;
        const scale = Math.min(canvas.width! / (img.width! * 2), canvas.height! / (img.height! * 2), 1);
        img.scale(scale);
        img.set({ left: 50, top: 50 });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // ---- Delete selected ----
  function deleteSelected() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }

  // ---- Clear canvas ----
  function clearCanvas() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!confirm('Сжечь всю карту? Это действие необратимо!')) return;
    canvas.clear();
    canvas.backgroundColor = PARCHMENT_BG;
    canvas.renderAll();
    canvas.requestRenderAll();
    scheduleSave();
  }

  // ---- Manual save ----
  async function handleManualSave() {
    const canvas = fabricRef.current;
    if (!canvas || !roomId || isSavingRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    isSavingRef.current = true;
    setSaveStatus('saving');
    console.log('[Save] Manual save triggered');

    const canvasData = canvas.toJSON(['selectable', 'evented']);
    const previewImage = canvas.toDataURL({ format: 'png', multiplier: 0.4 });

    const ok = await saveRoom(roomId, canvasData, previewImage);
    if (ok) {
      console.log('[Save] Saved successfully');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      console.log('[Save] Error');
      setSaveStatus('error');
    }
    isSavingRef.current = false;
  }

  // ---- Download PNG ----
  function downloadPng() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roomId ?? 'pirate-map'}.png`;
    a.click();
  }

  const saveLabel: Record<SaveStatus, string> = {
    idle: '',
    saving: 'Сохраняем...',
    saved: 'Сохранено',
    error: 'Ошибка',
  };
  const saveColor: Record<SaveStatus, string> = {
    idle: '#8A5A16',
    saving: '#C9972B',
    saved: '#2a6a3a',
    error: '#a53535',
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top toolbar - wooden captain panel style */}
      <header
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 flex-shrink-0 z-20 flex-wrap"
        style={{
          background: 'linear-gradient(180deg, #4A2C1A 0%, #3a2214 50%, #2B1A12 100%)',
          borderBottom: '3px solid #2B1A12',
          boxShadow: 'inset 0 1px 0 rgba(201,151,43,0.3), 0 4px 8px rgba(0,0,0,0.4)',
        }}
      >
        <button
          onClick={() => navigate('/rooms')}
          className="p-2 rounded transition-all hover:scale-105"
          style={{
            background: 'rgba(74,44,26,0.6)',
            border: '1px solid rgba(201,151,43,0.4)',
          }}
          title="Архив карт"
        >
          <ArrowLeft size={20} color="#F3E1B8" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <Anchor size={18} color="#C9972B" />
          <span
            className="font-bold truncate max-w-[150px] sm:max-w-[200px]"
            style={{ color: '#F3E1B8', fontFamily: 'Georgia, serif', fontSize: '14px' }}
          >
            {roomName}
          </span>
        </div>

        <div className="h-6 w-px mx-1 hidden sm:block" style={{ background: 'rgba(201,151,43,0.3)' }} />

        {/* Drawing tools */}
        <div className="flex items-center gap-1">
          <ToolBtn active={tool === 'draw'} onClick={() => setTool('draw')} title="Перо картографа">
            <Feather size={18} />
          </ToolBtn>
          <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} title="Выбор объекта">
            <Compass size={18} />
          </ToolBtn>
          <ToolBtn active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Стереть следы">
            <Eraser size={18} />
          </ToolBtn>
        </div>

        {/* Color picker */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(p => !p)}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 transition-all rounded"
            style={{
              background: 'rgba(74,44,26,0.8)',
              border: '1px solid rgba(201,151,43,0.5)',
            }}
            title="Цвет чернил"
          >
            <Palette size={16} color="#C9972B" />
            <div
              className="w-5 h-5 rounded-full border-2"
              style={{ background: color, borderColor: 'rgba(201,151,43,0.8)' }}
            />
          </button>
          {showColorPicker && (
            <div
              className="absolute top-full left-0 mt-2 p-3 z-50 rounded"
              style={{
                background: 'linear-gradient(135deg, #4A2C1A, #2B1A12)',
                border: '2px solid #C9972B',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}
            >
              {/* Quick preset colors */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { setColor(c); setShowColorPicker(false); }}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: c,
                      border: color === c ? '2px solid #C9972B' : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>
              {/* Custom color picker */}
              <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(201,151,43,0.3)' }}>
                <Palette size={14} color="#C9972B" />
                <span style={{ color: '#E8D3A2', fontSize: '11px', fontFamily: 'Georgia, serif' }}>Любой цвет:</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 cursor-pointer rounded"
                  style={{
                    border: '2px solid #C9972B',
                    background: 'transparent',
                  }}
                  title="Выбрать любой цвет"
                />
              </div>
            </div>
          )}
        </div>

        {/* Brush size */}
        <div className="flex items-center gap-1">
          {BRUSH_SIZES.map(s => (
            <button
              key={s}
              onClick={() => setBrushSize(s)}
              className="flex items-center justify-center w-7 h-7 rounded-full transition-all"
              style={{
                background: brushSize === s ? 'rgba(201,151,43,0.3)' : 'transparent',
                border: brushSize === s ? '1px solid #C9972B' : '1px solid transparent',
              }}
              title={`Толщина ${s}`}
            >
              <div className="rounded-full" style={{ width: Math.max(3, s / 3), height: Math.max(3, s / 3), background: '#F3E1B8' }} />
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Image upload */}
        <label
          className="flex items-center gap-2 px-2 sm:px-3 py-1.5 cursor-pointer transition-all rounded"
          style={{
            background: 'rgba(74,44,26,0.8)',
            border: '1px solid rgba(201,151,43,0.4)',
            color: '#F3E1B8',
            fontSize: '13px',
            fontFamily: 'Georgia, serif',
          }}
          title="Добавить артефакт"
        >
          <ImageIcon size={16} color="#C9972B" />
          <span className="hidden md:inline">Добавить артефакт</span>
          <input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleImageUpload} className="hidden" />
        </label>

        {/* Delete selected */}
        <button
          onClick={deleteSelected}
          className="flex items-center gap-2 px-2 sm:px-3 py-1.5 transition-all rounded"
          style={{
            background: 'rgba(74,44,26,0.6)',
            border: '1px solid rgba(138,90,22,0.4)',
            color: '#E8D3A2',
            fontSize: '13px',
            fontFamily: 'Georgia, serif',
          }}
          title="Уничтожить (Delete)"
        >
          <Trash2 size={16} color="#C9972B" />
          <span className="hidden lg:inline">Уничтожить</span>
        </button>

        {/* Save status */}
        {saveStatus !== 'idle' && (
          <span className="text-xs font-medium px-2 py-1 rounded" style={{ color: saveColor[saveStatus], fontFamily: 'Georgia, serif', background: 'rgba(0,0,0,0.2)' }}>
            {saveLabel[saveStatus]}
          </span>
        )}

        {/* Actions */}
        <button
          onClick={clearCanvas}
          className="flex items-center gap-2 px-2 sm:px-3 py-1.5 transition-all rounded"
          style={{
            background: 'rgba(74,44,26,0.4)',
            border: '1px solid rgba(138,90,22,0.3)',
            color: '#E8D3A2',
            fontSize: '13px',
            fontFamily: 'Georgia, serif',
          }}
          title="Сжечь карту"
        >
          <Slash size={16} color="#8A5A16" />
          <span className="hidden xl:inline">Сжечь карту</span>
        </button>

        <button
          onClick={handleManualSave}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-2 px-3 sm:px-4 py-1.5 transition-all rounded"
          style={{
            background: 'linear-gradient(135deg, #C9972B, #8A5A16)',
            border: 'none',
            color: '#2B1A12',
            fontSize: '13px',
            fontFamily: 'Georgia, serif',
            fontWeight: 'bold',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
          title="Сохранить карту"
        >
          <Save size={16} />
          <span className="hidden sm:inline">Сохранить карту</span>
        </button>

        <button onClick={downloadPng} className="p-2 rounded transition-all hover:scale-105" style={{ background: 'rgba(74,44,26,0.6)', border: '1px solid rgba(201,151,43,0.4)' }} title="Скачать PNG">
          <Download size={18} color="#C9972B" />
        </button>

        <button onClick={() => navigate('/rooms')} className="p-2 rounded transition-all hover:scale-105" style={{ background: 'rgba(74,44,26,0.6)', border: '1px solid rgba(201,151,43,0.4)' }} title="Архив карт">
          <BookOpen size={18} color="#F3E1B8" />
        </button>
      </header>

      {/* Canvas area - old parchment map style */}
      <div
        className="flex-1 relative overflow-hidden p-4 sm:p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, #071F2A 0%, #123C4A 100%)',
        }}
        onClick={() => setShowColorPicker(false)}
      >
        {/* Parchment canvas container */}
        <div
          className="absolute inset-4 sm:inset-6 md:inset-8 rounded-lg shadow-2xl overflow-hidden"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(255,250,230,0.9) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(245,235,210,0.8) 0%, transparent 50%),
              linear-gradient(180deg, #F3E1B8 0%, #E8D3A2 50%, #DCC89A 100%)
            `,
            border: '8px solid #8A5A16',
            boxShadow: `
              inset 0 0 60px rgba(138,90,22,0.3),
              inset 0 0 120px rgba(201,151,43,0.15),
              0 10px 40px rgba(0,0,0,0.5)
            `,
          }}
        >
          {/* Paper texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(138,90,22,0.02) 2px,
                  rgba(138,90,22,0.02) 4px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 2px,
                  rgba(138,90,22,0.02) 2px,
                  rgba(138,90,22,0.02) 4px
                )
              `,
            }}
          />

          {/* Map grid overlay - very subtle */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(138,90,22,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(138,90,22,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Edge burn effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `
                inset 0 0 80px rgba(138,90,22,0.4),
                inset 0 0 150px rgba(74,44,26,0.2)
              `,
            }}
          />

          {/* Canvas element */}
          <canvas ref={canvasElRef} className="relative z-10" />

          {/* Corner decorations */}
          <div className="absolute top-2 left-2 opacity-30">
            <Compass size={32} color="#8A5A16" strokeWidth={1} />
          </div>
          <div className="absolute bottom-2 right-2 opacity-30">
            <Map size={28} color="#8A5A16" strokeWidth={1} />
          </div>
        </div>

        {/* Loading overlay */}
        {!canvasReady && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20"
            style={{ background: 'rgba(7,31,42,0.95)' }}
          >
            <Compass size={64} color="#C9972B" strokeWidth={1} style={{ animation: 'spin 3s linear infinite' }} />
            <p style={{ color: '#F3E1B8', fontFamily: 'Georgia, serif', fontSize: '18px' }}>
              Разворачиваем карту...
            </p>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 flex-shrink-0 text-xs flex-wrap gap-2"
        style={{
          background: 'linear-gradient(180deg, #2B1A12 0%, #1a0f0a 100%)',
          borderTop: '2px solid #4A2C1A',
          color: '#C9972B',
          fontFamily: 'Georgia, serif',
        }}
      >
        <span className="truncate max-w-[200px]">{roomName}</span>
        <span style={{ color: saveColor[saveStatus] }}>
          {saveStatus !== 'idle' ? saveLabel[saveStatus] : 'Автосохранение'}
        </span>
        <span className="hidden sm:inline opacity-70">Del — удалить объект</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ToolBtn({
  children, active, onClick, title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-8 h-8 rounded transition-all"
      style={{
        background: active ? 'linear-gradient(135deg, rgba(201,151,43,0.4), rgba(138,90,22,0.4))' : 'rgba(74,44,26,0.6)',
        border: active ? '1px solid #C9972B' : '1px solid rgba(201,151,43,0.3)',
        color: active ? '#F3E1B8' : '#C9972B',
        boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
      }}
    >
      {children}
    </button>
  );
}
