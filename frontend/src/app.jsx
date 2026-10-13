import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import QRCode from 'react-qr-code';
import { request } from './api';
import './styles.css';
import './theme.css';

function Layout({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  const signedIn = Boolean(localStorage.getItem('token'));
  function logout() {
    localStorage.removeItem('token');
    location.href = '/';
  }
  return <>
    <header className="topbar">
      <Link to="/" className="brand"><span className="brand-mark">P</span>PulsePoll</Link>
      <nav>
        {signedIn ? <>
          <Link to="/dashboard">Polls</Link>
          <Link to="/analytics">Analytics</Link>
          <Link to="/create">Create poll</Link>
          <button className="link" onClick={logout}>Log out</button>
        </> : <><Link to="/login">Log in</Link><Link to="/signup">Sign up</Link></>}
        <label className="theme-control" title="Toggle dark mode">
          <input type="checkbox" checked={dark} onChange={event => setDark(event.target.checked)} />
          <span>Dark mode</span>
        </label>
      </nav>
    </header>
    <main>{children}</main>
  </>;
}

function Home() {
  return <section className="hero">
    <p className="eyebrow">Live audience polling</p>
    <h1>Make every vote visible.</h1>
    <p className="hero-copy">Create a poll, share it anywhere, and follow votes as they arrive.</p>
    <Link className="btn" to={localStorage.getItem('token') ? '/create' : '/signup'}>Start a poll</Link>
  </section>;
}

function Auth({ signup = false }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    try {
      const result = await request(`/auth/${signup ? 'signup' : 'login'}`, { method: 'POST', body: JSON.stringify(form) });
      localStorage.setItem('token', result.token);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
    }
  }
  return <section className="panel auth-panel">
    <p className="eyebrow">PulsePoll account</p>
    <h1>{signup ? 'Create account' : 'Welcome back'}</h1>
    {error && <p className="error">{error}</p>}
    <form onSubmit={submit}>
      {signup && <label>Name<input required minLength="2" maxLength="80" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>}
      <label>Email<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
      <label>Password<input required minLength="8" type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
      <button className="btn" type="submit">{signup ? 'Sign up' : 'Log in'}</button>
    </form>
  </section>;
}

function Guard({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />;
}

function CreatePoll() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expiresInHours, setExpiresInHours] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    try {
      const poll = await request('/polls', { method: 'POST', body: JSON.stringify({ question, options, expiresInHours }) });
      navigate(`/poll/${poll.id}`);
    } catch (requestError) {
      setError(requestError.message);
    }
  }
  return <section className="panel form-panel">
    <div className="page-heading"><div><p className="eyebrow">New audience question</p><h1>Create a poll</h1></div></div>
    {error && <p className="error">{error}</p>}
    <form onSubmit={submit}>
      <label>Question<input required minLength="5" maxLength="240" value={question} onChange={event => setQuestion(event.target.value)} placeholder="What should we decide together?" /></label>
      <fieldset><legend>Answer options</legend>
        {options.map((option, index) => <div className="option-edit" key={index}>
          <input required maxLength="100" value={option} onChange={event => setOptions(options.map((value, i) => i === index ? event.target.value : value))} placeholder={`Option ${index + 1}`} />
          {options.length > 2 && <button type="button" className="icon-button" aria-label={`Remove option ${index + 1}`} onClick={() => setOptions(options.filter((_, i) => i !== index))}>×</button>}
        </div>)}
        {options.length < 8 && <button type="button" className="secondary" onClick={() => setOptions([...options, ''])}>Add option</button>}
      </fieldset>
      <label>Poll closes<select value={expiresInHours} onChange={event => setExpiresInHours(Number(event.target.value))}>
        <option value={0}>Never</option><option value={1}>In 1 hour</option><option value={24}>In 24 hours</option><option value={168}>In 7 days</option><option value={720}>In 30 days</option>
      </select></label>
      <button className="btn" type="submit">Create poll</button>
    </form>
  </section>;
}

function Dashboard() {
  const [polls, setPolls] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    request('/polls/mine').then(data => setPolls(Array.isArray(data) ? data : [])).catch(requestError => setError(requestError.message));
  }, []);
  return <>
    <div className="page-heading"><div><p className="eyebrow">Workspace</p><h1>Your polls</h1><p className="muted">Manage questions, share links, and follow participation.</p></div><Link className="btn" to="/create">New poll</Link></div>
    {error ? <p className="error">{error}</p> : polls.length === 0 ? <section className="empty-state"><h2>No polls yet</h2><p className="muted">Create your first question to start collecting votes.</p><Link className="btn" to="/create">Create a poll</Link></section> : <div className="poll-list">
      {polls.map(poll => <Link className="poll-row" to={`/poll/${poll.id}`} key={poll.id}>
        <div><span className={`status ${poll.status}`}>{poll.status}</span><h2>{poll.question}</h2><p className="muted">{poll.options.length} options{poll.expiresAt ? ` · closes ${new Date(poll.expiresAt).toLocaleString()}` : ''}</p></div>
        <span className="row-arrow" aria-hidden="true">→</span>
      </Link>)}
    </div>}
  </>;
}

