import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Map, Trash2, ExternalLink, BookOpen, Compass, Scroll, Plus, Clock } from 'lucide-react';
import { getAllRooms, deleteRoom } from '../lib/rooms';
import { Room } from '../lib/storage';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function RoomCard({ room, onDelete }: { room: Room; onDelete: (id: string) => void }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    const ok = await deleteRoom(room.room_id);
    if (ok) onDelete(room.room_id);
    else setDeleting(false);
  }

  return (
    <div
      className="group relative overflow-hidden rounded transition-all duration-300"
      style={{
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(255,250,230,1) 0%, transparent 50%),
          linear-gradient(180deg, #F3E1B8 0%, #E8D3A2 60%, #DCC89A 100%)
        `,
        border: '6px solid #8A5A16',
        boxShadow: `
          inset 0 0 40px rgba(138,90,22,0.3),
          0 8px 24px rgba(0,0,0,0.4)
        `,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#C9972B';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#8A5A16';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Paper texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background: `
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(138,90,22,0.02) 2px, rgba(138,90,22,0.02) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(138,90,22,0.02) 2px, rgba(138,90,22,0.02) 4px)
          `,
        }}
      />

      {/* Preview */}
      <div
        className="relative overflow-hidden"
        style={{ height: '160px', background: 'rgba(7,31,42,0.8)' }}
      >
        {room.preview_image ? (
          <img
            src={room.preview_image}
            alt={room.room_id}
            className="w-full h-full object-cover"
            style={{ opacity: 0.95 }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <Scroll size={48} color="#8A5A16" strokeWidth={1} />
            <span style={{ color: '#8A5A16', fontSize: '13px', fontFamily: 'Georgia, serif' }}>
              Пустая карта
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          style={{ background: 'rgba(7,31,42,0.85)' }}
        >
          <button
            onClick={() => navigate(`/room/${room.room_id}`)}
            className="flex items-center gap-2 px-5 py-2.5 font-bold uppercase tracking-wider text-sm transition-all rounded"
            style={{
              background: 'linear-gradient(135deg, #C9972B, #8A5A16)',
              color: '#2B1A12',
              border: 'none',
              fontFamily: 'Georgia, serif',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            <ExternalLink size={16} />
            Открыть карту
          </button>
        </div>
      </div>

      {/* Info section */}
      <div className="p-4 relative z-10">
        <div className="flex items-start justify-between mb-2">
          <h3
            className="font-bold text-sm truncate max-w-[180px]"
            style={{ color: '#2A1A10', fontFamily: 'Georgia, serif' }}
            title={room.room_id}
          >
            {room.room_id}
          </h3>
          <Map size={16} color="#8A5A16" />
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2 text-xs">
            <Clock size={12} color="#8A5A16" />
            <span style={{ color: '#5A3D1A', fontFamily: 'Georgia, serif' }}>Создана:</span>
            <span style={{ color: '#3D2914', fontFamily: 'Georgia, serif' }}>{formatDate(room.created_at)} {formatTime(room.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Clock size={12} color="#C9972B" />
            <span style={{ color: '#5A3D1A', fontFamily: 'Georgia, serif' }}>Изменена:</span>
            <span style={{ color: '#3D2914', fontFamily: 'Georgia, serif' }}>{formatDate(room.updated_at)} {formatTime(room.updated_at)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/room/${room.room_id}`)}
            className="flex-1 py-2 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider transition-all rounded"
            style={{
              background: 'linear-gradient(135deg, #C9972B, #8A5A16)',
              color: '#2B1A12',
              border: 'none',
              fontFamily: 'Georgia, serif',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            Открыть
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="py-2 px-3 text-sm font-bold transition-all rounded"
            style={{
              background: confirming ? 'rgba(180,50,50,0.3)' : 'transparent',
              color: confirming ? '#a53535' : '#8A5A16',
              border: confirming ? '2px solid rgba(180,50,50,0.6)' : '2px solid rgba(138,90,22,0.4)',
              fontFamily: 'Georgia, serif',
            }}
            title={confirming ? 'Нажмите ещё раз' : 'Уничтожить карту'}
            onMouseLeave={() => !deleting && setConfirming(false)}
          >
            {deleting ? '...' : confirming ? '!' : <Trash2 size={16} />}
          </button>
        </div>

        {confirming && !deleting && (
          <p className="mt-2 text-center text-xs" style={{ color: '#a53535', fontFamily: 'Georgia, serif' }}>
            Вы уверены что хотите уничтожить карту?
          </p>
        )}
      </div>

      {/* Edge burn effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 50px rgba(138,90,22,0.4)' }}
      />
    </div>
  );
}

export default function RoomsArchive() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllRooms().then(data => {
      setRooms(data);
      setLoading(false);
    });
  }, []);

  function handleDelete(roomId: string) {
    setRooms(prev => prev.filter(r => r.room_id !== roomId));
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(180deg, #071F2A 0%, #123C4A 50%, #071F2A 100%)' }}>
      {/* Background decorations */}
      <div className="fixed top-0 left-1/8 opacity-10">
        <Compass size={120} color="#C9972B" strokeWidth={0.5} />
      </div>
      <div className="fixed bottom-0 right-1/8 opacity-10">
        <Anchor size={100} color="#C9972B" strokeWidth={0.5} />
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-20 px-4 sm:px-6 py-4"
        style={{
          background: 'linear-gradient(180deg, rgba(74,44,26,0.98) 0%, rgba(43,26,18,0.98) 100%)',
          borderBottom: '4px solid #2B1A12',
          boxShadow: 'inset 0 1px 0 rgba(201,151,43,0.3), 0 4px 16px rgba(0,0,0,0.5)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded transition-all hover:scale-105"
              style={{
                background: 'rgba(74,44,26,0.6)',
                border: '1px solid rgba(201,151,43,0.4)',
              }}
            >
              <Anchor size={24} color="#F3E1B8" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#F3E1B8', fontFamily: 'Georgia, serif' }}>
                Архив пиратских карт
              </h1>
              <p className="text-xs sm:text-sm" style={{ color: '#C9972B', fontFamily: 'Georgia, serif' }}>
                {loading ? 'Загружаем...' : `${rooms.length} ${rooms.length === 1 ? 'карта' : rooms.length < 5 ? 'карты' : 'карт'} в архиве`}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setLoading(true);
                getAllRooms().then(data => { setRooms(data); setLoading(false); });
              }}
              className="p-2 rounded transition-all hover:scale-105"
              style={{
                background: 'rgba(74,44,26,0.6)',
                border: '1px solid rgba(201,151,43,0.4)',
              }}
              title="Обновить"
            >
              <BookOpen size={20} color="#F3E1B8" />
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 text-sm font-bold uppercase tracking-wider rounded"
              style={{
                background: 'linear-gradient(135deg, #C9972B, #8A5A16)',
                color: '#2B1A12',
                border: 'none',
                fontFamily: 'Georgia, serif',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Новая карта</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Compass size={72} color="#C9972B" strokeWidth={1} style={{ animation: 'spin 3s linear infinite' }} />
            <p style={{ color: '#F3E1B8', fontFamily: 'Georgia, serif', fontSize: '18px' }}>
              Разворачиваем свитки...
            </p>
          </div>
        ) : rooms.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 px-6 rounded-lg"
            style={{
              background: `
                linear-gradient(180deg, #F3E1B8 0%, #E8D3A2 100%)
              `,
              border: '8px solid #8A5A16',
              boxShadow: 'inset 0 0 60px rgba(138,90,22,0.3), 0 10px 40px rgba(0,0,0,0.5)',
            }}
          >
            <Scroll size={80} color="#8A5A16" strokeWidth={1} />
            <h2 className="text-2xl font-bold mt-6 mb-2" style={{ color: '#2A1A10', fontFamily: 'Georgia, serif' }}>
              Архив пуст
            </h2>
            <p className="mb-6" style={{ color: '#5A3D1A', fontFamily: 'Georgia, serif' }}>
              Создайте свою первую карту приключений
            </p>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-8 py-3 font-bold uppercase tracking-widest rounded"
              style={{
                background: 'linear-gradient(135deg, #C9972B, #8A5A16)',
                color: '#2B1A12',
                border: 'none',
                fontFamily: 'Georgia, serif',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            >
              <Plus size={20} />
              Создать карту
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rooms.map(room => (
              <RoomCard key={room.id} room={room} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
