import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="SourceU CRM — Internal Tool" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

                :root {
                    --purple:       #5B2D8E;
                    --purple-light: #7B4DB5;
                    --purple-pale:  #F3EEFF;
                    --purple-soft:  #EDE5FA;
                    --gold:         #F5C842;
                    --gold-dim:     #C9A030;
                    --gold-pale:    #FEF9E7;
                    --text:         #1A0F2E;
                    --text-mid:     #5A4B73;
                    --text-muted:   #9B8DB5;
                    --border:       #E4D9F5;
                    --bg:           #FAFBFF;
                    --white:        #FFFFFF;
                    --card-shadow:  0 2px 16px rgba(91,45,142,0.08);
                    --card-shadow-hover: 0 8px 32px rgba(91,45,142,0.14);
                }

                * { margin: 0; padding: 0; box-sizing: border-box; }

                body {
                    background: var(--bg);
                    color: var(--text);
                    font-family: 'DM Sans', sans-serif;
                    overflow-x: hidden;
                    -webkit-font-smoothing: antialiased;
                }

                .bg-deco {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                    overflow: hidden;
                }
                .bg-deco::before {
                    content: '';
                    position: absolute;
                    top: -160px; right: -120px;
                    width: 640px; height: 640px;
                    background: radial-gradient(ellipse, rgba(91,45,142,0.09) 0%, transparent 68%);
                }
                .bg-deco::after {
                    content: '';
                    position: absolute;
                    bottom: -80px; left: -80px;
                    width: 480px; height: 480px;
                    background: radial-gradient(ellipse, rgba(245,200,66,0.07) 0%, transparent 68%);
                }

                /* NAV */
                nav {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    z-index: 100;
                    background: rgba(255,255,255,0.88);
                    backdrop-filter: blur(16px);
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 64px;
                    height: 64px;
                }

                .logo-wrap {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-decoration: none;
                }
                .logo-text {
                    font-family: 'Sora', sans-serif;
                    font-size: 1.35rem;
                    font-weight: 800;
                    color: var(--purple);
                    letter-spacing: -0.02em;
                    position: relative;
                }
                .logo-text::after {
                    content: '';
                    position: absolute;
                    bottom: -2px; left: 0;
                    width: 55%;
                    height: 3px;
                    background: var(--gold);
                    border-radius: 2px;
                }
                .logo-badge {
                    background: var(--purple-pale);
                    color: var(--purple);
                    font-size: 0.68rem;
                    font-weight: 700;
                    letter-spacing: 0.07em;
                    text-transform: uppercase;
                    padding: 3px 9px;
                    border-radius: 100px;
                    border: 1px solid var(--border);
                }

                .nav-center {
                    display: flex;
                    gap: 4px;
                    list-style: none;
                }
                .nav-center a {
                    color: var(--text-mid);
                    text-decoration: none;
                    font-size: 0.875rem;
                    font-weight: 500;
                    padding: 6px 14px;
                    border-radius: 8px;
                    transition: background 0.18s, color 0.18s;
                }
                .nav-center a:hover { background: var(--purple-pale); color: var(--purple); }

                .nav-right { display: flex; align-items: center; gap: 10px; }
                .btn-ghost {
                    color: var(--purple);
                    text-decoration: none;
                    font-size: 0.875rem;
                    font-weight: 600;
                    padding: 8px 18px;
                    border-radius: 8px;
                    border: 1.5px solid var(--border);
                    transition: border-color 0.18s, background 0.18s;
                }
                .btn-ghost:hover { border-color: var(--purple-light); background: var(--purple-pale); }
                .btn-fill {
                    background: var(--purple);
                    color: #fff;
                    text-decoration: none;
                    font-size: 0.875rem;
                    font-weight: 600;
                    padding: 8px 20px;
                    border-radius: 8px;
                    transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
                    box-shadow: 0 2px 10px rgba(91,45,142,0.2);
                }
                .btn-fill:hover { background: var(--purple-light); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(91,45,142,0.28); }

                /* HERO */
                .hero {
                    position: relative;
                    z-index: 1;
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 148px 64px 80px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 64px;
                    align-items: center;
                }

                .hero-left { animation: fadeUp 0.65s ease both; }

                .hero-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    background: var(--gold-pale);
                    border: 1px solid rgba(245,200,66,0.4);
                    color: #8A6A00;
                    font-size: 0.75rem;
                    font-weight: 600;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    padding: 5px 12px;
                    border-radius: 100px;
                    margin-bottom: 24px;
                }
                .chip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); }

                .hero h1 {
                    font-family: 'Sora', sans-serif;
                    font-size: clamp(2.2rem, 4vw, 3.4rem);
                    font-weight: 800;
                    line-height: 1.08;
                    letter-spacing: -0.03em;
                    color: var(--text);
                    margin-bottom: 20px;
                }
                .hero h1 em {
                    font-style: normal;
                    color: var(--purple);
                    position: relative;
                }
                .hero h1 em::after {
                    content: '';
                    position: absolute;
                    bottom: 2px; left: 0; right: 0;
                    height: 3px;
                    background: var(--gold);
                    border-radius: 2px;
                    opacity: 0.6;
                }

                .hero p {
                    font-size: 1rem;
                    line-height: 1.75;
                    color: var(--text-mid);
                    margin-bottom: 36px;
                    max-width: 440px;
                }
                .hero-actions { display: flex; gap: 12px; align-items: center; }
                .btn-hero {
                    background: var(--purple);
                    color: #fff;
                    padding: 13px 28px;
                    border-radius: 10px;
                    font-family: 'Sora', sans-serif;
                    font-weight: 700;
                    font-size: 0.9rem;
                    text-decoration: none;
                    box-shadow: 0 4px 18px rgba(91,45,142,0.25);
                    transition: all 0.2s;
                }
                .btn-hero:hover { background: var(--purple-light); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(91,45,142,0.32); }
                .btn-link {
                    color: var(--text-mid);
                    text-decoration: none;
                    font-size: 0.875rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: color 0.18s, gap 0.18s;
                }
                .btn-link:hover { color: var(--purple); gap: 10px; }

                /* MOCKUP */
                .hero-right { animation: fadeUp 0.65s 0.15s ease both; }
                .mockup-card {
                    background: var(--white);
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    box-shadow: 0 8px 40px rgba(91,45,142,0.10);
                    overflow: hidden;
                }
                .mockup-topbar {
                    background: var(--purple);
                    padding: 14px 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .dot { width:10px; height:10px; border-radius:50%; }
                .dot-r { background:#FF5F57; } .dot-y { background:#FFBD2E; } .dot-g { background:#28CA41; }
                .mockup-title { margin-left: 8px; font-family:'Sora',sans-serif; font-size:0.78rem; font-weight:600; color:rgba(255,255,255,0.7); letter-spacing:0.04em; }
                .mockup-body { padding: 20px; }
                .mock-row { display:flex; gap:10px; margin-bottom:10px; }
                .mock-stat { flex:1; background:var(--purple-pale); border-radius:10px; padding:14px 16px; }
                .mock-stat-num { font-family:'Sora',sans-serif; font-size:1.3rem; font-weight:800; color:var(--purple); }
                .mock-stat-label { font-size:0.7rem; color:var(--text-muted); margin-top:2px; }
                .mock-gold { background: var(--gold-pale); }
                .mock-gold .mock-stat-num { color: #8A6A00; }
                .mock-pipeline-label { font-size:0.72rem; font-weight:600; color:var(--text-muted); letter-spacing:0.05em; text-transform:uppercase; margin-bottom:10px; }
                .pipeline-stages { display:flex; gap:6px; }
                .stage { flex:1; border-radius:8px; padding:10px; border:1px solid var(--border); }
                .stage-name { font-size:0.65rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; }
                .stage-cards { display:flex; flex-direction:column; gap:5px; }
                .stage-card { background:var(--white); border:1px solid var(--border); border-radius:6px; padding:6px 8px; font-size:0.65rem; color:var(--text); font-weight:500; box-shadow:0 1px 4px rgba(91,45,142,0.06); }
                .stage-card span { display:block; font-size:0.6rem; color:var(--text-muted); font-weight:400; margin-top:1px; }

                /* DIVIDER */
                .divider { max-width:1100px; margin:0 auto; padding:0 64px; position:relative; z-index:1; }
                .divider-inner { border-top:1px solid var(--border); padding:36px 0; display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
                .divider-text { font-size:0.78rem; color:var(--text-muted); white-space:nowrap; font-weight:500; }
                .dept-pills { display:flex; gap:8px; flex-wrap:wrap; }
                .dept-pill { background:var(--white); border:1px solid var(--border); border-radius:100px; padding:5px 14px; font-size:0.75rem; color:var(--text-mid); font-weight:500; }

                /* SECTIONS */
                .section { position:relative; z-index:1; max-width:1100px; margin:0 auto; padding:72px 64px; }
                .section-eyebrow { font-size:0.72rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--purple); margin-bottom:12px; }
                .section-title { font-family:'Sora',sans-serif; font-size:clamp(1.7rem,2.8vw,2.4rem); font-weight:800; line-height:1.12; letter-spacing:-0.025em; color:var(--text); max-width:480px; margin-bottom:48px; }
                .section-title span { color:var(--purple); }

                /* FEATURES */
                .features-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
                .feat-card { background:var(--white); border:1px solid var(--border); border-radius:16px; padding:28px 24px; box-shadow:var(--card-shadow); transition:box-shadow 0.22s,transform 0.22s,border-color 0.22s; }
                .feat-card:hover { box-shadow:var(--card-shadow-hover); transform:translateY(-3px); border-color:rgba(91,45,142,0.22); }
                .feat-icon { width:42px; height:42px; border-radius:10px; background:var(--purple-pale); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:1.2rem; margin-bottom:18px; }
                .feat-card h3 { font-family:'Sora',sans-serif; font-size:0.95rem; font-weight:700; color:var(--text); margin-bottom:8px; }
                .feat-card p { font-size:0.83rem; line-height:1.65; color:var(--text-mid); }

                /* WHO */
                .who-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
                .who-card { background:var(--white); border:1px solid var(--border); border-radius:16px; padding:28px; box-shadow:var(--card-shadow); display:flex; gap:20px; align-items:flex-start; transition:box-shadow 0.22s,transform 0.22s; }
                .who-card:hover { box-shadow:var(--card-shadow-hover); transform:translateY(-2px); }
                .who-icon { width:46px; height:46px; border-radius:12px; background:var(--purple-pale); display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0; }
                .who-card h4 { font-family:'Sora',sans-serif; font-size:0.95rem; font-weight:700; color:var(--text); margin-bottom:6px; }
                .who-card p { font-size:0.82rem; line-height:1.65; color:var(--text-mid); }

                /* STEPS */
                .steps-list { display:flex; flex-direction:column; gap:0; margin-top:48px; max-width:640px; }
                .step-row { display:flex; gap:24px; align-items:flex-start; padding-bottom:36px; position:relative; }
                .step-row:not(:last-child)::before { content:''; position:absolute; left:19px; top:42px; bottom:0; width:2px; background:var(--border); }
                .step-circle { width:40px; height:40px; border-radius:50%; background:var(--purple); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Sora',sans-serif; font-size:0.8rem; font-weight:800; flex-shrink:0; position:relative; z-index:1; box-shadow:0 2px 10px rgba(91,45,142,0.25); }
                .step-content h4 { font-family:'Sora',sans-serif; font-size:0.95rem; font-weight:700; color:var(--text); margin-bottom:6px; margin-top:8px; }
                .step-content p { font-size:0.83rem; line-height:1.65; color:var(--text-mid); }

                /* ACCESS BANNER */
                .access-section { position:relative; z-index:1; max-width:1100px; margin:20px auto 80px; padding:0 64px; }
                .access-inner { background:linear-gradient(135deg,var(--purple) 0%,#7B4DB5 100%); border-radius:20px; padding:56px 64px; display:flex; align-items:center; justify-content:space-between; gap:48px; position:relative; overflow:hidden; }
                .access-inner::before { content:''; position:absolute; top:-50%; right:-5%; width:360px; height:360px; background:radial-gradient(ellipse,rgba(255,255,255,0.08) 0%,transparent 65%); pointer-events:none; }
                .access-left h2 { font-family:'Sora',sans-serif; font-size:clamp(1.5rem,2.5vw,2rem); font-weight:800; color:#fff; line-height:1.15; letter-spacing:-0.02em; margin-bottom:10px; }
                .access-left p { font-size:0.9rem; color:rgba(255,255,255,0.7); line-height:1.6; max-width:380px; }
                .access-right { display:flex; flex-direction:column; gap:12px; align-items:flex-end; flex-shrink:0; position:relative; z-index:1; }
                .btn-access { background:var(--gold); color:#1a0a3c; padding:13px 30px; border-radius:10px; font-family:'Sora',sans-serif; font-weight:700; font-size:0.9rem; text-decoration:none; transition:all 0.2s; box-shadow:0 4px 16px rgba(245,200,66,0.3); white-space:nowrap; }
                .btn-access:hover { background:#e0b530; transform:translateY(-2px); box-shadow:0 8px 24px rgba(245,200,66,0.4); }
                .access-note { font-size:0.75rem; color:rgba(255,255,255,0.5); text-align:right; }

                /* FOOTER */
                footer { position:relative; z-index:1; border-top:1px solid var(--border); padding:28px 64px; max-width:1100px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:24px; }
                .footer-left { display:flex; align-items:center; gap:20px; }
                .footer-copy { font-size:0.78rem; color:var(--text-muted); }
                .footer-links { display:flex; gap:20px; list-style:none; }
                .footer-links a { font-size:0.78rem; color:var(--text-muted); text-decoration:none; transition:color 0.18s; }
                .footer-links a:hover { color:var(--purple); }
                .footer-tag { background:var(--purple-pale); color:var(--purple); font-size:0.68rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:3px 9px; border-radius:100px; border:1px solid var(--border); }

                @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

                @media (max-width: 1024px) {
                    nav { padding: 0 28px; }
                    .hero { grid-template-columns: 1fr; gap: 40px; padding: 120px 28px 60px; }
                    .hero-right { display: none; }
                    .divider, .section, .access-section { padding-left: 28px; padding-right: 28px; }
                    .features-grid { grid-template-columns: 1fr 1fr; }
                    .who-grid { grid-template-columns: 1fr; }
                    .access-inner { flex-direction: column; padding: 40px 28px; }
                    .access-right { align-items: flex-start; }
                    footer { flex-direction: column; align-items: flex-start; }
                }
                @media (max-width: 640px) {
                    .features-grid { grid-template-columns: 1fr; }
                    .nav-center { display: none; }
                }
            `}</style>

            <div>
                <div className="bg-deco" />

                {/* NAV */}
                <nav>
                    <a href="/" className="logo-wrap">
                        <span className="logo-text">SourceU</span>
                        <span className="logo-badge">CRM</span>
                    </a>
                    <ul className="nav-center">
                        <li><a href="#features">Features</a></li>
                        <li><a href="#who">Who Uses It</a></li>
                        <li><a href="#access">Get Access</a></li>
                    </ul>
                    <div className="nav-right">
                        <a href="/login" className="btn-ghost">Sign In</a>
                        <a href="/register" className="btn-fill">Request Access</a>
                    </div>
                </nav>

                {/* HERO */}
                <section className="hero">
                    <div className="hero-left">
                        <div className="hero-chip">
                            <span className="chip-dot" />
                            Internal Tool · SourceU
                        </div>
                        <h1>
                            The CRM built<br />
                            for <em>SourceU</em><br />
                            teams
                        </h1>
                        <p>
                            Manage client relationships, track your pipeline, and keep every deal moving — all in one place, built specifically for how SourceU works.
                        </p>
                        <div className="hero-actions">
                            <a href="/login" className="btn-hero">Open CRM</a>
                            <a href="#features" className="btn-link">Learn more <span>→</span></a>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="mockup-card">
                            <div className="mockup-topbar">
                                <div className="dot dot-r" /><div className="dot dot-y" /><div className="dot dot-g" />
                                <span className="mockup-title">SourceU CRM · Pipeline</span>
                            </div>
                            <div className="mockup-body">
                                <div className="mock-row">
                                    <div className="mock-stat">
                                        <div className="mock-stat-num">48</div>
                                        <div className="mock-stat-label">Active Deals</div>
                                    </div>
                                    <div className="mock-stat mock-gold">
                                        <div className="mock-stat-num">₱2.4M</div>
                                        <div className="mock-stat-label">Pipeline Value</div>
                                    </div>
                                    <div className="mock-stat">
                                        <div className="mock-stat-num">12</div>
                                        <div className="mock-stat-label">Closing Soon</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="mock-pipeline-label">Deal Stages</div>
                                    <div className="pipeline-stages">
                                        <div className="stage">
                                            <div className="stage-name">Lead</div>
                                            <div className="stage-cards">
                                                <div className="stage-card">Acme Corp<span>₱120k</span></div>
                                                <div className="stage-card">BlueWave<span>₱80k</span></div>
                                            </div>
                                        </div>
                                        <div className="stage">
                                            <div className="stage-name">Proposal</div>
                                            <div className="stage-cards">
                                                <div className="stage-card">TechNova<span>₱340k</span></div>
                                            </div>
                                        </div>
                                        <div className="stage">
                                            <div className="stage-name">Closing</div>
                                            <div className="stage-cards">
                                                <div className="stage-card">Vertex Inc<span>₱560k</span></div>
                                                <div className="stage-card">Orion Co<span>₱210k</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* USED BY */}
                <div className="divider">
                    <div className="divider-inner">
                        <span className="divider-text">Used across teams ·</span>
                        <div className="dept-pills">
                            {['🧑‍💼 Sales', '📣 Marketing', '🤝 Partnerships', '👤 Account Mgmt', '📊 Operations'].map((d, i) => (
                                <span className="dept-pill" key={i}>{d}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FEATURES */}
                <section className="section" id="features">
                    <div className="section-eyebrow">Features</div>
                    <div className="section-title">Everything your team needs to <span>close deals</span></div>
                    <div className="features-grid">
                        {[
                            { icon: '🎯', title: 'Deal Pipeline', desc: 'Visualize every opportunity across stages. Drag, drop, and stay on top of every deal in real-time.' },
                            { icon: '👥', title: 'Contact Management', desc: 'One place for all client info — history, notes, activities, and key contacts all linked together.' },
                            { icon: '⚡', title: 'Task Automation', desc: 'Set follow-up reminders and activity triggers so nothing falls through the cracks.' },
                            { icon: '📊', title: 'Team Reports', desc: 'Track team performance, deal velocity, and revenue forecasts with clear visual dashboards.' },
                            { icon: '📝', title: 'Activity Logs', desc: 'Every call, email, and meeting logged automatically. Full history on every contact and deal.' },
                            { icon: '🔔', title: 'Smart Reminders', desc: 'Never miss a follow-up. Get notified when deals go cold or tasks are overdue.' },
                        ].map((f, i) => (
                            <div className="feat-card" key={i}>
                                <div className="feat-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* WHO USES */}
                <section className="section" id="who" style={{ paddingTop: '0' }}>
                    <div className="section-eyebrow">Who Uses It</div>
                    <div className="section-title">Built for every <span>SourceU</span> team</div>
                    <div className="who-grid">
                        {[
                            { icon: '🧑‍💼', title: 'Sales Team', desc: 'Own your pipeline. Track leads from first contact to signed contract without switching between tools.' },
                            { icon: '🤝', title: 'Partnerships', desc: 'Manage partner relationships, track joint opportunities, and keep communication centralized.' },
                            { icon: '👤', title: 'Account Management', desc: 'Stay on top of existing clients. Log interactions, flag renewals, and spot upsell opportunities early.' },
                            { icon: '📊', title: 'Leadership & Ops', desc: 'Real-time view of team performance, revenue pipeline, and deal health across the organization.' },
                        ].map((w, i) => (
                            <div className="who-card" key={i}>
                                <div className="who-icon">{w.icon}</div>
                                <div>
                                    <h4>{w.title}</h4>
                                    <p>{w.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* HOW TO GET STARTED */}
                <section className="section" style={{ paddingTop: '0' }}>
                    <div className="section-eyebrow">Getting Started</div>
                    <div className="section-title">Up and running in <span>minutes</span></div>
                    <div className="steps-list">
                        {[
                            { title: 'Request access', desc: 'Fill in a quick form with your SourceU email. Your manager will approve access.' },
                            { title: 'Set up your profile', desc: 'Add your role, team, and notification preferences to personalize your workspace.' },
                            { title: 'Import your contacts', desc: 'Bring in your existing leads and clients via CSV or connect your email directly.' },
                            { title: 'Build your pipeline', desc: 'Create deals, assign stages, and start tracking every opportunity from day one.' },
                        ].map((s, i) => (
                            <div className="step-row" key={i}>
                                <div className="step-circle">0{i + 1}</div>
                                <div className="step-content">
                                    <h4>{s.title}</h4>
                                    <p>{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ACCESS BANNER */}
                <div className="access-section" id="access">
                    <div className="access-inner">
                        <div className="access-left">
                            <h2>Ready to use SourceU CRM?</h2>
                            <p>Sign in with your SourceU account or request access from your team lead. It takes less than 2 minutes to get started.</p>
                        </div>
                        <div className="access-right">
                            <a href="/login" className="btn-access">Sign In to CRM</a>
                            <span className="access-note">For SourceU employees only · Use your company email</span>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <footer>
                    <div className="footer-left">
                        <a href="/" className="logo-wrap">
                            <span className="logo-text" style={{ fontSize: '1.1rem' }}>SourceU</span>
                            <span className="logo-badge">CRM</span>
                        </a>
                        <span className="footer-copy">An internal tool by SourceU · {new Date().getFullYear()}</span>
                    </div>
                    <ul className="footer-links">
                        <li><a href="#">Help & Support</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Report an Issue</a></li>
                    </ul>
                    <span className="footer-tag">Internal Use Only</span>
                </footer>
            </div>
        </>
    );
}