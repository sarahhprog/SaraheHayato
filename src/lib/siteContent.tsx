import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";

export const defaultSiteContent: Record<string, string> = {
  site_title: "Sarah & Hayato — Casamento",
  couple_name_one: "Sarah",
  couple_name_two: "Hayato",
  wedding_date: "24 · 07 · 2027",
  wedding_date_long: "24 de julho de 2027",
  wedding_date_iso: "2027-07-24T15:00:00-03:00",
  wedding_time: "15 horas",
  venue_name: "Espaço Bodocó",
  venue_address: "Estrada Municipal do Campo Verde, 420 — São Paulo — SP",
  venue_map_url: "https://www.google.com/maps/search/?api=1&query=Espa%C3%A7o+Bodoc%C3%B3+S%C3%A3o+Paulo",
  nav_home: "Nossa história",
  nav_rsvp: "Confirmar presença",
  nav_gifts: "Lista de presentes",
  nav_info: "Informações e localização",
  home_eyebrow: "O casamento de",
  home_location: "São Paulo · Brasil",
  photo_credit: "Sarah & Hayato · Amsterdam",
  home_countdown_script: "contando os dias",
  home_countdown_title: "Até o nosso para sempre",
  home_countdown_description: "Uma tarde entre jardins, música e todas as pessoas que fazem parte da nossa história.",
  countdown_days: "dias",
  countdown_hours: "horas",
  countdown_minutes: "minutos",
  countdown_seconds: "segundos",
  story_section_title: "Nossa história",
  story_title: "Do acaso, floresceu o amor.",
  story_text: "Nos encontramos em uma tarde que parecia comum. Entre conversas longas, cafés sem pressa e viagens improvisadas, descobrimos um no outro um lugar para chamar de casa.\n\nSete anos depois, seguimos escolhendo dividir o cotidiano, os sonhos e a vontade de conhecer o mundo — sempre juntos.",
  proposal_eyebrow: "O pedido",
  proposal_title: "Amsterdam, entre folhas e promessas",
  proposal_text: "Foi no silêncio verde do Hortus Botanicus, em Amsterdam, que Hayato fez a pergunta. Sob a luz atravessando o teto de vidro, Sarah disse sim — e o jardim inteiro pareceu celebrar.",
  proposal_location: "Hortus Botanicus · 18.09.2025",
  home_invitation_eyebrow: "celebre conosco",
  home_invitation_title: "Será ainda mais bonito ter você por perto.",
  rsvp_eyebrow: "Répondez s’il vous plaît",
  rsvp_title: "Confirme sua presença",
  rsvp_intro: "Sua resposta nos ajuda a preparar cada detalhe com todo o carinho.",
  rsvp_name_label: "Nome completo",
  rsvp_name_placeholder: "Digite seu nome completo",
  rsvp_name_error: "Informe seu nome completo com 2 a 100 caracteres.",
  rsvp_unavailable: "O formulário está temporariamente indisponível. Tente novamente mais tarde.",
  rsvp_send_error: "Não foi possível enviar sua resposta. Verifique a conexão e tente novamente.",
  rsvp_yes_button: "Vou comparecer",
  rsvp_no_button: "Não poderei ir",
  rsvp_duplicate_question: "Já recebemos uma resposta com esse nome. Deseja atualizar a resposta?",
  rsvp_duplicate_identity_note: "A confirmação é feita apenas pelo nome. Em caso de dúvida, fale com os noivos.",
  rsvp_success_yes_title: "Presença confirmada!",
  rsvp_success_yes_text: "Que alegria! Agradecemos por confirmar. Mal podemos esperar para celebrar com você.",
  rsvp_success_no_title: "Resposta recebida",
  rsvp_success_no_text: "Agradecemos por nos avisar. Sentiremos sua falta e enviaremos muito carinho.",
  gifts_eyebrow: "Lista de presentes",
  gifts_title: "Um gesto de carinho",
  gifts_intro: "Sua presença é o nosso maior presente. Se desejar nos presentear, reunimos algumas ideias para a nossa nova história.",
  gifts_description: "Uma contribuição simbólica para criarmos novas memórias juntos.",
  gift_button: "Presentear",
  gift_modal_title: "Lista de presentes",
  gift_modal_text: "O site não processa pagamentos nem registra compras. Entre em contato com os noivos para combinar um presente.",
  gift_modal_close: "Entendi",
  gift_1_name: "Jantar sob as estrelas",
  gift_1_category: "Experiências",
  gift_1_price: "420",
  gift_1_description: "Uma noite especial para celebrar nossa nova vida.",
  gift_2_name: "Passeio pelos canais",
  gift_2_category: "Lua de mel",
  gift_2_price: "680",
  gift_2_description: "Uma experiência inesquecível durante a lua de mel.",
  gift_3_name: "Conjunto de taças de cristal",
  gift_3_category: "Novo lar",
  gift_3_price: "350",
  gift_3_description: "Para brindar os momentos especiais em nosso lar.",
  gift_4_name: "Café da manhã em Paris",
  gift_4_category: "Lua de mel",
  gift_4_price: "290",
  gift_4_description: "Um café da manhã charmoso na viagem dos nossos sonhos.",
  gift_5_name: "Jardim para nossa varanda",
  gift_5_category: "Novo lar",
  gift_5_price: "180",
  gift_5_description: "Um cantinho verde para nossa casa.",
  gift_6_name: "Brinde dos recém-casados",
  gift_6_category: "Celebração",
  gift_6_price: "240",
  gift_6_description: "Um brinde ao começo da nossa vida juntos.",
  info_eyebrow: "Para o grande dia",
  info_title: "Informações e localização",
  info_intro: "Tudo o que você precisa saber para viver esta tarde conosco.",
  venue_eyebrow: "Cerimônia & recepção",
  venue_time_prefix: "às",
  venue_map_label: "Abrir no mapa",
  dress_eyebrow: "Dress code",
  dress_title: "Passeio completo",
  dress_text: "Elegante, confortável e com personalidade. Madrinhas em tons de verde e padrinhos em terno cinza-escuro.",
  dress_note: "Pedimos gentilmente que evitem branco e off-white, reservados para momentos especiais da cerimônia.",
  faq_title: "Antes de sair de casa",
  faq_1_title: "Chegada",
  faq_1_text: "Sugerimos chegar às 14h30. A cerimônia começará pontualmente às 15h.",
  faq_2_title: "Estacionamento",
  faq_2_text: "O espaço possui estacionamento gratuito e equipe de manobristas.",
  faq_3_title: "Clima",
  faq_3_text: "Julho pode ser fresco ao entardecer. Considere levar um xale ou paletó.",
  wedding_party_eyebrow: "para pessoas especiais",
  wedding_party_title: "Padrinhos & madrinhas",
  wedding_party_text: "Vocês fazem parte da nossa história e estarão ao nosso lado neste dia. Preparamos orientações de cores para uma composição harmônica.",
  bridesmaids_title: "Madrinhas",
  bridesmaids_text: "Vestidos longos em tons de verde, do verde-médio ao oliva claro.",
  groomsmen_title: "Padrinhos",
  groomsmen_text: "Terno cinza-escuro, camisa branca e gravata.",
  footer_names: "Sarah & Hayato",
  footer_date_place: "24 de julho de 2027 · Espaço Bodocó",
  footer_admin_label: "Acesso administrativo",
  footer_admin_back: "Voltar ao site",
  photo_couple: "/images/fotocapa.jpeg",
  photo_greenhouse: "/images/fotodevermelho.jpeg",
  photo_garden: "/images/fotoamsterdam.jpeg",
  photo_table: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
  gift_1_image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
  gift_2_image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=900&q=85",
  gift_3_image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85",
  gift_4_image: "https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=900&q=85",
  gift_5_image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85",
  gift_6_image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=85",
};

