import{u,r as l,j as e,L as b}from"./app-ejoxvWnX.js";/* empty css            */function v({to:s,suffix:p=""}){const[o,t]=l.useState(0),i=l.useRef(null);return l.useEffect(()=>{const d=i.current;if(!d)return;const n=new IntersectionObserver(([x])=>{if(!x.isIntersecting)return;n.disconnect();const m=1400,a=performance.now(),r=c=>{const h=c-a,g=Math.min(h/m,1),f=1-Math.pow(1-g,3);t(Math.round(f*s)),g<1&&requestAnimationFrame(r)};requestAnimationFrame(r)},{threshold:.5});return n.observe(d),()=>n.disconnect()},[s]),e.jsxs("span",{ref:i,children:[o,p]})}function j(){const{appearance:s,updateAppearance:p}=u(),[o,t]=l.useState(!1),i=s==="dark"||s==="system"&&typeof window<"u"&&window.matchMedia("(prefers-color-scheme: dark)").matches,d=()=>p(i?"light":"dark");l.useEffect(()=>{const a=new IntersectionObserver(r=>{r.forEach(c=>{c.isIntersecting&&c.target.classList.add("in-view")})},{threshold:.08,rootMargin:"0px 0px -40px 0px"});return document.querySelectorAll("[data-animate]").forEach(r=>a.observe(r)),()=>a.disconnect()},[]);const n=[{icon:"🗂️",title:"Kanban Pipeline",desc:"Drag-and-drop deal board across Lead, Proposal, Negotiation, and Closing stages — visual deal management at a glance."},{icon:"🏢",title:"Account Management",desc:"Full company profiles with linked contacts, deal history, activity logs, and notes — everything before the call."},{icon:"👥",title:"Contact Management",desc:"Manage leads and clients with detailed profiles, linked accounts, call history, tags, and dispositions."},{icon:"📞",title:"Dialpad Integration",desc:"Dial any contact with one click from the CRM. Call logs sync automatically to the contact timeline."},{icon:"🎯",title:"Lead Pool",desc:"Claim open leads from the shared pool, set dispositions, and release unworked leads — built for the team workflow."},{icon:"🚫",title:"DNC Management",desc:"Maintain a Do-Not-Call list that protects the team from compliance issues and prevents duplicate outreach."},{icon:"🔔",title:"Smart Notifications",desc:"Stay on top of deal updates, stage changes, and team activity with real-time in-app alerts."},{icon:"🔗",title:"Webhook Integrations",desc:"Connect with Zapier and Dialpad via webhooks. Automate lead capture and sync call data without manual entry."},{icon:"📊",title:"Dashboard Analytics",desc:"Track your pipeline value, deal counts, and team performance from a single overview dashboard."}],x=[{icon:"🧑‍💼",title:"Sales Team",desc:"Own your pipeline. Track leads from first contact to signed contract without switching between tools."},{icon:"🤝",title:"Partnerships",desc:"Manage partner relationships, track joint opportunities, and keep communication centralized."},{icon:"👤",title:"Account Management",desc:"Stay on top of existing clients. Log interactions, flag renewals, and spot upsell opportunities early."},{icon:"📊",title:"Leadership & Ops",desc:"Real-time view of team performance, revenue pipeline, and deal health across the organization."}],m=[{title:"Request access",desc:"Fill in a quick form with your SourceU email. Your manager will approve access within 24 hours."},{title:"Set up your profile",desc:"Add your role, team, and notification preferences to personalize your workspace."},{title:"Import your contacts",desc:"Bring in existing leads and clients or let webhook integrations feed them in automatically."},{title:"Build your pipeline",desc:"Create deals, assign stages, and start tracking every opportunity from day one."}];return e.jsxs(e.Fragment,{children:[e.jsx(b,{title:"SourceU CRM — Internal Tool"}),e.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

                :root {
                    --purple:       #5B2D8E;
                    --purple-light: #7B4DB5;
                    --purple-pale:  #F3EEFF;
                    --gold:         #F5C842;
                    --gold-dim:     #C9A030;
                    --gold-pale:    #FEF9E7;
                    --text:         #1A0F2E;
                    --text-mid:     #5A4B73;
                    --text-muted:   #9B8DB5;
                    --border:       #E4D9F5;
                    --bg:           #FAFBFF;
                    --surface:      #FFFFFF;
                    --card-shadow:  0 2px 16px rgba(91,45,142,0.08);
                    --card-shadow-hover: 0 10px 36px rgba(91,45,142,0.15);
                    --nav-bg:       rgba(250,251,255,0.88);
                    --mobile-bg:    #FFFFFF;
                }

                html.dark {
                    --purple:       #9B6FD9;
                    --purple-light: #B589F0;
                    --purple-pale:  rgba(155,111,217,0.13);
                    --gold:         #F5C842;
                    --gold-dim:     #D4A017;
                    --gold-pale:    rgba(245,200,66,0.1);
                    --text:         #EDE5FF;
                    --text-mid:     #A899C0;
                    --text-muted:   #6B5E88;
                    --border:       #2B1E45;
                    --bg:           #0C0818;
                    --surface:      #16102A;
                    --card-shadow:  0 2px 16px rgba(0,0,0,0.38);
                    --card-shadow-hover: 0 10px 36px rgba(0,0,0,0.55);
                    --nav-bg:       rgba(12,8,24,0.9);
                    --mobile-bg:    #16102A;
                }

                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }

                body {
                    background: var(--bg);
                    color: var(--text);
                    font-family: 'DM Sans', sans-serif;
                    overflow-x: hidden;
                    -webkit-font-smoothing: antialiased;
                    transition: background 0.35s ease, color 0.35s ease;
                }

                /* ── ANIMATIONS ── */
                @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
                @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
                @keyframes pulseRing { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(1.7);opacity:0} }
                @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes spinSlow  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

                [data-animate] {
                    opacity: 0;
                    transform: translateY(22px);
                    transition: opacity 0.68s cubic-bezier(0.16,1,0.3,1), transform 0.68s cubic-bezier(0.16,1,0.3,1);
                }
                [data-animate].in-view  { opacity:1; transform:translateY(0); }
                [data-animate][data-d="1"] { transition-delay:.07s }
                [data-animate][data-d="2"] { transition-delay:.14s }
                [data-animate][data-d="3"] { transition-delay:.21s }
                [data-animate][data-d="4"] { transition-delay:.28s }
                [data-animate][data-d="5"] { transition-delay:.35s }
                [data-animate][data-d="6"] { transition-delay:.42s }

                /* ── BG DECO ── */
                .bg-deco { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
                .bg-deco::before {
                    content:''; position:absolute; top:-160px; right:-120px;
                    width:700px; height:700px;
                    background:radial-gradient(ellipse,rgba(91,45,142,0.08) 0%,transparent 68%);
                    animation: float 9s ease-in-out infinite;
                }
                .bg-deco::after {
                    content:''; position:absolute; bottom:-80px; left:-80px;
                    width:540px; height:540px;
                    background:radial-gradient(ellipse,rgba(245,200,66,0.06) 0%,transparent 68%);
                    animation: float 11s ease-in-out infinite reverse;
                }
                html.dark .bg-deco::before { background:radial-gradient(ellipse,rgba(155,111,217,0.12) 0%,transparent 68%); }
                html.dark .bg-deco::after  { background:radial-gradient(ellipse,rgba(245,200,66,0.05) 0%,transparent 68%); }

                /* ── NAV ── */
                nav {
                    position:fixed; top:0; left:0; right:0; z-index:100;
                    background:var(--nav-bg); backdrop-filter:blur(20px);
                    border-bottom:1px solid var(--border);
                    display:flex; align-items:center; justify-content:space-between;
                    padding:0 64px; height:64px;
                    transition:background 0.35s ease, border-color 0.35s ease;
                }
                .logo-wrap { display:flex; align-items:center; gap:10px; text-decoration:none; flex-shrink:0; }
                .logo-text {
                    font-family:'Sora',sans-serif; font-size:1.35rem; font-weight:800;
                    color:var(--purple); letter-spacing:-0.02em; position:relative;
                    transition:color 0.35s ease;
                }
                .logo-text::after { content:''; position:absolute; bottom:-2px; left:0; width:55%; height:3px; background:var(--gold); border-radius:2px; }
                .logo-badge {
                    background:var(--purple-pale); color:var(--purple);
                    font-size:0.68rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase;
                    padding:3px 9px; border-radius:100px; border:1px solid var(--border);
                    transition:background 0.35s ease, color 0.35s ease, border-color 0.35s ease;
                }
                .nav-center { display:flex; gap:4px; list-style:none; }
                .nav-center a {
                    color:var(--text-mid); text-decoration:none;
                    font-size:0.875rem; font-weight:500;
                    padding:6px 14px; border-radius:8px;
                    transition:background 0.18s, color 0.18s;
                }
                .nav-center a:hover { background:var(--purple-pale); color:var(--purple); }
                .nav-right { display:flex; align-items:center; gap:8px; }

                .theme-btn {
                    width:36px; height:36px; border-radius:8px;
                    border:1.5px solid var(--border); background:transparent;
                    cursor:pointer; display:flex; align-items:center; justify-content:center;
                    color:var(--text-mid); font-size:1rem; flex-shrink:0;
                    transition:background 0.18s, border-color 0.18s, color 0.18s, transform 0.3s;
                }
                .theme-btn:hover { background:var(--purple-pale); border-color:var(--purple); color:var(--purple); transform:rotate(20deg); }

                .btn-ghost {
                    color:var(--purple); text-decoration:none; font-size:0.875rem; font-weight:600;
                    padding:8px 18px; border-radius:8px; border:1.5px solid var(--border);
                    transition:border-color 0.18s, background 0.18s, color 0.18s;
                }
                .btn-ghost:hover { border-color:var(--purple-light); background:var(--purple-pale); }
                .btn-fill {
                    background:var(--purple); color:#fff; text-decoration:none;
                    font-size:0.875rem; font-weight:600; padding:8px 20px; border-radius:8px;
                    transition:background 0.18s, transform 0.15s, box-shadow 0.18s;
                    box-shadow:0 2px 10px rgba(91,45,142,0.22);
                }
                .btn-fill:hover { background:var(--purple-light); transform:translateY(-1px); box-shadow:0 4px 16px rgba(91,45,142,0.3); }

                .hamburger {
                    display:none; width:36px; height:36px; border-radius:8px;
                    border:1.5px solid var(--border); background:transparent; cursor:pointer;
                    flex-direction:column; align-items:center; justify-content:center;
                    gap:5px; padding:8px;
                    transition:background 0.18s, border-color 0.18s;
                }
                .hamburger:hover { background:var(--purple-pale); border-color:var(--purple); }
                .hamburger span { display:block; width:18px; height:2px; background:var(--text-mid); border-radius:2px; transition:all 0.25s ease; }
                .hamburger.open span:nth-child(1) { transform:translateY(7px) rotate(45deg); }
                .hamburger.open span:nth-child(2) { opacity:0; transform:scaleX(0); }
                .hamburger.open span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }

                /* ── MOBILE MENU ── */
                .mobile-menu {
                    display:none; position:fixed; top:64px; left:0; right:0; z-index:99;
                    background:var(--mobile-bg); border-bottom:1px solid var(--border);
                    padding:12px 16px 16px; flex-direction:column; gap:4px;
                    box-shadow:0 8px 32px rgba(0,0,0,0.12);
                    animation:slideDown 0.2s ease;
                    transition:background 0.35s ease;
                }
                .mobile-menu.open { display:flex; }
                .mobile-menu a {
                    color:var(--text-mid); text-decoration:none;
                    font-size:0.9rem; font-weight:500;
                    padding:10px 16px; border-radius:8px;
                    transition:background 0.18s, color 0.18s;
                }
                .mobile-menu a:hover { background:var(--purple-pale); color:var(--purple); }
                .mob-divider { height:1px; background:var(--border); margin:8px 0; }
                .mob-actions { display:flex; gap:8px; }
                .mob-actions a { flex:1; text-align:center; }
                .mob-actions .btn-fill { color:#fff; }
                .mob-actions .btn-ghost { color:var(--purple); }

                @media (min-width:1025px) { .mobile-menu { display:none !important; } }

                /* ── HERO ── */
                .hero {
                    position:relative; z-index:1;
                    max-width:1100px; margin:0 auto;
                    padding:148px 64px 80px;
                    display:grid; grid-template-columns:1fr 1fr;
                    gap:64px; align-items:center;
                }
                .hero-left { animation:fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
                .hero-right { animation:fadeUp 0.7s 0.18s cubic-bezier(0.16,1,0.3,1) both; }

                .hero-chip {
                    display:inline-flex; align-items:center; gap:8px;
                    background:var(--gold-pale); border:1px solid rgba(245,200,66,0.45);
                    color:#8A6A00; font-size:0.75rem; font-weight:600;
                    letter-spacing:0.06em; text-transform:uppercase;
                    padding:5px 12px; border-radius:100px; margin-bottom:24px;
                }
                html.dark .hero-chip { color:var(--gold-dim); }
                .chip-dot { width:6px; height:6px; border-radius:50%; background:var(--gold); position:relative; }
                .chip-dot::after {
                    content:''; position:absolute; inset:-3px; border-radius:50%;
                    background:var(--gold); animation:pulseRing 1.6s ease-out infinite; opacity:0.5;
                }
                .hero h1 {
                    font-family:'Sora',sans-serif; font-size:clamp(2.2rem,4vw,3.4rem);
                    font-weight:800; line-height:1.08; letter-spacing:-0.03em;
                    color:var(--text); margin-bottom:20px;
                }
                .hero h1 em { font-style:normal; color:var(--purple); position:relative; }
                .hero h1 em::after {
                    content:''; position:absolute; bottom:2px; left:0; right:0;
                    height:3px; background:var(--gold); border-radius:2px; opacity:0.65;
                }
                .hero p { font-size:1rem; line-height:1.75; color:var(--text-mid); margin-bottom:36px; max-width:440px; }
                .hero-actions { display:flex; gap:12px; align-items:center; }
                .btn-hero {
                    background:var(--purple); color:#fff; padding:13px 28px; border-radius:10px;
                    font-family:'Sora',sans-serif; font-weight:700; font-size:0.9rem; text-decoration:none;
                    box-shadow:0 4px 18px rgba(91,45,142,0.28);
                    transition:background 0.2s, transform 0.2s, box-shadow 0.2s;
                }
                .btn-hero:hover { background:var(--purple-light); transform:translateY(-2px); box-shadow:0 8px 28px rgba(91,45,142,0.35); }
                .btn-link {
                    color:var(--text-mid); text-decoration:none; font-size:0.875rem; font-weight:500;
                    display:flex; align-items:center; gap:6px;
                    transition:color 0.18s, gap 0.18s;
                }
                .btn-link:hover { color:var(--purple); gap:10px; }

                /* ── MOCKUP ── */
                .mockup-card {
                    background:var(--surface); border:1px solid var(--border);
                    border-radius:20px; box-shadow:0 8px 40px rgba(91,45,142,0.1);
                    overflow:hidden; transition:background 0.35s ease, border-color 0.35s ease;
                }
                html.dark .mockup-card { box-shadow:0 8px 40px rgba(0,0,0,0.42); }
                .mockup-topbar { background:var(--purple); padding:14px 20px; display:flex; align-items:center; gap:8px; }
                .dot { width:10px; height:10px; border-radius:50%; }
                .dot-r{background:#FF5F57}.dot-y{background:#FFBD2E}.dot-g{background:#28CA41}
                .mockup-title { margin-left:8px; font-family:'Sora',sans-serif; font-size:0.78rem; font-weight:600; color:rgba(255,255,255,0.72); letter-spacing:0.04em; }
                .mockup-body { padding:20px; }
                .mock-row { display:flex; gap:10px; margin-bottom:12px; }
                .mock-stat { flex:1; background:var(--purple-pale); border-radius:10px; padding:14px 16px; transition:background 0.35s ease; }
                .mock-stat-num { font-family:'Sora',sans-serif; font-size:1.3rem; font-weight:800; color:var(--purple); }
                .mock-stat-label { font-size:0.7rem; color:var(--text-muted); margin-top:2px; }
                .mock-gold { background:var(--gold-pale); }
                .mock-gold .mock-stat-num { color:var(--gold-dim); }
                .mock-pipeline-label { font-size:0.72rem; font-weight:600; color:var(--text-muted); letter-spacing:0.05em; text-transform:uppercase; margin-bottom:10px; }
                .pipeline-stages { display:flex; gap:6px; }
                .stage { flex:1; border-radius:8px; padding:10px; border:1px solid var(--border); }
                .stage-name { font-size:0.65rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; }
                .stage-cards { display:flex; flex-direction:column; gap:5px; }
                .stage-card { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:6px 8px; font-size:0.65rem; color:var(--text); font-weight:500; box-shadow:0 1px 4px rgba(91,45,142,0.06); transition:background 0.35s ease; }
                .stage-card span { display:block; font-size:0.6rem; color:var(--text-muted); font-weight:400; margin-top:1px; }

                /* ── STATS BAR ── */
                .stats-bar { position:relative; z-index:1; max-width:1100px; margin:0 auto; padding:0 64px; }
                .stats-inner {
                    border-top:1px solid var(--border); border-bottom:1px solid var(--border);
                    padding:36px 0; display:grid; grid-template-columns:repeat(4,1fr);
                    gap:32px; text-align:center;
                    transition:border-color 0.35s ease;
                }
                .stat-num { font-family:'Sora',sans-serif; font-size:2.2rem; font-weight:800; color:var(--purple); line-height:1; display:block; margin-bottom:6px; }
                .stat-label { font-size:0.8rem; color:var(--text-muted); font-weight:500; }

                /* ── DEPT PILLS ── */
                .dept-section {
                    position:relative; z-index:1; max-width:1100px; margin:0 auto;
                    padding:24px 64px; display:flex; align-items:center; gap:16px; flex-wrap:wrap;
                }
                .dept-text { font-size:0.78rem; color:var(--text-muted); white-space:nowrap; font-weight:500; }
                .dept-pills { display:flex; gap:8px; flex-wrap:wrap; }
                .dept-pill {
                    background:var(--surface); border:1px solid var(--border); border-radius:100px;
                    padding:5px 14px; font-size:0.75rem; color:var(--text-mid); font-weight:500;
                    transition:background 0.18s, border-color 0.18s, color 0.18s;
                    cursor:default;
                }
                .dept-pill:hover { background:var(--purple-pale); border-color:var(--purple); color:var(--purple); }

                /* ── SECTIONS ── */
                .section { position:relative; z-index:1; max-width:1100px; margin:0 auto; padding:72px 64px; }
                .section-eyebrow { font-size:0.72rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--purple); margin-bottom:12px; }
                .section-title { font-family:'Sora',sans-serif; font-size:clamp(1.7rem,2.8vw,2.4rem); font-weight:800; line-height:1.12; letter-spacing:-0.025em; color:var(--text); max-width:520px; margin-bottom:48px; }
                .section-title span { color:var(--purple); }

                /* ── FEATURES ── */
                .features-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
                .feat-card {
                    background:var(--surface); border:1px solid var(--border); border-radius:16px;
                    padding:28px 24px; box-shadow:var(--card-shadow);
                    transition:box-shadow 0.25s, transform 0.25s, border-color 0.25s, background 0.35s ease;
                    cursor:default;
                }
                .feat-card:hover { box-shadow:var(--card-shadow-hover); transform:translateY(-5px); border-color:rgba(91,45,142,0.25); }
                .feat-icon {
                    width:44px; height:44px; border-radius:10px;
                    background:var(--purple-pale); border:1px solid var(--border);
                    display:flex; align-items:center; justify-content:center;
                    font-size:1.2rem; margin-bottom:18px;
                    transition:transform 0.25s ease, background 0.35s ease;
                }
                .feat-card:hover .feat-icon { transform:scale(1.1) rotate(-5deg); }
                .feat-card h3 { font-family:'Sora',sans-serif; font-size:0.95rem; font-weight:700; color:var(--text); margin-bottom:8px; }
                .feat-card p { font-size:0.83rem; line-height:1.65; color:var(--text-mid); }

                /* ── INTEGRATIONS ── */
                .integrations-row { display:flex; gap:16px; flex-wrap:wrap; }
                .int-card {
                    flex:1; min-width:220px; background:var(--surface); border:1px solid var(--border);
                    border-radius:16px; padding:24px 28px; box-shadow:var(--card-shadow);
                    display:flex; align-items:center; gap:16px;
                    transition:box-shadow 0.25s, transform 0.25s, background 0.35s ease;
                }
                .int-card:hover { box-shadow:var(--card-shadow-hover); transform:translateY(-4px); }
                .int-icon {
                    width:48px; height:48px; border-radius:12px;
                    background:var(--purple-pale); border:1px solid var(--border);
                    display:flex; align-items:center; justify-content:center; font-size:1.4rem; flex-shrink:0;
                    transition:background 0.35s ease, transform 0.25s;
                }
                .int-card:hover .int-icon { transform:scale(1.08); }
                .int-info h4 { font-family:'Sora',sans-serif; font-size:0.9rem; font-weight:700; color:var(--text); margin-bottom:4px; }
                .int-info p { font-size:0.8rem; color:var(--text-muted); line-height:1.55; }
                .int-badge {
                    margin-left:auto; background:#EDFCF2; color:#15803d;
                    font-size:0.65rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;
                    padding:3px 8px; border-radius:100px; flex-shrink:0;
                    white-space:nowrap;
                }
                html.dark .int-badge { background:rgba(21,128,61,0.2); color:#4ade80; }

                /* ── WHO ── */
                .who-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
                .who-card {
                    background:var(--surface); border:1px solid var(--border); border-radius:16px;
                    padding:28px; box-shadow:var(--card-shadow);
                    display:flex; gap:20px; align-items:flex-start;
                    transition:box-shadow 0.25s, transform 0.25s, background 0.35s ease;
                }
                .who-card:hover { box-shadow:var(--card-shadow-hover); transform:translateY(-3px); }
                .who-icon { width:46px; height:46px; border-radius:12px; background:var(--purple-pale); display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0; transition:background 0.35s ease; }
                .who-card h4 { font-family:'Sora',sans-serif; font-size:0.95rem; font-weight:700; color:var(--text); margin-bottom:6px; }
                .who-card p { font-size:0.82rem; line-height:1.65; color:var(--text-mid); }

                /* ── STEPS ── */
                .steps-list { display:flex; flex-direction:column; gap:0; margin-top:48px; max-width:640px; }
                .step-row { display:flex; gap:24px; align-items:flex-start; padding-bottom:36px; position:relative; }
                .step-row:not(:last-child)::before { content:''; position:absolute; left:19px; top:42px; bottom:0; width:2px; background:var(--border); }
                .step-circle {
                    width:40px; height:40px; border-radius:50%; background:var(--purple); color:#fff;
                    display:flex; align-items:center; justify-content:center;
                    font-family:'Sora',sans-serif; font-size:0.8rem; font-weight:800;
                    flex-shrink:0; position:relative; z-index:1;
                    box-shadow:0 2px 12px rgba(91,45,142,0.28);
                    transition:transform 0.2s, box-shadow 0.2s;
                }
                .step-row:hover .step-circle { transform:scale(1.1); box-shadow:0 4px 20px rgba(91,45,142,0.38); }
                .step-content h4 { font-family:'Sora',sans-serif; font-size:0.95rem; font-weight:700; color:var(--text); margin-bottom:6px; margin-top:8px; }
                .step-content p { font-size:0.83rem; line-height:1.65; color:var(--text-mid); }

                /* ── ACCESS BANNER ── */
                .access-section { position:relative; z-index:1; max-width:1100px; margin:20px auto 80px; padding:0 64px; }
                .access-inner {
                    background:linear-gradient(135deg,var(--purple) 0%,#7B4DB5 100%);
                    border-radius:20px; padding:56px 64px;
                    display:flex; align-items:center; justify-content:space-between;
                    gap:48px; position:relative; overflow:hidden;
                }
                .access-inner::before {
                    content:''; position:absolute; top:-50%; right:-5%;
                    width:380px; height:380px;
                    background:radial-gradient(ellipse,rgba(255,255,255,0.1) 0%,transparent 65%);
                    pointer-events:none; animation:float 7s ease-in-out infinite;
                }
                .access-inner::after {
                    content:''; position:absolute; bottom:-40%; left:8%;
                    width:260px; height:260px;
                    background:radial-gradient(ellipse,rgba(255,255,255,0.06) 0%,transparent 65%);
                    pointer-events:none; animation:float 9s ease-in-out infinite reverse;
                }
                .access-left h2 { font-family:'Sora',sans-serif; font-size:clamp(1.5rem,2.5vw,2rem); font-weight:800; color:#fff; line-height:1.15; letter-spacing:-0.02em; margin-bottom:10px; }
                .access-left p { font-size:0.9rem; color:rgba(255,255,255,0.72); line-height:1.6; max-width:380px; }
                .access-right { display:flex; flex-direction:column; gap:12px; align-items:flex-end; flex-shrink:0; position:relative; z-index:1; }
                .btn-access {
                    background:var(--gold); color:#1a0a3c; padding:13px 30px; border-radius:10px;
                    font-family:'Sora',sans-serif; font-weight:700; font-size:0.9rem; text-decoration:none;
                    box-shadow:0 4px 16px rgba(245,200,66,0.32); white-space:nowrap;
                    transition:background 0.2s, transform 0.2s, box-shadow 0.2s;
                }
                .btn-access:hover { background:#e0b530; transform:translateY(-2px); box-shadow:0 8px 24px rgba(245,200,66,0.46); }
                .access-note { font-size:0.75rem; color:rgba(255,255,255,0.5); text-align:right; }

                /* ── FOOTER ── */
                footer {
                    position:relative; z-index:1; border-top:1px solid var(--border);
                    padding:28px 64px; max-width:1100px; margin:0 auto;
                    display:flex; align-items:center; justify-content:space-between; gap:24px;
                    transition:border-color 0.35s ease;
                }
                .footer-left { display:flex; align-items:center; gap:20px; }
                .footer-copy { font-size:0.78rem; color:var(--text-muted); }
                .footer-links { display:flex; gap:20px; list-style:none; }
                .footer-links a { font-size:0.78rem; color:var(--text-muted); text-decoration:none; transition:color 0.18s; }
                .footer-links a:hover { color:var(--purple); }
                .footer-tag { background:var(--purple-pale); color:var(--purple); font-size:0.68rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:3px 9px; border-radius:100px; border:1px solid var(--border); }

                /* ── RESPONSIVE ── */
                @media (max-width:1024px) {
                    nav { padding:0 24px; }
                    .nav-center { display:none; }
                    .hamburger { display:flex; }
                    .hero { grid-template-columns:1fr; gap:40px; padding:120px 24px 60px; }
                    .hero-right .mockup-card { max-width:440px; margin:0 auto; }
                    .stats-bar { padding:0 24px; }
                    .stats-inner { grid-template-columns:repeat(2,1fr); gap:24px; }
                    .dept-section { padding:20px 24px; }
                    .section { padding:56px 24px; }
                    .features-grid { grid-template-columns:1fr 1fr; }
                    .who-grid { grid-template-columns:1fr; }
                    .access-section { padding:0 24px; }
                    .access-inner { flex-direction:column; padding:40px 28px; }
                    .access-right { align-items:flex-start; }
                    footer { flex-direction:column; align-items:flex-start; padding:24px; }
                    .footer-left { flex-direction:column; align-items:flex-start; gap:10px; }
                    .footer-links { flex-wrap:wrap; gap:12px; }
                }
                @media (max-width:640px) {
                    nav { padding:0 16px; }
                    .btn-ghost { display:none; }
                    .hero { padding:96px 16px 44px; }
                    .hero h1 { font-size:2rem; }
                    .stats-inner { grid-template-columns:repeat(2,1fr); gap:16px; }
                    .stat-num { font-size:1.8rem; }
                    .features-grid { grid-template-columns:1fr; }
                    .section { padding:44px 16px; }
                    .dept-section { padding:16px; }
                    .stats-bar { padding:0 16px; }
                    .access-section { padding:0 16px; margin-bottom:48px; }
                    .access-inner { padding:32px 20px; }
                    footer { padding:20px 16px; }
                    .int-card { min-width:100%; }
                }
            `}),e.jsxs("div",{children:[e.jsx("div",{className:"bg-deco"}),e.jsxs("div",{className:`mobile-menu ${o?"open":""}`,children:[e.jsx("a",{href:"#features",onClick:()=>t(!1),children:"Features"}),e.jsx("a",{href:"#integrations",onClick:()=>t(!1),children:"Integrations"}),e.jsx("a",{href:"#who",onClick:()=>t(!1),children:"Who Uses It"}),e.jsx("a",{href:"#access",onClick:()=>t(!1),children:"Get Access"}),e.jsx("div",{className:"mob-divider"}),e.jsxs("div",{className:"mob-actions",children:[e.jsx("a",{href:"/login",className:"btn-ghost",onClick:()=>t(!1),children:"Sign In"}),e.jsx("a",{href:"/register",className:"btn-fill",onClick:()=>t(!1),children:"Request Access"})]})]}),e.jsxs("nav",{children:[e.jsxs("a",{href:"/",className:"logo-wrap",children:[e.jsx("span",{className:"logo-text",children:"SourceU"}),e.jsx("span",{className:"logo-badge",children:"CRM"})]}),e.jsxs("ul",{className:"nav-center",children:[e.jsx("li",{children:e.jsx("a",{href:"#features",children:"Features"})}),e.jsx("li",{children:e.jsx("a",{href:"#integrations",children:"Integrations"})}),e.jsx("li",{children:e.jsx("a",{href:"#who",children:"Who Uses It"})}),e.jsx("li",{children:e.jsx("a",{href:"#access",children:"Get Access"})})]}),e.jsxs("div",{className:"nav-right",children:[e.jsx("button",{className:"theme-btn",onClick:d,"aria-label":"Toggle theme",children:i?e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"5"}),e.jsx("path",{d:"M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"})]}):e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"})})}),e.jsx("a",{href:"/login",className:"btn-ghost",children:"Sign In"}),e.jsx("a",{href:"/register",className:"btn-fill",children:"Request Access"}),e.jsxs("button",{className:`hamburger ${o?"open":""}`,onClick:()=>t(!o),"aria-label":"Toggle menu",children:[e.jsx("span",{}),e.jsx("span",{}),e.jsx("span",{})]})]})]}),e.jsxs("section",{className:"hero",children:[e.jsxs("div",{className:"hero-left",children:[e.jsxs("div",{className:"hero-chip",children:[e.jsx("span",{className:"chip-dot"}),"Internal Tool · SourceU"]}),e.jsxs("h1",{children:["The CRM built",e.jsx("br",{}),"for ",e.jsx("em",{children:"SourceU"}),e.jsx("br",{}),"teams"]}),e.jsx("p",{children:"Manage client relationships, track your pipeline, and close more deals — all in one place, built specifically for how SourceU works."}),e.jsxs("div",{className:"hero-actions",children:[e.jsx("a",{href:"/login",className:"btn-hero",children:"Open CRM"}),e.jsxs("a",{href:"#features",className:"btn-link",children:["Explore features ",e.jsx("span",{children:"→"})]})]})]}),e.jsx("div",{className:"hero-right",children:e.jsxs("div",{className:"mockup-card",children:[e.jsxs("div",{className:"mockup-topbar",children:[e.jsx("div",{className:"dot dot-r"}),e.jsx("div",{className:"dot dot-y"}),e.jsx("div",{className:"dot dot-g"}),e.jsx("span",{className:"mockup-title",children:"SourceU CRM · Kanban Pipeline"})]}),e.jsxs("div",{className:"mockup-body",children:[e.jsxs("div",{className:"mock-row",children:[e.jsxs("div",{className:"mock-stat",children:[e.jsx("div",{className:"mock-stat-num",children:"48"}),e.jsx("div",{className:"mock-stat-label",children:"Active Deals"})]}),e.jsxs("div",{className:"mock-stat mock-gold",children:[e.jsx("div",{className:"mock-stat-num",children:"₱2.4M"}),e.jsx("div",{className:"mock-stat-label",children:"Pipeline Value"})]}),e.jsxs("div",{className:"mock-stat",children:[e.jsx("div",{className:"mock-stat-num",children:"12"}),e.jsx("div",{className:"mock-stat-label",children:"Closing Soon"})]})]}),e.jsx("div",{className:"mock-pipeline-label",children:"Kanban Board"}),e.jsxs("div",{className:"pipeline-stages",children:[e.jsxs("div",{className:"stage",children:[e.jsx("div",{className:"stage-name",children:"Lead"}),e.jsxs("div",{className:"stage-cards",children:[e.jsxs("div",{className:"stage-card",children:["Acme Corp",e.jsx("span",{children:"₱120k"})]}),e.jsxs("div",{className:"stage-card",children:["BlueWave",e.jsx("span",{children:"₱80k"})]})]})]}),e.jsxs("div",{className:"stage",children:[e.jsx("div",{className:"stage-name",children:"Proposal"}),e.jsx("div",{className:"stage-cards",children:e.jsxs("div",{className:"stage-card",children:["TechNova",e.jsx("span",{children:"₱340k"})]})})]}),e.jsxs("div",{className:"stage",children:[e.jsx("div",{className:"stage-name",children:"Closing"}),e.jsxs("div",{className:"stage-cards",children:[e.jsxs("div",{className:"stage-card",children:["Vertex Inc",e.jsx("span",{children:"₱560k"})]}),e.jsxs("div",{className:"stage-card",children:["Orion Co",e.jsx("span",{children:"₱210k"})]})]})]})]})]})]})})]}),e.jsx("div",{className:"stats-bar",children:e.jsx("div",{className:"stats-inner",children:[{to:9,suffix:"+",label:"Core Features"},{to:3,suffix:"",label:"Live Integrations"},{to:5,suffix:"",label:"Teams Using It"},{to:100,suffix:"%",label:"Built for SourceU"}].map((a,r)=>e.jsxs("div",{"data-animate":!0,"data-d":String(r+1),children:[e.jsx("span",{className:"stat-num",children:e.jsx(v,{to:a.to,suffix:a.suffix})}),e.jsx("span",{className:"stat-label",children:a.label})]},r))})}),e.jsxs("div",{className:"dept-section","data-animate":!0,children:[e.jsx("span",{className:"dept-text",children:"Used across ·"}),e.jsx("div",{className:"dept-pills",children:["🧑‍💼 Sales","📣 Marketing","🤝 Partnerships","👤 Account Mgmt","📊 Operations","👩‍💼 Leadership"].map((a,r)=>e.jsx("span",{className:"dept-pill",children:a},r))})]}),e.jsxs("section",{className:"section",id:"features",children:[e.jsxs("div",{"data-animate":!0,children:[e.jsx("div",{className:"section-eyebrow",children:"Features"}),e.jsxs("div",{className:"section-title",children:["Everything your team needs to ",e.jsx("span",{children:"close deals"})]})]}),e.jsx("div",{className:"features-grid",children:n.map((a,r)=>e.jsxs("div",{className:"feat-card","data-animate":!0,"data-d":String(r%3+1),children:[e.jsx("div",{className:"feat-icon",children:a.icon}),e.jsx("h3",{children:a.title}),e.jsx("p",{children:a.desc})]},r))})]}),e.jsxs("section",{className:"section",id:"integrations",style:{paddingTop:"0"},children:[e.jsxs("div",{"data-animate":!0,children:[e.jsx("div",{className:"section-eyebrow",children:"Integrations"}),e.jsxs("div",{className:"section-title",children:["Connected to the ",e.jsx("span",{children:"tools you use"})]})]}),e.jsx("div",{className:"integrations-row",children:[{icon:"📞",name:"Dialpad",desc:"Click-to-call from any contact. Call logs auto-sync to the CRM timeline."},{icon:"⚡",name:"Zapier",desc:"Automate lead capture and cross-tool workflows with zero code."},{icon:"🔗",name:"Webhooks",desc:"Custom endpoints for inbound leads, deal updates, and automations."}].map((a,r)=>e.jsxs("div",{className:"int-card","data-animate":!0,"data-d":String(r+1),children:[e.jsx("div",{className:"int-icon",children:a.icon}),e.jsxs("div",{className:"int-info",children:[e.jsx("h4",{children:a.name}),e.jsx("p",{children:a.desc})]}),e.jsx("span",{className:"int-badge",children:"Live"})]},r))})]}),e.jsxs("section",{className:"section",id:"who",style:{paddingTop:"0"},children:[e.jsxs("div",{"data-animate":!0,children:[e.jsx("div",{className:"section-eyebrow",children:"Who Uses It"}),e.jsxs("div",{className:"section-title",children:["Built for every ",e.jsx("span",{children:"SourceU"})," team"]})]}),e.jsx("div",{className:"who-grid",children:x.map((a,r)=>e.jsxs("div",{className:"who-card","data-animate":!0,"data-d":String(r%2+1),children:[e.jsx("div",{className:"who-icon",children:a.icon}),e.jsxs("div",{children:[e.jsx("h4",{children:a.title}),e.jsx("p",{children:a.desc})]})]},r))})]}),e.jsxs("section",{className:"section",style:{paddingTop:"0"},children:[e.jsxs("div",{"data-animate":!0,children:[e.jsx("div",{className:"section-eyebrow",children:"Getting Started"}),e.jsxs("div",{className:"section-title",children:["Up and running in ",e.jsx("span",{children:"minutes"})]})]}),e.jsx("div",{className:"steps-list",children:m.map((a,r)=>e.jsxs("div",{className:"step-row","data-animate":!0,"data-d":String(r+1),children:[e.jsxs("div",{className:"step-circle",children:["0",r+1]}),e.jsxs("div",{className:"step-content",children:[e.jsx("h4",{children:a.title}),e.jsx("p",{children:a.desc})]})]},r))})]}),e.jsx("div",{className:"access-section",id:"access",children:e.jsxs("div",{className:"access-inner","data-animate":!0,children:[e.jsxs("div",{className:"access-left",children:[e.jsx("h2",{children:"Ready to use SourceU CRM?"}),e.jsx("p",{children:"Sign in with your SourceU account or request access from your team lead. It takes less than 2 minutes to get started."})]}),e.jsxs("div",{className:"access-right",children:[e.jsx("a",{href:"/login",className:"btn-access",children:"Sign In to CRM"}),e.jsx("span",{className:"access-note",children:"For SourceU employees only · Use your company email"})]})]})}),e.jsxs("footer",{children:[e.jsxs("div",{className:"footer-left",children:[e.jsxs("a",{href:"/",className:"logo-wrap",children:[e.jsx("span",{className:"logo-text",style:{fontSize:"1.1rem"},children:"SourceU"}),e.jsx("span",{className:"logo-badge",children:"CRM"})]}),e.jsxs("span",{className:"footer-copy",children:["An internal tool by SourceU · ",new Date().getFullYear()]})]}),e.jsxs("ul",{className:"footer-links",children:[e.jsx("li",{children:e.jsx("a",{href:"#",children:"Help & Support"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Privacy Policy"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Report an Issue"})})]}),e.jsx("span",{className:"footer-tag",children:"Internal Use Only"})]})]})]})}export{j as default};
