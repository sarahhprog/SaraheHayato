import { useEffect, useState } from "react";
import Admin from "./components/Admin";
import Gifts from "./components/Gifts";
import RSVP from "./components/RSVP";
import { getSiteText, useSiteContent } from "./lib/siteContent";

type Page = "home" | "rsvp" | "gifts" | "info" | "admin" | "payment-success" | "payment-pending" | "payment-failure";

const pagePaths: Record<Page, string> = {
  home: "/",
  rsvp: "/rsvp",
  gifts: "/presentes",
  info: "/informacoes",
  admin: "/admin",
  "payment-success": "/pagamento/sucesso",
  "payment-pending": "/pagamento/pendente",
  "payment-failure": "/pagamento/falha",
};

function pageFromPath(pathname: string): Page {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const page = Object.entries(pagePaths).find(([, path]) => path === normalizedPath)?.[0] as Page | undefined;
  return page ?? "home";
}

function Mark({ light = false }: { light?: boolean }) {
  return <div className={`mark ${light ? "mark-light" : ""}`}><span>S</span><i>&</i><span>H</span></div>;
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
  const { content } = useSiteContent();
  const [menuOpen, setMenuOpen] = useState(false);
  const links: [Page, string][] = [
    ["home", "nav_home"],
    ["rsvp", "nav_rsvp"],
    ["gifts", "nav_gifts"],
    ["info", "nav_info"],
  ];
  return (
    <header className="header">
      <button className="brand" onClick={() => go("home")} aria-label="Ir para o início"><Mark /></button>
      <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen}><span /><span /></button>
      <nav className={menuOpen ? "nav open" : "nav"} aria-label="Navegação principal">
        {links.map(([target, key]) => <button key={target} className={page === target ? "active" : ""} onClick={() => { go(target); setMenuOpen(false); }}>{getSiteText(content, key)}</button>)}
      </nav>
      <button className="header-rsvp" onClick={() => go("rsvp")}>{getSiteText(content, "nav_rsvp")}</button>
    </header>
  );
}

function Countdown() {
  const { content } = useSiteContent();
  const targetDate = getSiteText(content, "wedding_date_iso");
  const calculate = () => {
    const timestamp = new Date(targetDate).getTime();
    const difference = Number.isFinite(timestamp) ? Math.max(0, timestamp - Date.now()) : 0;
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
    return () => window.clearInterval(timer);
  }, [targetDate]);
  const labels = ["countdown_days", "countdown_hours", "countdown_minutes", "countdown_seconds"];
  return <div className="countdown">{Object.entries(time).map(([label, value], index) => <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{getSiteText(content, labels[index])}</span></div>)}</div>;
}

function Home({ go }: { go: (page: Page) => void }) {
  const { content } = useSiteContent();
  const text = (key: string) => getSiteText(content, key);
  return (
    <main>
      <section className="hero">
        <div className="hero-copy paper">
          <Botanical className="hero-leaf" />
          <p className="eyebrow">{text("home_eyebrow")}</p>
          <h1>{text("couple_name_one")} <em>&</em><br />{text("couple_name_two")}</h1>
          <div className="hero-rule"><span /></div>
          <p className="hero-date">{text("wedding_date")}</p>
          <p className="hero-place">{text("venue_name")} <i>—</i> {text("wedding_time")}</p>
          <button className="text-link" onClick={() => go("rsvp")}>{text("nav_rsvp")} <b>→</b></button>
        </div>
        <div className="hero-photo" style={{ backgroundImage: `url(${text("photo_couple")})` }}><span className="photo-credit">{text("photo_credit")}</span></div>
        <div className="hero-side"><span>{text("home_location")}</span></div>
      </section>
      <section className="date-section">
        <p className="script">{text("home_countdown_script")}</p>
        <h2>{text("home_countdown_title")}</h2>
        <Countdown />
        <p className="date-note">{text("home_countdown_description")}</p>
      </section>
      <section className="story-section">
        <div className="story-photo frame"><img src={text("photo_greenhouse")} alt="Sarah e Hayato juntos em uma celebração de fim de ano" /><span>01</span></div>
        <div className="story-copy">
          <p className="eyebrow">{text("story_section_title")}</p>
          <h2>{text("story_title")}</h2>
          {text("story_text").split("\n").filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <div className="signature">{text("couple_name_one")} & {text("couple_name_two")}</div>
        </div>
      </section>
      <section className="proposal-section">
        <Botanical className="proposal-leaf" />
        <div className="proposal-copy"><p className="eyebrow light">{text("proposal_eyebrow")}</p><h2>{text("proposal_title")}</h2><p>{text("proposal_text")}</p><p className="location">{text("proposal_location")}</p></div>
        <div className="proposal-image"><img src={text("photo_garden")} alt="Ilustração do jardim botânico Hortus Botanicus em Amsterdam" /></div>
      </section>
      <section className="invitation"><p className="script">{text("home_invitation_eyebrow")}</p><h2>{text("home_invitation_title")}</h2><button className="button primary" onClick={() => go("rsvp")}>{text("nav_rsvp")}</button></section>
    </main>
  );
}

function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <section className="page-intro paper"><Botanical /><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></section>;
}