type SiteContentValue = {
  content: Record<string, string>;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  save: (values: Record<string, string>) => Promise<void>;
};

const SiteContentContext = createContext<SiteContentValue | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para carregar o conteúdo.");
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase.from("site_content").select("key,value");
    if (queryError) {
      setError(queryError.message);
    } else {
      setValues(Object.fromEntries((data ?? []).map(({ key, value }) => [key, value ?? ""])));
      setError("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async (nextValues: Record<string, string>) => {
    if (!supabase) throw new Error("Supabase não está configurado.");
    const rows = Object.entries(nextValues).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));
    const { error: saveError } = await supabase.from("site_content").upsert(rows, { onConflict: "key" });
    if (saveError) throw saveError;
    setValues((current) => ({ ...current, ...nextValues }));
    setError("");
  }, []);

  const value = useMemo(
    () => ({ content: { ...defaultSiteContent, ...values }, loading, error, refresh, save }),
    [values, loading, error, refresh, save],
  );
  useEffect(() => {
    document.title = value.content.site_title || defaultSiteContent.site_title;
  }, [value.content.site_title]);
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) throw new Error("useSiteContent precisa estar dentro de SiteContentProvider.");
  return context;
}

export function getSiteText(content: Record<string, string>, key: string) {
  const saved = content[key]?.trim();
  return saved || defaultSiteContent[key] || "";
}
