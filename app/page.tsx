'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

interface EditalData {
  id: string;
  titulo: string;
  objeto: string;
  orgao: string;
  cnpjOrgao: string | null;
  cidade: string | null;
  estado: string | null;
  modalidade: string | null;
  valorEstimado: number | null;
  dataPublicacao: string | null;
  dataLimite: string | null;
  linkEdital: string | null;
}

interface Edital {
  id: string;
  edital: EditalData;
  score: number;
  funnelStatus: string;
}

interface Stats {
  total: number;
  processados: number;
  novosHoje: number;
}

interface Perfil {
  id: string;
  name: string;
}

interface Documento {
  id: string;
  nome: string;
  url: string;
  tipo: string | null;
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

function fmtData(val: string | null) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('pt-BR');
}

export default function Home() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('igor@radar.com');
  const [senha, setSenha] = useState('admin123');
  const [editais, setEditais] = useState<Edital[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [perfilAtivo, setPerfilAtivo] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editalSelecionado, setEditalSelecionado] = useState<EditalData | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregandoDocs, setCarregandoDocs] = useState(false);

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
      const listaPerfis = await carregarPerfis(data.access_token);
      await carregarDados(data.access_token, listaPerfis[0]?.id ?? null);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function carregarPerfis(t: string): Promise<Perfil[]> {
    try {
      const res = await fetch(`${API}/perfis`, { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setPerfis(lista);
      if (lista.length > 0) setPerfilAtivo(lista[0].id);
      return lista;
    } catch {
      return [];
    }
  }

  async function carregarDados(t: string, pid: string | null) {
    const url = pid ? `${API}/editais?perfilId=${pid}` : `${API}/editais`;
    const [e, s] = await Promise.all([
      fetch(url, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
      fetch(`${API}/editais/stats`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
    ]);
    setEditais(Array.isArray(e) ? e : []);
    setStats(s);
  }

  async function trocarPerfil(pid: string | null) {
    setPerfilAtivo(pid);
    await carregarDados(token, pid);
  }

  async function abrirEdital(ed: EditalData) {
    setEditalSelecionado(ed);
    setModalAberto(true);
    setDocumentos([]);
    setCarregandoDocs(true);

    try {
      const res = await fetch(`${API}/editais/${ed.id}/documentos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDocumentos(data.documentos || []);
    } catch (e) {
      setDocumentos([]);
    } finally {
      setCarregandoDocs(false);
    }
  }

  function fecharModal() {
    setModalAberto(false);
    setEditalSelecionado(null);
    setDocumentos([]);
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
      <div style={{ width: 200, background: '#131318', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 0', flexShrink: 0, position: 'relative' }}>
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

        {perfis.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {perfis.map(p => (
              <button
                key={p.id}
                onClick={() => trocarPerfil(p.id)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                  background: perfilAtivo === p.id ? '#7c6ff7' : 'transparent',
                  color: perfilAtivo === p.id ? '#fff' : '#8888a0',
                  borderColor: perfilAtivo === p.id ? '#7c6ff7' : 'rgba(255,255,255,0.12)',
                }}
              >
                {p.name}
              </button>
            ))}
            <button
              onClick={() => trocarPerfil(null)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: perfilAtivo === null ? '#7c6ff7' : 'transparent',
                color: perfilAtivo === null ? '#fff' : '#8888a0',
                borderColor: perfilAtivo === null ? '#7c6ff7' : 'rgba(255,255,255,0.12)',
              }}
            >
              Todos
            </button>
          </div>
        )}

        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
          {editais.length > 0 ? `${editais.length} oportunidades` : 'Carregando...'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {editais.map(e => (
            <div
              key={e.id}
              onClick={() => abrirEdital(e.edital)}
              style={{ background: '#131318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '13px 15px', cursor: 'pointer', transition: 'border-color .15s' }}
              onMouseEnter={ev => (ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
              onMouseLeave={ev => (ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
            >
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
                {e.edital.dataLimite && <span style={{ fontSize: 11, color: '#8888a0' }}>📅 {fmtData(e.edital.dataLimite)}</span>}
                <span style={{ fontSize: 10, background: 'rgba(124,111,247,0.1)', color: '#a89cf9', border: '1px solid rgba(124,111,247,0.25)', borderRadius: 20, padding: '1px 8px' }}>{e.edital.modalidade || 'Pregão'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalAberto && editalSelecionado && (
        <div
          onClick={fecharModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
        >
          <div
            onClick={ev => ev.stopPropagation()}
            style={{ background: '#131318', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 14, width: '100%', maxWidth: 600, maxHeight: '85vh', overflow: 'auto', padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{editalSelecionado.titulo}</div>
              <button onClick={fecharModal} style={{ background: 'none', border: 'none', color: '#8888a0', fontSize: 20, cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <InfoItem label="Órgão" value={editalSelecionado.orgao} />
              <InfoItem label="Valor estimado" value={fmt(editalSelecionado.valorEstimado)} />
              <InfoItem label="Modalidade" value={editalSelecionado.modalidade || '—'} />
              <InfoItem label="Cidade/UF" value={`${editalSelecionado.cidade || '—'} / ${editalSelecionado.estado || '—'}`} />
              <InfoItem label="Publicação" value={fmtData(editalSelecionado.dataPublicacao)} />
              <InfoItem label="Data limite" value={fmtData(editalSelecionado.dataLimite)} />
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: '#44444e', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Objeto</div>
            <div style={{ background: '#1a1a20', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#8888a0', lineHeight: 1.7, marginBottom: 20, borderLeft: '3px solid #7c6ff7' }}>
              {editalSelecionado.objeto}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: '#44444e', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Documentos e anexos</div>

            {carregandoDocs && <div style={{ fontSize: 12, color: '#8888a0' }}>Buscando documentos no PNCP...</div>}

            {!carregandoDocs && documentos.length === 0 && (
              <div style={{ fontSize: 12, color: '#8888a0' }}>Nenhum documento disponível para download neste edital.</div>
            )}

            {!carregandoDocs && documentos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {documentos.map(doc => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#1a1a20', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', color: '#eeeef2', fontSize: 12.5 }}
                  >
                    <span>📄</span>
                    <span style={{ flex: 1 }}>{doc.nome}</span>
                    <span style={{ fontSize: 11, color: '#7c6ff7' }}>Baixar ↓</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#1a1a20', borderRadius: 8, padding: '9px 11px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#44444e', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700 }}>{value}</div>
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