function Info() {
  const { content } = useSiteContent();
  const text = (key: string) => getSiteText(content, key);
  const [open, setOpen] = useState(0);
  const faqs = [1, 2, 3].map((number) => [text(`faq_${number}_title`), text(`faq_${number}_text`)]);
  return (
    <main>
      <PageIntro eyebrow={text("info_eyebrow")} title={text("info_title")} text={text("info_intro")} />
      <section className="venue">
        <div className="venue-image"><img src={text("photo_table")} alt="Celebração de casamento ao ar livre" /></div>
        <div className="venue-copy">
          <p className="eyebrow">{text("venue_eyebrow")}</p>
          <h2>{text("venue_name")}</h2>
          <p className="big-date">{text("wedding_date_long")}<br />{text("venue_time_prefix")} {text("wedding_time")}</p>
          <p>{text("venue_address")}</p>
          <a className="button primary" href={text("venue_map_url")} target="_blank" rel="noreferrer">{text("venue_map_label")}</a>
        </div>
      </section>
      <section className="details-grid">
        <article className="dress-card">
          <p className="eyebrow light">{text("dress_eyebrow")}</p><h2>{text("dress_title")}</h2><p>{text("dress_text")}</p>
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
          <small>{text("dress_note")}</small>
        </article>
        <div className="tips"><p className="eyebrow">{text("faq_title")}</p>{faqs.map(([title, answer], index) => <div className={open === index ? "tip open" : "tip"} key={title}><button onClick={() => setOpen(index)}><span>0{index + 1}</span>{title}<b>+</b></button><p>{answer}</p></div>)}</div>
      </section>
      <section className="wedding-party">
        <p className="script">{text("wedding_party_eyebrow")}</p><h2>{text("wedding_party_title")}</h2><p>{text("wedding_party_text")}</p>
        <div className="party-cards">
          <div><h3>{text("bridesmaids_title")}</h3><p>{text("bridesmaids_text")}</p><div className="attire-swatches" aria-label="Tons de verde para madrinhas"><span style={{ backgroundColor: "#54765B" }} /><span style={{ backgroundColor: "#78946D" }} /><span style={{ backgroundColor: "#A5AE79" }} /><b>Verde-médio a oliva claro</b></div></div>
          <div><h3>{text("groomsmen_title")}</h3><p>{text("groomsmen_text")}</p><div className="attire-swatches" aria-label="Cinza-escuro para padrinhos"><span style={{ backgroundColor: "#454A49" }} /><b>Cinza-escuro</b></div></div>
        </div>
      </section>
    </main>
  );
}

function Footer({ go }: { go: (page: Page) => void }) {
  const { content } = useSiteContent();
  const text = (key: string) => getSiteText(content, key);
  return (
    <footer>
      <Botanical /><Mark light />
      <p className="footer-names">{text("footer_names")}</p>
      <p>{text("footer_date_place")}</p>
      <div className="footer-links">
        <button onClick={() => go("home")}>{text("nav_home")}</button>
        <button onClick={() => go("rsvp")}>{text("nav_rsvp")}</button>
        <button onClick={() => go("gifts")}>{text("nav_gifts")}</button>
        <button onClick={() => go("info")}>{text("nav_info")}</button>
      </div>
      <button className="admin-link" onClick={() => go("admin")}>{text("footer_admin_label")}</button>
    </footer>
  );
}

function PaymentReturn({ page, go }: { page: Page; go: (page: Page) => void }) {
  // The return page is informational; only the signed webhook can confirm a purchase.
  const [payerName] = useState(() => {
    const savedName = sessionStorage.getItem("gift-payment-payer-name") || "";
    sessionStorage.removeItem("gift-payment-payer-name");
    return savedName;
  });
  const isSuccess = page === "payment-success";
  const isPending = page === "payment-pending";
  const title = isSuccess
    ? `Obrigado${payerName ? `, ${payerName}` : ""}!`
    : isPending
      ? "Pagamento pendente"
      : "Não foi possível concluir o pagamento";
  const message = isSuccess
    ? "Seu carinho significa muito para nós. A confirmação do pagamento acontece após a validação do Mercado Pago pelo nosso servidor."
    : isPending
      ? "O Mercado Pago ainda está processando o pagamento. O presente continuará disponível até a confirmação do servidor."
      : "O pagamento não foi aprovado. Você pode voltar à lista e tentar novamente.";

  return (
    <main>
      <section className="payment-return paper">
        <p className="script">{isSuccess ? "com carinho" : isPending ? "um instante" : "não desanime"}</p>
        <p className="eyebrow">Sarah & Hayato</p>
        <h1>{title}</h1>
        <p>{message}</p>
        <button className="button primary" onClick={() => go("gifts")}>
          {isSuccess ? "Voltar ao site" : isPending ? "Ver a lista de presentes" : "Tentar novamente"}
        </button>
      </section>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>(() => pageFromPath(window.location.pathname));
  const go = (next: Page) => {
    if (window.location.pathname !== pagePaths[next]) {
      window.history.pushState({ page: next }, "", pagePaths[next]);
    }
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    const handlePopState = () => {
      setPage(pageFromPath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const pages = {
    home: <Home go={go} />,
    rsvp: <RSVP />,
    gifts: <Gifts />,
    info: <Info />,
    admin: <Admin />,
    "payment-success": <PaymentReturn page="payment-success" go={go} />,
    "payment-pending": <PaymentReturn page="payment-pending" go={go} />,
    "payment-failure": <PaymentReturn page="payment-failure" go={go} />,
  };
  return <div className="app">{page !== "admin" && <Header page={page} go={go} />}{pages[page]}{page !== "admin" && <Footer go={go} />}</div>;
}
