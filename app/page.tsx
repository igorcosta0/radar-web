'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Edital {
  id: string;
  edital: {
    titulo: string;
    orgao: string;
    valorEstimado: number | null;
    dataLimite: string | null;
    estado: string | null;
    modalidade: string | null;
  };
  score: number;
  funnelStatus: string;
}

interface Stats {
  total: number;
  processados: number;
  novosHoje: number;
}

function scoreColor(s: number) {
  if (s >= 80) return '#1ec98d';
  if (s >= 60) return '#f5a623';
  return '#888';
}

function fmt(val: number | null) {
  if (!val) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export default function Home() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('igor@radar.com');
  const [senha, setSenha] = useState('admin123');
  const [editais, setEditais] = useState<Edital[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function login() {
    setErro('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: senha }),
      });
      if (!res.ok) throw new Error('Credenciais inválidas');
      const data = await res.json();
      setToken(data.access_token);
      await carregarDados(data.access_token);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function carregarDados(t: string) {
    const [e, s] = await Promise.all([
      fetch(`${API}/editais`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
      fetch(`${API}/editais/stats`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
    ]);
    setEditais(Array.isArray(e) ? e : []);
    setStats(s);
  }

  if (!token) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ background: '#131318', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 32, width: 340 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 32, height: 32, background: '#7c6ff7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📡</div>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Radar de Oportunidades</span>
        </div>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" style={inputStyle} />
        <input value={senha} onChange={e => setSenha(e.target.value)} type="password" placeholder="Senha" style={{ ...inputStyle, marginTop: 8 }} />
        {erro && <div style={{ color: '#f06060', fontSize: 12, marginTop: 8 }}>{erro}</div>}
        <button onClick={login} disabled={loading} style={btnStyle}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: 200, background: '#131318', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 16px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, background: '#7c6ff7', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📡</div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Radar</span>
        </div>
        {['Dashboard', 'Oportunidades'].map(item => (
          <div key={item} style={{ padding: '7px 16px', fontSize: 12.5, color: item === 'Dashboard' ? '#a89cf9' : '#8888a0', background: item === 'Dashboard' ? 'rgba(124,111,247,0.1)' : 'none', cursor: 'pointer' }}>
            {item}
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: 16, left: 0, width: 200, padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#eeeef2' }}>Igor</div>
          <div style={{ fontSize: 10, color: '#44444e' }}>Administrador</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Dashboard</div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Editais no banco', val: stats.total },
              { label: 'Processados', val: stats.processados },
              { label: 'Novos hoje', val: stats.novosHoje },
            ].map(k => (
              <div key={k.label} style={{ background: '#131318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, color: '#8888a0', marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{k.val}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
          {editais.length > 0 ? `${editais.length} oportunidades` : 'Carregando...'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {editais.map(e => (
            <div key={e.id} style={{ background: '#131318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '13px 15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, flex: 1, lineHeight: 1.4 }}>{e.edital.titulo}</div>
                <div style={{ background: `${scoreColor(e.score)}22`, color: scoreColor(e.score), border: `1px solid ${scoreColor(e.score)}44`, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 800, marginLeft: 10, flexShrink: 0 }}>
                  {e.score}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#8888a0' }}>🏛 {e.edital.orgao}</span>
                <span style={{ fontSize: 11, color: '#8888a0' }}>💰 {fmt(e.edital.valorEstimado)}</span>
                {e.edital.estado && <span style={{ fontSize: 11, color: '#8888a0' }}>📍 {e.edital.estado}</span>}
                {e.edital.dataLimite && <span style={{ fontSize: 11, color: '#8888a0' }}>📅 {new Date(e.edital.dataLimite).toLocaleDateString('pt-BR')}</span>}
                <span style={{ fontSize: 10, background: 'rgba(124,111,247,0.1)', color: '#a89cf9', border: '1px solid rgba(124,111,247,0.25)', borderRadius: 20, padding: '1px 8px' }}>{e.edital.modalidade || 'Pregão'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', background: '#1a1a20',
  border: '1px solid rgba(255,255,255,0.11)', borderRadius: 8,
  color: '#eeeef2', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  width: '100%', marginTop: 16, padding: '9px', background: '#7c6ff7',
  color: '#fff', border: 'none', borderRadius: 8, fontSize: 13,
  fontWeight: 600, cursor: 'pointer',
};