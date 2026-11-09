import { useEffect, useMemo, useState } from "react";

type Page = "home" | "rsvp" | "gifts" | "info" | "admin";
type GuestStatus = "pending" | "yes" | "no";

const photos = {
  couple:
    "https://images.unsplash.com/photo-1789486525399-253e430b5446?auto=format&fit=crop&w=1600&q=86",
  greenhouse:
    "https://images.unsplash.com/photo-1748864688405-c2506003829f?auto=format&fit=crop&w=1400&q=85",
  garden:
    "https://images.unsplash.com/photo-1526071280296-b941175cec92?auto=format&fit=crop&w=1200&q=85",
  rings:
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85",
  table:
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
};

const initialGifts = [
  {
    id: 1,
    name: "Jantar sob as estrelas",
    category: "Experiências",
    price: 420,
    image: photos.table,
    available: 3,
  },
  {
    id: 2,
    name: "Passeio pelos canais",
    category: "Lua de mel",
    price: 680,
    image:
      "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=900&q=85",
    available: 2,
  },
  {
    id: 3,
    name: "Conjunto de taças de cristal",
    category: "Novo lar",
    price: 350,
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85",
    available: 4,
  },
  {
    id: 4,
    name: "Café da manhã em Paris",
    category: "Lua de mel",
    price: 290,
    image:
      "https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=900&q=85",
    available: 5,
  },
  {
    id: 5,
    name: "Jardim para nossa varanda",
    category: "Novo lar",
    price: 180,
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85",
    available: 6,
  },
  {
    id: 6,
    name: "Brinde dos recém-casados",
    category: "Celebração",
    price: 240,
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=85",
    available: 8,
  },
];

const groups: Record<string, { invite: string; guests: string[] }> = {
  SH2027: {
    invite: "Família Nakamura",
    guests: ["Akira Nakamura", "Emi Nakamura", "Kenji Nakamura"],
  },
  AMSTERDAM: { invite: "Marina & Rafael", guests: ["Marina Oliveira", "Rafael Oliveira"] },
};

function Mark({ light = false }: { light?: boolean }) {
  return (
    <div className={`mark ${light ? "mark-light" : ""}`}>
      <span>S</span>
      <i>&</i>
      <span>H</span>
    </div>
  );
}

function Botanical({ className = "" }: { className?: string }) {
  return (
    <svg className={`botanical ${className}`} viewBox="0 0 210 280" fill="none" aria-hidden="true">
      <path d="M24 278C57 214 65 147 69 3M68 105C38 93 23 71 18 43M67 141c39-13 63-40 75-75M54 197c-27-4-43-17-52-39M58 174c44-4 74-24 91-60M41 232c35 3 65-7 90-30" />
      <path d="M68 101c-25-3-42-23-49-56 28 8 44 27 49 56ZM70 137c29-6 53-27 70-65-35 10-59 31-70 65ZM55 193c-24-1-40-12-50-33 24-2 41 9 50 33ZM61 171c32-3 60-22 85-54-38 4-65 22-85 54ZM43 229c30 2 58-7 84-26-34-3-62 6-84 26Z" />
      <path d="M120 275c14-51 11-97-8-138M113 188c-24-4-40-17-49-39M115 213c28-11 46-30 55-58M119 241c-19-2-32-11-41-26M111 162c22-14 35-35 38-62" />
    </svg>
  );
}