function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    request('/analytics').then(setData).catch(requestError => setError(requestError.message));
  }, []);
  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading analytics…</p>;
  const chartData = data.polls.map(poll => ({ name: poll.question, votes: poll.totalVotes, views: poll.views }));
  return <>
    <div className="page-heading"><div><p className="eyebrow">Performance</p><h1>Analytics</h1><p className="muted">Participation across your polls.</p></div></div>
    <section className="metric-grid">
      <article className="metric"><span>Total polls</span><strong>{data.totalPolls}</strong></article>
      <article className="metric"><span>Active polls</span><strong>{data.activePolls}</strong></article>
      <article className="metric"><span>Total votes</span><strong>{data.totalVotes}</strong></article>
      <article className="metric"><span>Total views</span><strong>{data.totalViews}</strong></article>
    </section>
    {chartData.length ? <section className="panel analytics-chart"><h2>Votes and views</h2><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} /><Tooltip /><Bar dataKey="votes" fill="#e35b3f" radius={[4, 4, 0, 0]} /><Bar dataKey="views" fill="#168b85" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></section> : <section className="empty-state"><h2>Analytics will appear here</h2><p className="muted">Share a poll to start collecting views and votes.</p></section>}
    <section className="analytics-table"><h2>Poll performance</h2>{data.polls.map(poll => <Link className="analytics-row" to={`/poll/${poll.id}`} key={poll.id}><span>{poll.question}</span><span>{poll.totalVotes} votes</span><span>{poll.views} views</span><span className={`status ${poll.status}`}>{poll.status}</span></Link>)}</section>
  </>;
}

