import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Map, BookOpen, Compass, Ship, Skull, Waves } from 'lucide-react';
import { createRoom } from '../lib/rooms';

function generateRoomId(): string {
  const adjectives = ['golden', 'cursed', 'sunken', 'ancient', 'ghostly', 'crimson', 'black', 'iron', 'silver', 'stormy'];
  const nouns = ['kraken', 'galleon', 'compass', 'doubloon', 'anchor', 'cutlass', 'mast', 'pearl', 'island', 'harbor'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}-${noun}-${num}`;
}

export default function Home() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  async function handleCreateRoom() {
    setCreating(true);
    const roomId = generateRoomId();
    const room = await createRoom(roomId);
    if (room) {
      navigate(`/room/${roomId}`);
    } else {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background - captain's quarters / sea */}
      <div
        className="fixed inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(18,60,74,0.6) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 80%, rgba(7,31,42,0.8) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 90%, rgba(18,60,74,0.5) 0%, transparent 50%),
            linear-gradient(180deg, #071F2A 0%, #0a2836 50%, #071F2A 100%)
          `,
        }}
      />

      {/* Decorative waves */}
      <div className="fixed bottom-0 left-0 right-0 h-32 opacity-20">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-1"
            style={{
              bottom: `${i * 20}px`,
              background: `linear-gradient(90deg, transparent 0%, rgba(201,151,43,0.5) 20%, rgba(201,151,43,0.8) 50%, rgba(201,151,43,0.5) 80%, transparent 100%)`,
              animation: `wave ${4 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative icons */}
      <div className="fixed top-8 left-8 opacity-10">
        <Compass size={100} color="#C9972B" strokeWidth={0.5} />
      </div>
      <div className="fixed top-8 right-8 opacity-10">
        <Ship size={80} color="#C9972B" strokeWidth={0.5} />
      </div>
      <div className="fixed bottom-8 left-1/4 opacity-10">
        <Anchor size={60} color="#C9972B" strokeWidth={0.5} />
      </div>
      <div className="fixed bottom-8 right-1/4 opacity-10">
        <Skull size={60} color="#C9972B" strokeWidth={0.5} />
      </div>

      {/* Main parchment card */}
      <main
        className="relative z-10 w-full max-w-2xl rounded-lg"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(255,250,230,1) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(245,235,210,1) 0%, transparent 50%),
            linear-gradient(180deg, #F3E1B8 0%, #E8D3A2 40%, #DCC89A 100%)
          `,
          border: '10px solid #8A5A16',
          boxShadow: `
            inset 0 0 80px rgba(138,90,22,0.4),
            inset 0 0 150px rgba(74,44,26,0.2),
            0 20px 60px rgba(0,0,0,0.6)
          `,
        }}
      >
        {/* Paper texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded"
          style={{
            background: `
              repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(138,90,22,0.03) 3px, rgba(138,90,22,0.03) 6px),
              repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(138,90,22,0.03) 3px, rgba(138,90,22,0.03) 6px)
            `,
          }}
        />

        {/* Corner decorations */}
        <div className="absolute -top-2 -left-2 text-[#5A3D1A] opacity-40 text-4xl font-serif">✦</div>
        <div className="absolute -top-2 -right-2 text-[#5A3D1A] opacity-40 text-4xl font-serif">✦</div>
        <div className="absolute -bottom-2 -left-2 text-[#5A3D1A] opacity-40 text-4xl font-serif">✦</div>
        <div className="absolute -bottom-2 -right-2 text-[#5A3D1A] opacity-40 text-4xl font-serif">✦</div>

        {/* Content */}
        <div className="relative z-10 p-8 sm:p-12 text-center">
          {/* Header decoration */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 sm:w-24" style={{ background: 'linear-gradient(90deg, transparent, #8A5A16)' }} />
            <Anchor size={28} color="#8A5A16" strokeWidth={1.5} />
            <div className="h-px w-16 sm:w-24" style={{ background: 'linear-gradient(270deg, transparent, #8A5A16)' }} />
          </div>

          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 tracking-wide"
            style={{
              color: '#2A1A10',
              textShadow: '0 1px 0 rgba(255,255,255,0.3)',
              fontFamily: 'Georgia, serif',
            }}
          >
            Пиратская карта
          </h1>
          <h2
            className="text-xl sm:text-2xl font-medium tracking-widest uppercase mb-8"
            style={{
              color: '#5A3D1A',
              fontFamily: 'Georgia, serif',
              letterSpacing: '0.2em',
            }}
          >
            Приключений
          </h2>

          {/* Compass divider */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-20" style={{ background: 'linear-gradient(90deg, transparent, #C9972B)' }} />
            <Compass size={24} color="#C9972B" strokeWidth={1.5} />
            <div className="h-px w-20" style={{ background: 'linear-gradient(270deg, transparent, #C9972B)' }} />
          </div>

          {/* Description */}
          <p
            className="mb-10 max-w-md mx-auto"
            style={{
              color: '#4A2C1A',
              fontFamily: 'Georgia, serif',
              fontSize: '15px',
              lineHeight: 1.7,
            }}
          >
            Создавай карты морских приключений, отмечай острова сокровищ и веди свою команду сквозь бурные воды к славе и золоту
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleCreateRoom}
              disabled={creating}
              className="group flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold uppercase tracking-wider transition-all disabled:opacity-70"
              style={{
                background: creating
                  ? 'linear-gradient(135deg, #5A3D1A, #3D2914)'
                  : 'linear-gradient(135deg, #C9972B, #8A5A16)',
                color: '#2B1A12',
                border: '3px solid #5A3D1A',
                boxShadow: creating
                  ? 'none'
                  : 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.4)',
                fontFamily: 'Georgia, serif',
              }}
            >
              <Map size={22} />
              {creating ? 'Создаём...' : 'Создать новую карту'}
            </button>

            <button
              onClick={() => navigate('/rooms')}
              className="group flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold uppercase tracking-wider transition-all"
              style={{
                background: 'linear-gradient(135deg, #4A2C1A, #3a2214)',
                color: '#F3E1B8',
                border: '3px solid #8A5A16',
                boxShadow: 'inset 0 1px 0 rgba(201,151,43,0.2), 0 4px 12px rgba(0,0,0,0.3)',
                fontFamily: 'Georgia, serif',
              }}
            >
              <BookOpen size={22} />
              Архив пиратских карт
            </button>
          </div>

          {/* Footer decoration */}
          <div className="flex items-center justify-center gap-2 opacity-60">
            <Waves size={16} color="#8A5A16" />
            <span style={{ color: '#5A3D1A', fontFamily: 'Georgia, serif', fontSize: '12px' }}>
              Создавай, рисуй, покоряй моря
            </span>
            <Waves size={16} color="#8A5A16" />
          </div>
        </div>

        {/* Edge burn effect */}
        <div
          className="absolute inset-0 pointer-events-none rounded"
          style={{
            boxShadow: 'inset 0 0 100px rgba(138,90,22,0.5), inset 0 0 200px rgba(74,44,26,0.2)',
          }}
        />
      </main>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateX(-5%) scaleX(0.9); opacity: 0.3; }
          50% { transform: translateX(5%) scaleX(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