function Header({ page, go }: { page: Page; go: (page: Page) => void }) {
  const [open, setOpen] = useState(false);
  const nav: [Page, string][] = [
    ["home", "Nossa história"],
    ["rsvp", "RSVP"],
    ["gifts", "Presentes"],
    ["info", "Informações"],
  ];
  return (
    <header className="header">
      <button className="brand" onClick={() => go("home")} aria-label="Ir para início">
        <Mark />
      </button>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Abrir menu">
        <span />
        <span />
      </button>
      <nav className={open ? "nav open" : "nav"}>
        {nav.map(([key, label]) => (
          <button
            key={key}
            className={page === key ? "active" : ""}
            onClick={() => {
              go(key);
              setOpen(false);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <button className="header-rsvp" onClick={() => go("rsvp")}>
        Confirmar presença
      </button>
    </header>
  );
}

function Countdown() {
  const calculate = () => {
    const difference = Math.max(0, new Date("2027-07-24T15:00:00-03:00").getTime() - Date.now());
    return {
      dias: Math.floor(difference / 86400000),
      horas: Math.floor((difference / 3600000) % 24),
      minutos: Math.floor((difference / 60000) % 60),
      segundos: Math.floor((difference / 1000) % 60),
    };
  };
  const [time, setTime] = useState(calculate);
  useEffect(() => {
    const timer = window.setInterval(() => setTime(calculate()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="countdown">
      {Object.entries(time).map(([label, value]) => (
        <div key={label}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function Home({ go }: { go: (p: Page) => void }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy paper">
          <Botanical className="hero-leaf" />
          <p className="eyebrow">O casamento de</p>
          <h1>
            Sarah <em>&</em>
            <br />
            Hayato
          </h1>
          <div className="hero-rule">
            <span />
          </div>
          <p className="hero-date">24 · 07 · 2027</p>
          <p className="hero-place">
            Espaço Bodocó <i>—</i> 15 horas
          </p>
          <button className="text-link" onClick={() => go("rsvp")}>
            Confirme sua presença <b>→</b>
          </button>
        </div>
        <div className="hero-photo" style={{ backgroundImage: `url(${photos.couple})` }}>
          <span className="photo-credit">Foto: Tim Mossholder · Unsplash</span>
        </div>
        <div className="hero-side">
          <span>São Paulo · Brasil</span>
        </div>
      </section>

      <section className="date-section">
        <p className="script">contando os dias</p>
        <h2>Até o nosso para sempre</h2>
        <Countdown />
        <p className="date-note">
          Uma tarde entre jardins, música e todas as pessoas que fazem parte da nossa história.
        </p>
      </section>

      <section className="story-section">
        <div className="story-photo frame">
          <img src={photos.greenhouse} alt="Entrada de uma estufa botânica" />
          <span>01</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">Nossa história</p>
          <h2>
            Do acaso,
            <br />
            <em>floresceu o amor.</em>
          </h2>
          <p>
            Nos encontramos em uma tarde que parecia comum. Entre conversas longas, cafés sem pressa
            e viagens improvisadas, descobrimos um no outro um lugar para chamar de casa.
          </p>
          <p>
            Sete anos depois, seguimos escolhendo dividir o cotidiano, os sonhos e a vontade de
            conhecer o mundo — sempre juntos.
          </p>
          <div className="signature">S & H</div>
        </div>
      </section>

      <section className="proposal-section">
        <Botanical className="proposal-leaf" />
        <div className="proposal-copy">
          <p className="eyebrow light">O pedido</p>
          <h2>
            Amsterdam,
            <br />
            entre folhas e promessas
          </h2>
          <p>
            Foi no silêncio verde do Hortus Botanicus, em Amsterdam, que Hayato fez a pergunta. Sob
            a luz atravessando o teto de vidro, Sarah disse sim — e o jardim inteiro pareceu
            celebrar.
          </p>
          <p className="location">Hortus Botanicus · 18.09.2025</p>
        </div>
        <div className="proposal-image">
          <img src={photos.garden} alt="Jardim botânico e sua vegetação" />
        </div>
      </section>

      <section className="invitation">
        <p className="script">celebre conosco</p>
        <h2>
          Será ainda mais bonito
          <br />
          ter você por perto.
        </h2>
        <button className="button primary" onClick={() => go("rsvp")}>
          Confirmar presença
        </button>
      </section>
    </main>
  );
}

function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="page-intro paper">
      <Botanical />
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  );
}

function RSVP() {
  const [code, setCode] = useState("");
  const [group, setGroup] = useState<(typeof groups)[string] | null>(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, GuestStatus>>({});
  const [step, setStep] = useState<"identify" | "answer" | "review" | "success">("identify");
  const findInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const found = groups[code.trim().toUpperCase()];
    if (!found) {
      setError("Não encontramos este convite. Confira o código e tente novamente.");
      return;
    }
    setGroup(found);
    setAnswers(Object.fromEntries(found.guests.map((g) => [g, "pending"])));
    setError("");
    setStep("answer");
  };
  return (
    <main>
      <PageIntro
        eyebrow="Répondez s’il vous plaît"
        title="Confirme sua presença"
        text="Sua resposta nos ajuda a preparar cada detalhe com todo o carinho."
      />
      <section className="rsvp-shell">
        <div className="steps">
          {["Identificação", "Convidados", "Revisão"].map((s, i) => (
            <div
              className={
                step === "success" || ["identify", "answer", "review"].indexOf(step) >= i
                  ? "on"
                  : ""
              }
              key={s}
            >
              <span>{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        {step === "identify" && (
          <form className="invite-card" onSubmit={findInvite}>
            <p className="eyebrow">Seu convite</p>
            <h2>Vamos encontrar seu grupo</h2>
            <p>
              Digite o código enviado junto ao seu convite. Apenas as pessoas previamente
              cadastradas serão exibidas.
            </p>
            <label>
              Código do convite
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex.: SH2027"
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="button primary" type="submit">
              Continuar
            </button>
            <small>
              Para conhecer a demonstração, use{" "}
              <button type="button" onClick={() => setCode("SH2027")}>
                SH2027
              </button>
              .
            </small>
          </form>
        )}
        {step === "answer" && group && (
          <div className="invite-card wide">
            <p className="eyebrow">{group.invite}</p>
            <h2>Quem estará conosco?</h2>
            <p>Responda individualmente para cada integrante do convite.</p>
            <div className="guest-list">
              {group.guests.map((guest) => (
                <div className="guest-row" key={guest}>
                  <div className="avatar">
                    {guest
                      .split(" ")
                      .map((x) => x[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <strong>{guest}</strong>
                  <div className="choice">
                    <button
                      className={answers[guest] === "yes" ? "yes selected" : "yes"}
                      onClick={() => setAnswers({ ...answers, [guest]: "yes" })}
                    >
                      Estarei presente
                    </button>
                    <button
                      className={answers[guest] === "no" ? "no selected" : "no"}
                      onClick={() => setAnswers({ ...answers, [guest]: "no" })}
                    >
                      Não poderei ir
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button className="button ghost" onClick={() => setStep("identify")}>
                Voltar
              </button>
              <button
                className="button primary"
                disabled={Object.values(answers).includes("pending")}
                onClick={() => setStep("review")}
              >
                Revisar respostas
              </button>
            </div>
          </div>
        )}
        {step === "review" && group && (
          <div className="invite-card">
            <p className="eyebrow">Revise com carinho</p>
            <h2>Está tudo certo?</h2>
            <div className="review-list">
              {group.guests.map((guest) => (
                <div key={guest}>
                  <span>{guest}</span>
                  <b className={answers[guest]}>
                    {answers[guest] === "yes" ? "Presença confirmada" : "Não comparecerá"}
                  </b>
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button className="button ghost" onClick={() => setStep("answer")}>
                Editar
              </button>
              <button className="button primary" onClick={() => setStep("success")}>
                Enviar confirmação
              </button>
            </div>
          </div>
        )}
        {step === "success" && (
          <div className="invite-card success">
            <Mark />
            <p className="script">resposta recebida</p>
            <h2>Obrigada por confirmar!</h2>
            <p>
              As respostas do seu grupo foram registradas nesta demonstração. Esperamos celebrar
              juntos.
            </p>
            <button
              className="text-link"
              onClick={() => {
                setStep("identify");
                setCode("");
                setGroup(null);
              }}
            >
              Consultar outro convite →
            </button>
          </div>
        )}
        <p className="privacy-note">
          Por privacidade, cada código permite acessar somente as pessoas vinculadas ao respectivo
          convite.
        </p>
      </section>
    </main>
  );
}

function Gifts() {
  const [category, setCategory] = useState("Todos");
  const [selected, setSelected] = useState<(typeof initialGifts)[number] | null>(null);
  const [payment, setPayment] = useState<"pix" | "card">("pix");
  const [paid, setPaid] = useState(false);
  const categories = ["Todos", ...new Set(initialGifts.map((g) => g.category))];
  const shown =
    category === "Todos" ? initialGifts : initialGifts.filter((g) => g.category === category);
  return (
    <main>
      <PageIntro
        eyebrow="Lista de presentes"
        title="Um gesto de carinho"
        text="Sua presença é o nosso maior presente. Se desejar nos presentear, reunimos algumas ideias para a nossa nova história."
      />
      <section className="gifts-section">
        <div className="filters">
          {categories.map((c) => (
            <button
              className={category === c ? "active" : ""}
              key={c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="gift-grid">
          {shown.map((gift) => (
            <article className="gift-card" key={gift.id}>
              <div className="gift-image">
                <img src={gift.image} alt={gift.name} />
                <span>{gift.category}</span>
              </div>
              <div>
                <p className="availability">{gift.available} cotas disponíveis</p>
                <h3>{gift.name}</h3>
                <p className="gift-desc">
                  Uma contribuição simbólica para criarmos novas memórias juntos.
                </p>
                <div className="gift-bottom">
                  <strong>
                    {gift.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </strong>
                  <button
                    onClick={() => {
                      setSelected(gift);
                      setPaid(false);
                    }}
                  >
                    Presentear
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      {selected && (
        <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
          <div className="payment-modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>
              Fechar ×
            </button>
            {!paid ? (
              <>
                <p className="eyebrow">Presente escolhido</p>
                <h2>{selected.name}</h2>
                <p className="payment-price">
                  {selected.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <div className="payment-tabs">
                  <button
                    className={payment === "pix" ? "active" : ""}
                    onClick={() => setPayment("pix")}
                  >
                    PIX
                  </button>
                  <button
                    className={payment === "card" ? "active" : ""}
                    onClick={() => setPayment("card")}
                  >
                    Cartão
                  </button>
                </div>
                {payment === "pix" ? (
                  <div className="pix-box">
                    <div className="fake-qr">
                      <Mark />
                    </div>
                    <div>
                      <strong>Escaneie o código</strong>
                      <p>Este QR Code é apenas ilustrativo e não realiza cobranças.</p>
                      <button
                        onClick={() =>
                          navigator.clipboard?.writeText("PIX-DEMONSTRATIVO-SARAH-HAYATO")
                        }
                      >
                        Copiar código demonstrativo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card-form">
                    <label>
                      Nome no cartão
                      <input placeholder="Nome completo" />
                    </label>
                    <label>
                      Número do cartão
                      <input placeholder="0000 0000 0000 0000" />
                    </label>
                    <div>
                      <label>
                        Validade
                        <input placeholder="MM/AA" />
                      </label>
                      <label>
                        CVV
                        <input placeholder="000" />
                      </label>
                    </div>
                  </div>
                )}
                <p className="demo-warning">
                  Ambiente demonstrativo — nenhuma transação será processada.
                </p>
                <button className="button primary full" onClick={() => setPaid(true)}>
                  Simular pagamento
                </button>
              </>
            ) : (
              <div className="payment-success">
                <Mark />
                <p className="script">com carinho</p>
                <h2>Presente reservado!</h2>
                <p>Esta foi uma simulação. Nenhum valor foi cobrado ou transferido.</p>
                <button className="button primary" onClick={() => setSelected(null)}>
                  Concluir
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Info() {
  const [open, setOpen] = useState(0);
  return (
    <main>
      <PageIntro
        eyebrow="Para o grande dia"
        title="Informações"
        text="Tudo o que você precisa saber para viver esta tarde conosco."
      />
      <section className="venue">
        <div className="venue-image">
          <img src={photos.table} alt="Celebração de casamento ao ar livre" />
        </div>
        <div className="venue-copy">
          <p className="eyebrow">Cerimônia & recepção</p>
          <h2>Espaço Bodocó</h2>
          <p className="big-date">
            24 de julho de 2027
            <br />
            às 15 horas
          </p>
          <p>
            Estrada Municipal do Campo Verde, 420
            <br />
            São Paulo — SP
          </p>
          <a
            className="button primary"
            href="https://www.google.com/maps/search/?api=1&query=Espaço+Bodocó+São+Paulo"
            target="_blank"
            rel="noreferrer"
          >
            Abrir no mapa
          </a>
        </div>
      </section>
      <section className="details-grid">
        <article className="dress-card">
          <p className="eyebrow light">Dress code</p>
          <h2>Passeio completo</h2>
          <p>
            Elegante, confortável e com personalidade. A celebração acontecerá entre áreas internas
            e jardins.
          </p>
          <div className="palette">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <small>
            Pedimos gentilmente que evitem branco, off-white e verde oliva, reservados para momentos
            especiais da cerimônia.
          </small>
        </article>
        <div className="tips">
          <p className="eyebrow">Antes de sair de casa</p>
          {[
            ["Chegada", "Sugerimos chegar às 14h30. A cerimônia começará pontualmente às 15h."],
            ["Estacionamento", "O espaço possui estacionamento gratuito e equipe de manobristas."],
            ["Clima", "Julho pode ser fresco ao entardecer. Considere levar um xale ou paletó."],
          ].map(([title, text], i) => (
            <div className={open === i ? "tip open" : "tip"} key={title}>
              <button onClick={() => setOpen(i)}>
                <span>0{i + 1}</span>
                {title}
                <b>+</b>
              </button>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="wedding-party">
        <p className="script">para pessoas especiais</p>
        <h2>Padrinhos & madrinhas</h2>
        <p>
          Vocês fazem parte da nossa história e estarão ao nosso lado neste dia. Preparamos
          orientações de cores para uma composição harmônica.
        </p>
        <div className="party-cards">
          <div>
            <span className="fabric wine" />
            <h3>Madrinhas</h3>
            <p>Vestidos longos em vinho, bordô ou terracota queimada.</p>
          </div>
          <div>
            <span className="fabric green" />
            <h3>Padrinhos</h3>
            <p>Terno em tom verde profundo, camisa marfim e gravata vinho.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Admin({ go }: { go: (p: Page) => void }) {
  const [logged, setLogged] = useState(false);
  const [tab, setTab] = useState("Visão geral");
  const [search, setSearch] = useState("");
  const [guests, setGuests] = useState([
    { name: "Akira Nakamura", group: "Família Nakamura", status: "Confirmado" },
    { name: "Emi Nakamura", group: "Família Nakamura", status: "Pendente" },
    { name: "Marina Oliveira", group: "Marina & Rafael", status: "Confirmado" },
    { name: "Rafael Oliveira", group: "Marina & Rafael", status: "Não irá" },
  ]);
  const [newGuest, setNewGuest] = useState("");
  const [adminGifts, setAdminGifts] = useState(initialGifts.slice(0, 4));
  if (!logged)
    return (
      <main className="admin-login">
        <div className="login-art">
          <Botanical />
          <Mark light />
          <p>Sarah & Hayato</p>
          <span>Área reservada</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLogged(true);
          }}
        >
          <button type="button" className="back-site" onClick={() => go("home")}>
            ← Voltar ao site
          </button>
          <p className="eyebrow">Administração</p>
          <h1>Bem-vindos</h1>
          <p>Acesse o painel para acompanhar e editar as informações do casamento.</p>
          <label>
            E-mail
            <input required type="email" defaultValue="sarah@sh2027.com" />
          </label>
          <label>
            Senha
            <input required type="password" defaultValue="casamento2027" />
          </label>
          <button className="button primary full">Entrar no painel</button>
          <small>Ambiente demonstrativo. Use os dados já preenchidos.</small>
        </form>
      </main>
    );
  const tabs = ["Visão geral", "Convidados", "Convites", "Presentes", "Conteúdo", "Fotos"];
  const filtered = guests.filter((g) =>
    `${g.name} ${g.group}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <main className="dashboard">
      <aside>
        <Mark light />
        <nav>
          {tabs.map((t) => (
            <button className={tab === t ? "active" : ""} onClick={() => setTab(t)} key={t}>
              {t}
              <span>›</span>
            </button>
          ))}
        </nav>
        <button className="logout" onClick={() => setLogged(false)}>
          Sair do painel
        </button>
      </aside>
      <section className="dash-main">
        <header>
          <div>
            <p className="eyebrow">24 · 07 · 2027</p>
            <h1>{tab}</h1>
          </div>
          <button className="button ghost" onClick={() => go("home")}>
            Pré-visualizar site ↗
          </button>
        </header>
        {tab === "Visão geral" && (
          <>
            <div className="metric-grid">
              <article>
                <span>Convidados</span>
                <strong>124</strong>
                <small>em 52 convites</small>
              </article>
              <article>
                <span>Confirmados</span>
                <strong>86</strong>
                <small className="positive">69% do total</small>
              </article>
              <article>
                <span>Pendentes</span>
                <strong>31</strong>
                <small>Enviar lembrete</small>
              </article>
              <article>
                <span>Presentes</span>
                <strong>18</strong>
                <small className="positive">12 esta semana</small>
              </article>
            </div>
            <div className="dashboard-grid">
              <article className="chart-card">
                <h3>Confirmações</h3>
                <div className="donut">
                  <span>
                    69%<small>confirmados</small>
                  </span>
                </div>
                <div className="legend">
                  <span>
                    <i className="confirmed" /> Confirmados 86
                  </span>
                  <span>
                    <i className="pending" /> Pendentes 31
                  </span>
                  <span>
                    <i className="declined" /> Ausentes 7
                  </span>
                </div>
              </article>
              <article className="activity">
                <h3>Atividade recente</h3>
                {[
                  "Marina confirmou presença",
                  "Novo presente reservado",
                  "Rafael informou ausência",
                  "Foto da galeria atualizada",
                ].map((x, i) => (
                  <p key={x}>
                    <i />
                    {x}
                    <small>
                      há {i + 1} hora{i ? "s" : ""}
                    </small>
                  </p>
                ))}
              </article>
            </div>
          </>
        )}
        {tab === "Convidados" && (
          <article className="admin-table">
            <div className="table-tools">
              <input
                placeholder="Buscar convidado ou grupo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newGuest.trim()) {
                    setGuests([
                      ...guests,
                      { name: newGuest, group: "Novo convite", status: "Pendente" },
                    ]);
                    setNewGuest("");
                  }
                }}
              >
                <input
                  placeholder="Nome do novo convidado"
                  value={newGuest}
                  onChange={(e) => setNewGuest(e.target.value)}
                />
                <button className="button primary">Adicionar</button>
              </form>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Convidado</th>
                  <th>Convite</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.name}>
                    <td>
                      <b>{g.name}</b>
                    </td>
                    <td>{g.group}</td>
                    <td>
                      <button
                        className={`status ${g.status.toLowerCase().replace(" ", "-")}`}
                        onClick={() =>
                          setGuests(
                            guests.map((x) =>
                              x.name === g.name
                                ? {
                                    ...x,
                                    status: x.status === "Confirmado" ? "Pendente" : "Confirmado",
                                  }
                                : x,
                            ),
                          )
                        }
                      >
                        {g.status}
                      </button>
                    </td>
                    <td>
                      <button
                        className="delete"
                        onClick={() => setGuests(guests.filter((x) => x.name !== g.name))}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        )}
        {tab === "Presentes" && (
          <div className="admin-gifts">
            <div className="section-heading">
              <div>
                <h2>Catálogo de presentes</h2>
                <p>Organize itens, valores e disponibilidade.</p>
              </div>
              <button
                className="button primary"
                onClick={() =>
                  setAdminGifts([...adminGifts, { ...initialGifts[5], id: Date.now() }])
                }
              >
                Adicionar presente
              </button>
            </div>
            {adminGifts.map((g, i) => (
              <article key={g.id}>
                <img src={g.image} alt="" />
                <div>
                  <b>{g.name}</b>
                  <small>{g.category}</small>
                </div>
                <strong>R$ {g.price}</strong>
                <span>{g.available} cotas</span>
                <button onClick={() => setAdminGifts(adminGifts.filter((_, x) => x !== i))}>
                  Excluir
                </button>
              </article>
            ))}
          </div>
        )}
        {tab === "Conteúdo" && (
          <div className="content-editor">
            <h2>Textos do site</h2>
            <p>Edite os principais textos publicados.</p>
            {[
              ["Título da história", "Do acaso, floresceu o amor."],
              [
                "Nossa história",
                "Nos encontramos em uma tarde que parecia comum. Entre conversas longas, cafés sem pressa e viagens improvisadas...",
              ],
              ["Mensagem de presentes", "Sua presença é o nosso maior presente."],
            ].map(([label, text]) => (
              <label key={label}>
                {label}
                <textarea defaultValue={text} />
              </label>
            ))}
            <button
              className="button primary"
              onClick={() => alert("Alterações salvas nesta demonstração.")}
            >
              Salvar alterações
            </button>
          </div>
        )}
        {["Convites", "Fotos"].includes(tab) && (
          <div className="empty-admin">
            <Botanical />
            <h2>{tab}</h2>
            <p>
              {tab === "Fotos"
                ? "Envie, organize e defina as imagens em destaque do site."
                : "Crie grupos, gere códigos exclusivos e acompanhe cada resposta."}
            </p>
            <button className="button primary">
              Adicionar {tab === "Fotos" ? "foto" : "convite"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function Footer({ go }: { go: (p: Page) => void }) {
  return (
    <footer>
      <Botanical />
      <Mark light />
      <p className="footer-names">Sarah & Hayato</p>
      <p>24 de julho de 2027 · Espaço Bodocó</p>
      <div className="footer-links">
        <button onClick={() => go("home")}>Nossa história</button>
        <button onClick={() => go("rsvp")}>RSVP</button>
        <button onClick={() => go("gifts")}>Presentes</button>
        <button onClick={() => go("info")}>Informações</button>
      </div>
      <button className="admin-link" onClick={() => go("admin")}>
        Acesso administrativo
      </button>
    </footer>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const go = (next: Page) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const content = useMemo(
    () =>
      ({
        home: <Home go={go} />,
        rsvp: <RSVP />,
        gifts: <Gifts />,
        info: <Info />,
        admin: <Admin go={go} />,
      })[page],
    [page],
  );
  return (
    <div className="app">
      {page !== "admin" && <Header page={page} go={go} />}
      {content}
      {page !== "admin" && <Footer go={go} />}
    </div>
  );
}