function SharePanel({ shareUrl, onCopy }) {
  const [isOpen, setIsOpen] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = event => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  function downloadQr() {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const image = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([image], { type: 'image/svg+xml;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pulsepoll-qr.svg';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <>
    <section className="share-section">
      <div className="share-heading"><div><p className="eyebrow">Share poll</p><h2>Invite people to vote</h2></div></div>
      <div className="share-controls">
        <input readOnly aria-label="Poll share link" value={shareUrl} />
        <div className="share-actions">
          <button type="button" className="secondary" onClick={onCopy}>Copy link</button>
          <button type="button" className="secondary" onClick={() => setIsOpen(true)}>Show QR code</button>
        </div>
      </div>
    </section>
    {isOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setIsOpen(false); }}>
      <section className="qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-title">
        <div className="qr-modal-heading">
          <div><p className="eyebrow">Share poll</p><h2 id="qr-title">QR Code</h2></div>
          <button type="button" className="icon-button modal-close" aria-label="Close QR code" onClick={() => setIsOpen(false)}>×</button>
        </div>
        <div className="qr-code" ref={qrRef}><QRCode value={shareUrl} size={220} /></div>
        <p className="qr-caption">Scan to vote instantly</p>
        <a className="qr-url" href={shareUrl}>{shareUrl}</a>
        <button type="button" className="btn download-qr" onClick={downloadQr}>Download QR</button>
      </section>
    </div>}
  </>;
}

function formatPollDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function Poll() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [snapshot, setSnapshot] = useState({ results: [], totalVotes: 0 });
  const [viewers, setViewers] = useState(0);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimers = useRef([]);
  const [live, setLive] = useState(false);
  useEffect(() => {
    let socket;
    let retry;
    let disposed = false;
    request(`/polls/${id}`).then(setPoll).catch(error => setMessage(error.message));
    request(`/polls/${id}/results`).then(setSnapshot).catch(error => setMessage(error.message));
    const base = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    const connect = () => {
      if (disposed) return;
      socket = new WebSocket(`${base}/ws/polls/${id}`);
      socket.onopen = () => setLive(true);
      socket.onmessage = event => {
        const update = JSON.parse(event.data);
        if (update.type === 'viewers.updated') setViewers(update.viewers);
        else if (update.type === 'poll.updated') setPoll(current => current ? { ...current, status: update.status } : current);
        else if (Array.isArray(update.results)) setSnapshot(update);
      };
      socket.onclose = () => {
        setLive(false);
        if (!disposed) retry = setTimeout(connect, 1500);
      };
    };
    connect();
    return () => { disposed = true; clearTimeout(retry); socket?.close(); };
  }, [id]);
  useEffect(() => {
    if (!poll?.expiresAt || poll.status !== 'active') return;
    const checkExpiry = () => {
      if (Date.now() >= new Date(poll.expiresAt).getTime()) {
        request(`/polls/${id}`).then(setPoll).catch(error => setMessage(error.message));
      }
    };
    const timer = setInterval(checkExpiry, 5000);
    checkExpiry();
    return () => clearInterval(timer);
  }, [id, poll?.expiresAt, poll?.status]);
  useEffect(() => () => toastTimers.current.forEach(clearTimeout), []);
  function showCopiedToast() {
    toastTimers.current.forEach(clearTimeout);
    setToast({ leaving: false });
    toastTimers.current = [
      setTimeout(() => setToast(current => current ? { leaving: true } : current), 1700),
      setTimeout(() => setToast(null), 2000)
    ];
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/poll/${id}`);
      showCopiedToast();
    } catch {
      setMessage('Could not copy the link. Please copy the URL manually.');
    }
  }
  async function vote(optionId) {
    try {
      const result = await request(`/polls/${id}/votes`, { method: 'POST', body: JSON.stringify({ optionId, voterId: getVoterId() }) });
      setSnapshot(result);
      setMessage('Vote recorded.');
    } catch (error) {
      setMessage(error.message);
    }
  }
  async function closePoll() {
    try {
      await request(`/polls/${id}/close`, { method: 'POST' });
      setPoll({ ...poll, status: 'closed' });
    } catch (error) {
      setMessage(error.message);
    }
  }
  if (!poll) return <p className="muted">Loading poll…</p>;
  const shareUrl = `${location.origin}/poll/${id}`;
  return <>
    <div className="poll-toolbar"><span className="connection"><i className={live ? 'dot on' : 'dot'} />{live ? 'Live' : 'Connecting'}</span><span className="viewer-count"><i className="viewer-pulse" />{viewers} Viewers Online</span></div>
    <div className="poll-layout">
      <section className="panel poll-panel">
        <div className="poll-title-row"><span className={`status ${poll.status}`}>{poll.status}</span></div>
        <h1>{poll.question}</h1>
        <div className="poll-meta">
          <span>Created by <strong>{poll.creatorName || 'Poll creator'}</strong></span>
          {poll.createdAt && <span>Created {formatPollDate(poll.createdAt)}</span>}
          {poll.expiresAt && <span>Expires {formatPollDate(poll.expiresAt)}</span>}
        </div>
        {message && <p className="notice" role="status">{message}</p>}
        <div className="vote-options">{poll.options.map(option => <button className="vote-option" disabled={poll.status !== 'active'} onClick={() => vote(option.id)} key={option.id}>{option.text}<span aria-hidden="true">→</span></button>)}</div>
        <SharePanel shareUrl={shareUrl} onCopy={copyLink} />
        {localStorage.getItem('token') && poll.status === 'active' && <button className="danger" onClick={closePoll}>Close poll</button>}
      </section>
      {snapshot.totalVotes > 0 && <section className="panel results-panel"><div className="section-heading"><div><p className="eyebrow">Audience response</p><h2>Live results</h2></div><strong>{snapshot.totalVotes} votes</strong></div>
        <div className="result-list">{poll.options.map(option => {
          const count = snapshot.results.find(result => result.optionId === option.id)?.count || 0;
          const percentage = snapshot.totalVotes ? Math.floor(count * 100 / snapshot.totalVotes) : 0;
          return <article className="result-option" key={option.id}>
            <div className="result-heading"><h3>{option.text}</h3><strong>{percentage}%</strong></div>
            <div className="progress-track" role="progressbar" aria-label={`${option.text} votes`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={percentage}><span className="progress-value" style={{ width: `${percentage}%` }} /></div>
            <p className="result-count">{count} {count === 1 ? 'vote' : 'votes'}</p>
          </article>;
        })}</div>
      </section>}
    </div>
    {toast && <div className={`toast-success${toast.leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite"><span className="toast-icon" aria-hidden="true">✓</span>Link copied successfully</div>}
  </>;
}

function getVoterId() {
  let id = localStorage.getItem('voterId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('voterId', id);
  }
  return id;
}

function App() {
  return <BrowserRouter><Layout><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Auth />} />
    <Route path="/signup" element={<Auth signup />} />
    <Route path="/create" element={<Guard><CreatePoll /></Guard>} />
    <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
    <Route path="/analytics" element={<Guard><Analytics /></Guard>} />
    <Route path="/poll/:id" element={<Poll />} />
  </Routes></Layout></BrowserRouter>;
}

createRoot(document.getElementById('root')).render(<App />);
