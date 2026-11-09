import { useEffect, useMemo, useState } from "react";

type Page = "home" | "rsvp" | "gifts" | "info" | "admin";
type GuestStatus = "pending" | "yes" | "no";
type AdminGuestStatus = "Confirmado" | "Não irá" | "Pendente" | "Cancelado";
type AdminGuest = {
  id: string;
  name: string;
  code: string;
  group: string;
  status: AdminGuestStatus;
  responseDate: string;
  notes: string;
};
type AdminInvite = { id: string; code: string; group: string };
type AdminGift = (typeof initialGifts)[number] & {
  description?: string;
  status?: "Disponível" | "Indisponível";
  purchased?: number;
};

function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

const initialAdminGuests: AdminGuest[] = [
  { id: "001", name: "Akira Nakamura", code: "SH2027", group: "Família Nakamura", status: "Confirmado", responseDate: "2026-11-09", notes: "" },
  { id: "002", name: "Emi Nakamura", code: "SH2027", group: "Família Nakamura", status: "Pendente", responseDate: "", notes: "" },
  { id: "003", name: "Kenji Nakamura", code: "SH2027", group: "Família Nakamura", status: "Pendente", responseDate: "", notes: "" },
  { id: "004", name: "Marina Oliveira", code: "AMSTERDAM", group: "Marina & Rafael", status: "Confirmado", responseDate: "2026-11-09", notes: "" },
  { id: "005", name: "Rafael Oliveira", code: "AMSTERDAM", group: "Marina & Rafael", status: "Não irá", responseDate: "2026-11-09", notes: "" },
];

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
const defaultSiteContent = {
  storyTitle: "Do acaso, floresceu o amor.",
  story: "Nos encontramos em uma tarde que parecia comum. Entre conversas longas, cafés sem pressa e viagens improvisadas, descobrimos um no outro um lugar para chamar de casa.",
  giftMessage: "Sua presença é o nosso maior presente.",
  venue: "Espaço Bodocó",
  address: "Estrada Municipal do Campo Verde, 420 — São Paulo — SP",
};
const defaultSiteGallery = [
  { id: "couple", label: "Foto principal", url: photos.couple },
  { id: "greenhouse", label: "Nossa história", url: photos.greenhouse },
  { id: "garden", label: "Pedido", url: photos.garden },
  { id: "table", label: "Celebração", url: photos.table },
];

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
    ["rsvp", "Confirmar presença"],
    ["gifts", "Lista de presentes"],
    ["info", "Informações e localização"],
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
  const [siteContent] = useStoredState("sh-site-content", defaultSiteContent);
  const [gallery] = useStoredState("sh-site-gallery", defaultSiteGallery);
  const image = (index: number, fallback: string) => gallery[index]?.url ?? fallback;
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
          <p className="hero-place">{siteContent.venue} <i>—</i> 15 horas</p>
          <button className="text-link" onClick={() => go("rsvp")}>
            Confirme sua presença <b>→</b>
          </button>
        </div>
        <div className="hero-photo" style={{ backgroundImage: `url(${image(0, photos.couple)})` }}>
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
          {image(1, photos.greenhouse) && <img src={image(1, photos.greenhouse)} alt="Entrada de uma estufa botânica" />}
          <span>01</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">Nossa história</p>
          <h2>{siteContent.storyTitle}</h2>
          <p>{siteContent.story}</p>
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
          {image(2, photos.garden) && <img src={image(2, photos.garden)} alt="Jardim botânico e sua vegetação" />}
        </div>
      </section>

      {gallery.slice(defaultSiteGallery.length).some((photo) => photo.url) && (
        <section className="managed-gallery">
          <p className="script">memórias</p>
          <h2>Mais momentos da nossa história</h2>
          <div className="managed-gallery-grid">
            {gallery.slice(defaultSiteGallery.length).filter((photo) => photo.url).map((photo) => (
              <figure key={photo.id}>
                <img src={photo.url} alt={photo.label} />
                <figcaption>{photo.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="invitation">
        <p className="script">celebre conosco</p>
        <h2>{siteContent.giftMessage}</h2>
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
  const submitResponses = () => {
    if (!group) return;
    const stored = window.localStorage.getItem("sh-admin-guests");
    const currentGuests: AdminGuest[] = stored ? JSON.parse(stored) : initialAdminGuests;
    const updatedGuests = currentGuests.map((guest) => {
      if (!group.guests.includes(guest.name)) return guest;
      const answer = answers[guest.name];
      if (answer !== "yes" && answer !== "no") return guest;
      return {
        ...guest,
        status: answer === "yes" ? "Confirmado" : "Não irá",
        responseDate: new Date().toISOString().slice(0, 10),
      };
    });
    window.localStorage.setItem("sh-admin-guests", JSON.stringify(updatedGuests));
    setStep("success");
  };
  const findInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const inviteCode = code.trim().toUpperCase();
    const storedInvites = window.localStorage.getItem("sh-admin-invites");
    const storedGuests = window.localStorage.getItem("sh-admin-guests");
    const registeredInvite = storedInvites
      ? (JSON.parse(storedInvites) as AdminInvite[]).find((invite) => invite.code === inviteCode)
      : undefined;
    const registeredGuests = storedGuests ? (JSON.parse(storedGuests) as AdminGuest[]) : initialAdminGuests;
    const registeredMembers = registeredInvite
      ? registeredGuests.filter((guest) => guest.code === inviteCode && guest.status !== "Cancelado")
      : [];
    const found = storedInvites
      ? registeredInvite && registeredMembers.length
        ? { invite: registeredInvite.group, guests: registeredMembers.map((guest) => guest.name) }
        : undefined
      : groups[inviteCode];
    if (!found) {
      setError("Não encontramos este convite. Confira o código e tente novamente.");
      return;
    }
    setGroup(found);
    setAnswers(Object.fromEntries(found.guests.map((guest) => {
      const current = registeredGuests.find((item) => item.name === guest && item.code === inviteCode);
      return [guest, current?.status === "Confirmado" ? "yes" : current?.status === "Não irá" ? "no" : "pending"];
    })));
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
              <button className="button primary" onClick={submitResponses}>
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
  const [gifts] = useStoredState<AdminGift[]>(
    "sh-admin-gifts",
    initialGifts.slice(0, 4).map((gift) => ({ ...gift, description: "Uma contribuição simbólica para criarmos novas memórias juntos.", status: "Disponível", purchased: 0 })),
  );
  const [siteContent] = useStoredState("sh-site-content", defaultSiteContent);
  const publicGifts = gifts.filter((gift) => gift.status !== "Indisponível");
  const categories = ["Todos", ...new Set(publicGifts.map((g) => g.category))];
  const shown =
    category === "Todos" ? publicGifts : publicGifts.filter((g) => g.category === category);
  return (
    <main>
      <PageIntro
        eyebrow="Lista de presentes"
        title="Um gesto de carinho"
        text={`${siteContent.giftMessage} Se desejar nos presentear, reunimos algumas ideias para a nossa nova história.`}
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
                {gift.image ? <img src={gift.image} alt={gift.name} /> : <div className="gift-image-empty">Foto removida</div>}
                <span>{gift.category}</span>
              </div>
              <div>
                <p className="availability">{gift.available} cotas disponíveis</p>
                <h3>{gift.name}</h3>
                <p className="gift-desc">{gift.description || "Uma contribuição simbólica para criarmos novas memórias juntos."}</p>
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
                  <div className="payment-unavailable">
                    <strong>Pagamento não configurado</strong>
                    <p>Este protótipo não solicita dados de cartão nem processa transações.</p>
                  </div>
                )}
                <p className="demo-warning">
                  Ambiente demonstrativo — nenhuma transação será processada ou registrada como compra.
                </p>
                <button className="button primary full" onClick={() => setPaid(true)}>
                  Ver confirmação demonstrativa
                </button>
              </>
            ) : (
              <div className="payment-success">
                <Mark />
                <p className="script">com carinho</p>
                <h2>Prévia demonstrativa</h2>
                <p>Nenhuma reserva ou transação real foi efetuada. O catálogo e os pagamentos não foram alterados.</p>
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
  const [siteContent] = useStoredState("sh-site-content", defaultSiteContent);
  const [gallery] = useStoredState("sh-site-gallery", defaultSiteGallery);
  const image = (index: number, fallback: string) => gallery[index]?.url ?? fallback;
  return (
    <main>
      <PageIntro
        eyebrow="Para o grande dia"
        title="Informações e localização"
        text="Tudo o que você precisa saber para viver esta tarde conosco."
      />
      <section className="venue">
        <div className="venue-image">
          {image(3, photos.table) && <img src={image(3, photos.table)} alt="Celebração de casamento ao ar livre" />}
        </div>
        <div className="venue-copy">
          <p className="eyebrow">Cerimônia & recepção</p>
          <h2>{siteContent.venue}</h2>
          <p className="big-date">
            24 de julho de 2027
            <br />
            às 15 horas
          </p>
          <p>
            {siteContent.address}
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
            Elegante, confortável e com personalidade. Madrinhas em tons de verde e padrinhos em
            terno cinza-escuro.
          </p>
          <div className="attire-illustration" role="img" aria-label="Ilustração de um casal: homem de terno cinza-escuro e mulher de vestido longo verde">
            <svg viewBox="0 0 360 270" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 242C76 219 117 228 162 242C218 260 271 224 335 240" stroke="#C9A276" strokeWidth="1.5" />
              <path d="M42 240C57 213 57 179 48 151M48 185C34 177 26 162 24 146M49 204C65 194 74 180 78 163" stroke="#91A995" strokeWidth="2" strokeLinecap="round" />
              <path d="M27 146C38 151 45 163 48 180C34 175 27 164 27 146ZM78 163C66 169 56 181 49 197C65 192 75 180 78 163Z" fill="#91A995" fillOpacity=".55" />
              <path d="M145 70C145 54 156 42 171 42C187 42 198 55 198 72V91H145V70Z" fill="#D9B999" />
              <path d="M141 94L159 83L173 94L186 83L204 96L216 184H131L141 94Z" fill="#454A49" />
              <path d="M159 83L173 96L186 83L181 129H166L159 83Z" fill="#F8F5EC" />
              <path d="M171 96L177 102L173 128L167 102L171 96Z" fill="#641F32" />
              <path d="M146 99L122 114L132 150L150 140M198 100L222 114L211 150L194 140" stroke="#454A49" strokeWidth="13" strokeLinecap="round" />
              <path d="M145 184L141 238M201 184L206 238" stroke="#343A39" strokeWidth="17" strokeLinecap="round" />
              <path d="M132 240H152M196 240H216" stroke="#292E2D" strokeWidth="8" strokeLinecap="round" />
              <path d="M248 70C248 53 260 41 276 41C292 41 304 54 304 71V91H248V70Z" fill="#D9B999" />
              <path d="M246 93L276 83L307 94L319 150L300 241H235L226 150L246 93Z" fill="#365846" />
              <path d="M246 93L276 83L267 119L241 112L246 93ZM307 94L276 83L286 119L312 112L307 94Z" fill="#F4EFE5" />
              <path d="M276 120L292 150L300 241H235L246 150L276 120Z" fill="#456F55" />
              <path d="M248 99L227 116L236 151M304 99L325 116L316 151" stroke="#D9B999" strokeWidth="10" strokeLinecap="round" />
              <path d="M235 241H301" stroke="#C9A276" strokeWidth="1.5" />
            </svg>
          </div>
          <small>
            Pedimos gentilmente que evitem branco e off-white, reservados para momentos especiais da
            cerimônia.
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
            <h3>Madrinhas</h3>
            <p>Vestidos longos em tons de verde, do verde-médio ao oliva claro.</p>
            <div className="attire-swatches" aria-label="Tons de verde para madrinhas">
              <span style={{ backgroundColor: "#54765B" }} />
              <span style={{ backgroundColor: "#78946D" }} />
              <span style={{ backgroundColor: "#A5AE79" }} />
              <b>Verde-médio a oliva claro</b>
            </div>
          </div>
          <div>
            <h3>Padrinhos</h3>
            <p>Terno cinza-escuro, camisa branca e gravata.</p>
            <div className="attire-swatches" aria-label="Cinza-escuro para padrinhos">
              <span style={{ backgroundColor: "#454A49" }} />
              <b>Cinza-escuro</b>
            </div>
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
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [sortBy, setSortBy] = useState("name");
  const [guestEditor, setGuestEditor] = useState<AdminGuest | null>(null);
  const [giftEditor, setGiftEditor] = useState<AdminGift | null>(null);
  const [inviteEditor, setInviteEditor] = useState<AdminInvite | null>(null);
  const [message, setMessage] = useState("");
  const [guests, setGuests] = useStoredState<AdminGuest[]>("sh-admin-guests", initialAdminGuests);
  const [invites, setInvites] = useStoredState<AdminInvite[]>("sh-admin-invites", [
    { id: "invite-sh2027", code: "SH2027", group: "Família Nakamura" },
    { id: "invite-amsterdam", code: "AMSTERDAM", group: "Marina & Rafael" },
  ]);
  const [adminGifts, setAdminGifts] = useStoredState<AdminGift[]>(
    "sh-admin-gifts",
    initialGifts.slice(0, 4).map((gift) => ({
      ...gift,
      description: "Uma contribuição simbólica para criarmos novas memórias juntos.",
      status: "Disponível",
      purchased: 0,
    })),
  );
  const [payments] = useStoredState(
    "sh-demo-payments",
    [
      { id: "demo-1", gift: "Jantar sob as estrelas", buyer: "Registro demonstrativo", value: 420, method: "PIX", date: "2026-10-28", status: "Simulação — sem cobrança" },
      { id: "demo-2", gift: "Passeio pelos canais", buyer: "Registro demonstrativo", value: 680, method: "Cartão", date: "2026-11-02", status: "Simulação — sem cobrança" },
    ],
  );
  const [paymentFilter, setPaymentFilter] = useState("Todos");
  const [content, setContent] = useStoredState("sh-site-content", defaultSiteContent);
  const [gallery, setGallery] = useStoredState("sh-site-gallery", defaultSiteGallery);
  const tabs = ["Visão geral", "Convidados", "Convites", "Presentes", "Pagamentos", "Conteúdo", "Fotos"];
  const activeGuests = guests.filter((guest) => guest.status !== "Cancelado");
  const totals = {
    guests: guests.length,
    confirmed: guests.filter((guest) => guest.status === "Confirmado").length,
    declined: guests.filter((guest) => guest.status === "Não irá").length,
    pending: guests.filter((guest) => guest.status === "Pendente").length,
    canceled: guests.filter((guest) => guest.status === "Cancelado").length,
    invites: invites.length,
    answeredInvites: invites.filter((invite) =>
      guests.some((guest) => guest.code === invite.code && ["Confirmado", "Não irá"].includes(guest.status)),
    ).length,
  };
  const pendingInvites = Math.max(0, totals.invites - totals.answeredInvites);
  const responded = totals.confirmed + totals.declined;
  const pct = (value: number) => (guests.length ? Math.round((value / guests.length) * 100) : 0);
  const sortedGuests = [...guests]
    .filter((guest) => statusFilter === "Todos" || guest.status === statusFilter)
    .filter((guest) => `${guest.name} ${guest.group} ${guest.code} ${guest.id}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "name" ? a.name.localeCompare(b.name) : a.id.localeCompare(b.id));
  const nextGuestId = () => String(Math.max(0, ...guests.map((guest) => Number(guest.id))) + 1).padStart(3, "0");
  const saveGuest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!guestEditor) return;
    if (guests.some((guest) => guest.id === guestEditor.id)) {
      setGuests(guests.map((guest) => guest.id === guestEditor.id ? guestEditor : guest));
    } else {
      setGuests([...guests, guestEditor]);
    }
    setGuestEditor(null);
  };
  const addGuest = () => setGuestEditor({
    id: nextGuestId(),
    name: "",
    code: invites[0]?.code || "",
    group: invites[0]?.group || "",
    status: "Pendente",
    responseDate: "",
    notes: "",
  });
  const saveInvite = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inviteEditor) return;
    const previousCode = invites.find((invite) => invite.id === inviteEditor.id)?.code;
    if (invites.some((invite) => invite.code === inviteEditor.code && invite.id !== inviteEditor.id)) {
      setMessage("Este código já está associado a outro convite. Escolha um código único.");
      return;
    }
    const updatedInvites = invites.some((invite) => invite.id === inviteEditor.id)
      ? invites.map((invite) => invite.id === inviteEditor.id ? inviteEditor : invite)
      : [...invites, inviteEditor];
    setInvites(updatedInvites);
    setGuests(guests.map((guest) => guest.code === previousCode || guest.code === inviteEditor.code ? { ...guest, code: inviteEditor.code, group: inviteEditor.group } : guest));
    setInviteEditor(null);
  };
  const saveGift = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!giftEditor) return;
    const updated = adminGifts.some((gift) => gift.id === giftEditor.id)
      ? adminGifts.map((gift) => gift.id === giftEditor.id ? giftEditor : gift)
      : [...adminGifts, giftEditor];
    setAdminGifts(updated);
    setGiftEditor(null);
  };
  if (!logged) {
    return (
      <main className="admin-login">
        <div className="login-art">
          <Botanical />
          <Mark light />
          <p>Sarah & Hayato</p>
          <span>Área administrativa</span>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); setLogged(true); }}>
          <button type="button" className="back-site" onClick={() => go("home")}>← Voltar ao site</button>
          <p className="eyebrow">Administração</p>
          <h1>Bem-vindos</h1>
          <p>Acesse o painel demonstrativo de organização do casamento.</p>
          <label>E-mail<input required type="email" placeholder="E-mail dos noivos" /></label>
          <label>Senha<input required type="password" placeholder="Senha" /></label>
          <button className="button primary full">Entrar no painel</button>
          <small>Protótipo local: autenticação e armazenamento no navegador não substituem um backend seguro.</small>
        </form>
      </main>
    );
  }
  return (
    <main className="dashboard">
      <aside>
        <Mark light />
        <nav>{tabs.map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}<span>›</span></button>)}</nav>
        <button className="logout" onClick={() => setLogged(false)}>Sair do painel</button>
      </aside>
      <section className="dash-main">
        <header><div><p className="eyebrow">24 · 07 · 2027</p><h1>{tab}</h1></div><button className="button ghost" onClick={() => go("home")}>Pré-visualizar site ↗</button></header>
        {message && <p className="admin-notice" role="status">{message}<button onClick={() => setMessage("")}>Fechar</button></p>}
        {tab === "Visão geral" && <>
          <div className="metric-grid">
            {[["Convidados cadastrados", totals.guests], ["Confirmados", totals.confirmed], ["Não comparecerão", totals.declined], ["Aguardando resposta", totals.pending], ["Cancelados", totals.canceled], ["Convites cadastrados", totals.invites], ["Convites respondidos", totals.answeredInvites], ["Convites pendentes", pendingInvites]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{label === "Convites cadastrados" ? "grupos de convite" : "atualizado pelos cadastros"}</small></article>)}
          </div>
          <div className="dashboard-grid">
            <article className="chart-card">
              <h3>Status dos convidados</h3>
              <div className="admin-bars">{[["Confirmados", totals.confirmed, "confirmed"], ["Não irão", totals.declined, "declined"], ["Pendentes", totals.pending, "pending"], ["Cancelados", totals.canceled, "canceled"]].map(([label, value, css]) => <div className="admin-bar-row" key={label}><span>{label}</span><div><i className={String(css)} style={{ width: `${pct(Number(value))}%` }} /></div><b>{value}</b></div>)}</div>
              <p className="admin-chart-note">{responded} de {activeGuests.length} convidados ativos responderam.</p>
            </article>
            <article className="activity"><h3>Visão dos convites</h3><div className="invite-summary"><strong>{totals.answeredInvites}</strong><span>respondidos</span><strong>{pendingInvites}</strong><span>pendentes</span></div><p>O convite é contado como respondido quando ao menos uma pessoa do grupo informou sua resposta.</p><button className="button ghost" onClick={() => setTab("Convites")}>Gerenciar convites</button></article>
          </div>
        </>}
        {tab === "Convidados" && <article className="admin-table">
          <div className="section-heading"><div><h2>Lista de convidados</h2><p>{guests.length} registros, incluindo cancelados.</p>{invites.length === 0 && <p>Crie um convite antes de adicionar convidados.</p>}</div><button className="button primary" onClick={addGuest} disabled={invites.length === 0}>Adicionar convidado</button></div>
          <div className="guest-filters">{["Todos", "Confirmado", "Não irá", "Pendente", "Cancelado"].map((status) => <button className={statusFilter === status ? "active" : ""} onClick={() => setStatusFilter(status)} key={status}>{status}</button>)}</div>
          <div className="table-tools"><input placeholder="Pesquisar nome, número, grupo ou código" value={search} onChange={(event) => setSearch(event.target.value)} /><label className="sort-control">Ordenar<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="name">Nome</option><option value="id">Número</option></select></label></div>
          <div className="table-scroll"><table><thead><tr><th>Nº</th><th>Nome completo</th><th>Código</th><th>Grupo / titular</th><th>Status</th><th>Data da resposta</th><th>Ações</th></tr></thead><tbody>{sortedGuests.map((guest) => <tr key={guest.id}><td>{guest.id}</td><td><b>{guest.name}</b>{guest.notes && <small className="internal-note">Nota interna: {guest.notes}</small>}</td><td>{guest.code}</td><td>{guest.group}</td><td><select className={`status-select status-${guest.status.replace(/\s+/g, "-")}`} value={guest.status} onChange={(event) => setGuests(guests.map((item) => item.id === guest.id ? { ...item, status: event.target.value as AdminGuestStatus, responseDate: ["Pendente", "Cancelado"].includes(event.target.value) ? "" : new Date().toISOString().slice(0, 10) } : item))}><option>Confirmado</option><option>Não irá</option><option>Pendente</option><option>Cancelado</option></select></td><td>{guest.responseDate || "—"}</td><td className="table-actions"><button onClick={() => setGuestEditor(guest)}>Editar</button><button className="delete" onClick={() => { if (window.confirm(`Excluir ${guest.name}? O registro será preservado como cancelado para manter o histórico.`)) setGuests(guests.map((item) => item.id === guest.id ? { ...item, status: "Cancelado", responseDate: "" } : item)); }}>Excluir</button></td></tr>)}</tbody></table>{sortedGuests.length === 0 && <p className="empty-message">Nenhum convidado encontrado.</p>}</div>
        </article>}
        {tab === "Convites" && <article className="admin-table">
          <div className="section-heading"><div><h2>Convites e grupos</h2><p>Gerencie códigos e acompanhe respostas individuais do grupo.</p></div><button className="button primary" onClick={() => setInviteEditor({ id: `invite-${Date.now()}`, code: `SH${String(Date.now()).slice(-4)}`, group: "" })}>Criar convite</button></div>
          <div className="invite-admin-grid">{invites.map((invite) => { const members = guests.filter((guest) => guest.code === invite.code); const answered = members.filter((guest) => guest.status === "Confirmado" || guest.status === "Não irá").length; return <article key={invite.id}><div className="invite-admin-heading"><div><span>CÓDIGO DO CONVITE</span><strong>{invite.code}</strong></div><button onClick={() => setInviteEditor(invite)}>Editar grupo</button></div><h3>{invite.group}</h3><p>{members.length} integrantes · {answered} respostas · {members.length - answered} pendentes</p><div className="invite-members">{members.map((guest) => <div key={guest.id}><span>{guest.name}</span><b className={`status-text status-${guest.status.replace(/\s+/g, "-")}`}>{guest.status}</b><button onClick={() => setGuestEditor(guest)}>Editar</button></div>)}</div><div className="invite-card-actions"><button className="button ghost" onClick={() => { const names = window.prompt("Nomes completos, separados por vírgula"); if (names?.trim()) { let nextId = Math.max(0, ...guests.map((guest) => Number(guest.id))) + 1; const additions = names.split(",").map((name) => name.trim()).filter(Boolean).map((name) => ({ id: String(nextId++).padStart(3, "0"), name, code: invite.code, group: invite.group, status: "Pendente" as AdminGuestStatus, responseDate: "", notes: "" })); setGuests([...guests, ...additions]); } }}>Adicionar em grupo</button><button className="button primary" onClick={addGuest}>Novo integrante</button><button className="delete" onClick={() => { if (window.confirm(`Excluir o convite ${invite.code}? Os integrantes associados serão marcados como cancelados.`)) { setInvites(invites.filter((item) => item.id !== invite.id)); setGuests(guests.map((guest) => guest.code === invite.code ? { ...guest, status: "Cancelado" } : guest)); } }}>Excluir convite</button></div></article>; })}</div>
        </article>}
        {tab === "Presentes" && <article className="admin-gifts">
          <div className="section-heading"><div><h2>Lista de presentes</h2><p>{adminGifts.length} itens · as alterações são exibidas no catálogo público.</p></div><button className="button primary" onClick={() => setGiftEditor({ id: Date.now(), name: "", category: "Novo lar", price: 0, image: "", available: 1, description: "", status: "Disponível", purchased: 0 })}>Adicionar presente</button></div>
          <div className="gift-inventory-summary"><span><b>{adminGifts.filter((gift) => gift.status !== "Indisponível").length}</b> disponíveis</span><span><b>{adminGifts.reduce((sum, gift) => sum + (gift.purchased || 0), 0)}</b> compras registradas</span></div>
          {adminGifts.map((gift) => <article key={gift.id}>{gift.image ? <img src={gift.image} alt="" /> : <div className="admin-gift-image-empty">Sem foto</div>}<div><b>{gift.name}</b><small>{gift.category} · {gift.description || "Sem descrição"}</small></div><strong>{gift.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong><span>{gift.available} cotas · {gift.status}</span><div className="gift-admin-actions"><button onClick={() => setGiftEditor(gift)}>Editar</button><button onClick={() => setAdminGifts([...adminGifts, { ...gift, id: Date.now(), name: `${gift.name} (cópia)` }])}>Duplicar</button><button className="delete" onClick={() => { if (window.confirm(`Excluir o presente "${gift.name}"?`)) setAdminGifts(adminGifts.filter((item) => item.id !== gift.id)); }}>Excluir</button></div></article>)}
        </article>}
        {tab === "Pagamentos" && <article className="admin-table">
          <div className="section-heading"><div><h2>Registros de pagamento</h2><p>Registros apenas ilustrativos; não representam transações ou cobranças reais.</p></div></div>
          <div className="payment-summary"><span>Registros demonstrativos <b>{payments.length}</b></span><span>Transações efetivadas <b>0</b></span><span>Total recebido <b>R$ 0,00</b></span></div>
          <label className="sort-control">Filtrar<select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}><option>Todos</option><option>PIX</option><option>Cartão</option></select></label>
          <div className="table-scroll"><table><thead><tr><th>Presente</th><th>Comprador</th><th>Valor</th><th>Método</th><th>Data</th><th>Status</th></tr></thead><tbody>{payments.filter((payment) => paymentFilter === "Todos" || payment.method === paymentFilter).map((payment) => <tr key={payment.id}><td>{payment.gift}</td><td>{payment.buyer}</td><td>{payment.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td><td>{payment.method}</td><td>{payment.date}</td><td>{payment.status}</td></tr>)}</tbody></table></div>
        </article>}
        {tab === "Conteúdo" && <article className="content-editor">
          <h2>Conteúdos do site</h2><p>Edite textos que são exibidos nas páginas públicas.</p>
          {([["Título da história", "storyTitle"], ["Nossa história", "story"], ["Mensagem da lista de presentes", "giftMessage"], ["Local da cerimônia", "venue"], ["Endereço", "address"]] as const).map(([label, key]) => <label key={key}>{label}<textarea value={content[key]} onChange={(event) => setContent({ ...content, [key]: event.target.value })} /></label>)}
          <button className="button primary" onClick={() => setMessage("Conteúdo salvo e publicado no site deste navegador.")}>Salvar alterações</button>
        </article>}
        {tab === "Fotos" && <article className="content-editor">
          <h2>Fotos do site</h2><p>Informe uma URL pública de imagem. O campo vazio remove a foto daquela seção.</p>
          {gallery.map((image, index) => <div className="photo-editor-row" key={image.id}><label>{image.label}<input value={image.url} onChange={(event) => setGallery(gallery.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} placeholder="https://..." /></label>{image.url && <img src={image.url} alt={`Prévia: ${image.label}`} />}<div><button onClick={() => { if (index > 0) { const next = [...gallery]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setGallery(next); } }}>Mover para cima</button><button onClick={() => { if (index < gallery.length - 1) { const next = [...gallery]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; setGallery(next); } }}>Mover para baixo</button><button className="delete" onClick={() => setGallery(gallery.map((item, itemIndex) => itemIndex === index ? { ...item, url: "" } : item))}>Remover foto</button></div></div>)}
          <button className="button primary" onClick={() => setGallery([...gallery, { id: `photo-${Date.now()}`, label: "Nova foto", url: "" }])}>Adicionar foto</button><p className="admin-chart-note">Para substituir uma foto, cole a URL da nova imagem e salve. Alterações são salvas neste navegador.</p>
        </article>}
      </section>
      {guestEditor && <div className="modal-backdrop" onMouseDown={() => setGuestEditor(null)}><form className="admin-editor-modal" onSubmit={saveGuest} onMouseDown={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setGuestEditor(null)}>Fechar ×</button><h2>{guests.some((guest) => guest.id === guestEditor.id) ? "Editar convidado" : "Novo convidado"}</h2><label>Nome completo<input required value={guestEditor.name} onChange={(event) => setGuestEditor({ ...guestEditor, name: event.target.value })} /></label><label>Convite<select value={guestEditor.code} onChange={(event) => { const invite = invites.find((item) => item.code === event.target.value); setGuestEditor({ ...guestEditor, code: event.target.value, group: invite?.group || "" }); }}>{invites.map((invite) => <option key={invite.id} value={invite.code}>{invite.code} — {invite.group}</option>)}</select></label><label>Grupo familiar / titular<input required value={guestEditor.group} onChange={(event) => setGuestEditor({ ...guestEditor, group: event.target.value })} /></label><label>Status<select value={guestEditor.status} onChange={(event) => setGuestEditor({ ...guestEditor, status: event.target.value as AdminGuestStatus, responseDate: ["Pendente", "Cancelado"].includes(event.target.value) ? "" : new Date().toISOString().slice(0, 10) })}><option>Confirmado</option><option>Não irá</option><option>Pendente</option><option>Cancelado</option></select></label><label>Observação interna<textarea value={guestEditor.notes} onChange={(event) => setGuestEditor({ ...guestEditor, notes: event.target.value })} /></label><div className="form-actions"><button type="button" className="button ghost" onClick={() => setGuestEditor(null)}>Cancelar</button><button className="button primary">Salvar convidado</button></div></form></div>}
      {inviteEditor && <div className="modal-backdrop" onMouseDown={() => setInviteEditor(null)}><form className="admin-editor-modal" onSubmit={saveInvite} onMouseDown={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setInviteEditor(null)}>Fechar ×</button><h2>{invites.some((invite) => invite.id === inviteEditor.id) ? "Editar convite" : "Novo convite"}</h2><label>Código único<input required value={inviteEditor.code} onChange={(event) => setInviteEditor({ ...inviteEditor, code: event.target.value.toUpperCase().replace(/\s/g, "") })} /></label><label>Grupo familiar ou titular<input required value={inviteEditor.group} onChange={(event) => setInviteEditor({ ...inviteEditor, group: event.target.value })} /></label><div className="form-actions"><button type="button" className="button ghost" onClick={() => setInviteEditor(null)}>Cancelar</button><button className="button primary">Salvar convite</button></div></form></div>}
      {giftEditor && <div className="modal-backdrop" onMouseDown={() => setGiftEditor(null)}><form className="admin-editor-modal" onSubmit={saveGift} onMouseDown={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setGiftEditor(null)}>Fechar ×</button><h2>{adminGifts.some((gift) => gift.id === giftEditor.id) ? "Editar presente" : "Novo presente"}</h2><label>Nome<input required value={giftEditor.name} onChange={(event) => setGiftEditor({ ...giftEditor, name: event.target.value })} /></label><label>Descrição<textarea value={giftEditor.description || ""} onChange={(event) => setGiftEditor({ ...giftEditor, description: event.target.value })} /></label><label>Preço (R$)<input required type="number" min="0" step="0.01" value={giftEditor.price} onChange={(event) => setGiftEditor({ ...giftEditor, price: Number(event.target.value) })} /></label><label>Categoria<input required value={giftEditor.category} onChange={(event) => setGiftEditor({ ...giftEditor, category: event.target.value })} /></label><label>URL da imagem<input value={giftEditor.image} onChange={(event) => setGiftEditor({ ...giftEditor, image: event.target.value })} placeholder="https://..." /></label><label>Cotas disponíveis<input required type="number" min="0" value={giftEditor.available} onChange={(event) => setGiftEditor({ ...giftEditor, available: Number(event.target.value) })} /></label><label>Status<select value={giftEditor.status || "Disponível"} onChange={(event) => setGiftEditor({ ...giftEditor, status: event.target.value as AdminGift["status"] })}><option>Disponível</option><option>Indisponível</option></select></label><div className="form-actions"><button type="button" className="button ghost" onClick={() => setGiftEditor(null)}>Cancelar</button><button className="button primary">Salvar presente</button></div></form></div>}
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
        <button onClick={() => go("rsvp")}>Confirmar presença</button>
        <button onClick={() => go("gifts")}>Lista de presentes</button>
        <button onClick={() => go("info")}>Informações e localização</button>
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
