import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Send, ShieldCheck, LogOut, CheckCircle2, Clock3, Trash2, ArrowLeft, MessageCircle } from 'lucide-react';
import './style.css';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key && !url.includes('SEU-PROJETO') ? createClient(url, key) : null;

function App() {
  const [page,setPage] = useState(location.hash === '#admin' ? 'admin' : 'home');
  const [question,setQuestion] = useState('');
  const [sending,setSending] = useState(false);
  const [sent,setSent] = useState(false);
  const [error,setError] = useState('');
  const [session,setSession] = useState(null);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [questions,setQuestions] = useState([]);
  const [loading,setLoading] = useState(false);
  const [loginError,setLoginError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => setSession(data.session));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_e,s) => setSession(s));
    return () => subscription.unsubscribe();
  },[]);

  useEffect(() => {
    if (page === 'admin' && session) loadQuestions();
  },[page,session]);

  async function submit(e) {
    e.preventDefault(); setError('');
    if (!supabase) { setError('O aplicativo ainda precisa ser conectado ao banco de dados.'); return; }
    const clean = question.trim();
    if (clean.length < 5) { setError('Escreva uma pergunta com pelo menos 5 caracteres.'); return; }
    if (clean.length > 1500) { setError('A pergunta deve ter no máximo 1.500 caracteres.'); return; }
    setSending(true);
    const {error} = await supabase.from('questions').insert({body:clean});
    setSending(false);
    if (error) setError('Não foi possível enviar agora. Tente novamente.');
    else { setSent(true); setQuestion(''); }
  }

  async function login(e) {
    e.preventDefault(); setLoginError('');
    if (!supabase) { setLoginError('Configure o Supabase antes de entrar.'); return; }
    const {error} = await supabase.auth.signInWithPassword({email,password});
    if (error) setLoginError('E-mail ou senha inválidos, ou conta ainda não criada.');
  }
  async function loadQuestions() {
    setLoading(true);
    const {data,error} = await supabase.from('questions').select('id,body,status,created_at').order('created_at',{ascending:false});
    if (error) setLoginError('Não foi possível carregar. Verifique se sua conta está autorizada como administradora.');
    else { setQuestions(data || []); setLoginError(''); }
    setLoading(false);
  }
  async function updateStatus(id,status) {
    const {error} = await supabase.from('questions').update({status}).eq('id',id);
    if (!error) loadQuestions();
  }
  async function removeQuestion(id) {
    if (!confirm('Excluir esta pergunta permanentemente?')) return;
    const {error} = await supabase.from('questions').delete().eq('id',id);
    if (!error) loadQuestions();
  }
  async function logout() { await supabase.auth.signOut(); setPage('home'); location.hash=''; }

  return <div className="app">
    <header className="topbar">
      <a className="brand" href="#" onClick={(e)=>{e.preventDefault();setPage('home');location.hash='';}}>
        <span className="brand-mark">I</span><span>IMPACT <small>moviment</small></span>
      </a>
      <button className="admin-link" onClick={()=>{setPage('admin');location.hash='admin';}}><ShieldCheck size={16}/> Liderança</button>
    </header>

    {page === 'home' ? <main className="main">
      <div className="hero">
        <div className="eyebrow"><span></span> CRISTO É A RAIZ DE TODA SABEDORIA</div>
        <h1>Pode <em>perguntar!</em></h1>
        <p className="subtitle">Toda dúvida merece ser ouvida.</p>
        <p className="intro">Envie sua pergunta para o staff. Pode ser sobre a Bíblia, fé, vida cristã ou qualquer assunto que você queira conversar.</p>
      </div>
      <section className="form-card">
        {sent ? <div className="success">
          <div className="success-icon"><CheckCircle2 size={30}/></div>
          <h2>Pergunta enviada!</h2><p>Sua pergunta chegou à ao staff. Obrigado por confiar esse assunto a nós.</p>
          <button className="button secondary" onClick={()=>setSent(false)}>Enviar outra pergunta</button>
        </div> : <form onSubmit={submit}>
          <label htmlFor="question">Qual é a sua pergunta?</label>
          <textarea id="question" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={1500} placeholder="Escreva aqui, com tranquilidade..." required/>
          <div className="form-meta"><span>Não escreva informações pessoais se quiser manter o anonimato.</span><span>{question.length}/1500</span></div>
          {error && <p className="error">{error}</p>}
          <button className="button" disabled={sending || question.trim().length<5}><Send size={17}/>{sending?'Enviando...':'Enviar pergunta'}</button>
        </form>}
      </section>
      <div className="privacy"><ShieldCheck size={18}/><span><strong>Envio anônimo</strong><br/>O formulário não pede nome, telefone ou e-mail.</span></div>
      <footer>IMPACT <span>•</span> PERGUNTAS ANÔNIMAS</footer>
    </main> : <main className="admin-main">
      <button className="back" onClick={()=>{setPage('home');location.hash='';}}><ArrowLeft size={16}/> Voltar ao início</button>
      {!session ? <section className="login-card">
        <div className="login-icon"><ShieldCheck size={24}/></div><h1>Painel do Staff</h1>
        <p>Acesso exclusivo à equipe responsável pelo Impact.</p>
        <form onSubmit={login}>
          <label>E-mail</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required/>
          <label>Senha</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha" required/>
          {loginError && <p className="error">{loginError}</p>}
          <button className="button">Entrar</button>
        </form>
        <small>As contas da liderança são criadas previamente pelo administrador do sistema.</small>
      </section> : <section className="dashboard">
        <div className="dash-head"><div><div className="eyebrow">IMPACT / ADMINISTRAÇÃO</div><h1>Perguntas recebidas</h1><p>Gerencie as dúvidas enviadas anonimamente.</p></div><button className="logout" onClick={logout}><LogOut size={16}/> Sair</button></div>
        {loginError && <p className="error">{loginError}</p>}
        <div className="stats"><div><MessageCircle size={18}/><strong>{questions.length}</strong><span>Total</span></div><div><Clock3 size={18}/><strong>{questions.filter(q=>q.status==='pending').length}</strong><span>Pendentes</span></div><div><CheckCircle2 size={18}/><strong>{questions.filter(q=>q.status==='answered').length}</strong><span>Respondidas</span></div></div>
        {loading ? <p className="empty">Carregando perguntas...</p> : questions.length===0 ? <p className="empty">Nenhuma pergunta recebida ainda.</p> : <div className="question-list">{questions.map(q=><article className="question" key={q.id}>
          <div className="question-top"><span className={q.status==='answered'?'status done':'status'}>{q.status==='answered'?'Respondida':'Pendente'}</span><time>{new Date(q.created_at).toLocaleString('pt-BR')}</time></div>
          <p>{q.body}</p><div className="question-actions">
            {q.status==='pending' ? <button className="small-button" onClick={()=>updateStatus(q.id,'answered')}><CheckCircle2 size={15}/> Marcar respondida</button> : <button className="small-button" onClick={()=>updateStatus(q.id,'pending')}><Clock3 size={15}/> Reabrir</button>}
            <button className="delete" onClick={()=>removeQuestion(q.id)}><Trash2 size={15}/> Excluir</button>
          </div>
        </article>)}</div>}
        <button className="refresh" onClick={loadQuestions}>Atualizar perguntas</button>
      </section>}
    </main>}
  </div>
}
createRoot(document.getElementById('root')).render(<App/>);
