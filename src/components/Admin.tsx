import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultSiteContent, useSiteContent } from "../lib/siteContent";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type GuestStatus = "confirmado" | "nao_vai" | null;
type Guest = {
  id: string;
  name: string;
  status: GuestStatus;
  created_at: string;
  updated_at: string;
};
type AdminGift = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  status: "available" | "unavailable";
};
type GiftPurchase = {
  id: string;
  gift_id: string;
  payer_name: string;
  message: string;
  amount_paid: number;
  mp_payment_id: string;
  purchased_at: string;
};
type GiftPaymentAttempt = {
  id: string;
  gift_id: string;
  payer_name: string;
  message: string;
  amount: number;
  status: string;
  mp_payment_id: string | null;
  created_at: string;
};
type GiftDraft = {
  name: string;
  description: string;
  image_url: string;
  price: string;
};

const contentSections = [
  {
    title: "Título, casal, data e navegação",
    keys: ["site_title", "couple_name_one", "couple_name_two", "wedding_date", "wedding_date_long", "wedding_date_iso", "wedding_time", "venue_name", "venue_address", "venue_map_url", "nav_home", "nav_rsvp", "nav_gifts", "nav_info"],
  },
  {
    title: "Página inicial e história",
    keys: ["home_eyebrow", "home_location", "photo_credit", "home_countdown_script", "home_countdown_title", "home_countdown_description", "countdown_days", "countdown_hours", "countdown_minutes", "countdown_seconds", "story_section_title", "story_title", "story_text", "proposal_eyebrow", "proposal_title", "proposal_text", "proposal_location", "home_invitation_eyebrow", "home_invitation_title"],
  },
  {
    title: "Confirmação de presença",
    keys: ["rsvp_eyebrow", "rsvp_title", "rsvp_intro", "rsvp_name_label", "rsvp_name_placeholder", "rsvp_name_error", "rsvp_unavailable", "rsvp_send_error", "rsvp_yes_button", "rsvp_no_button", "rsvp_duplicate_question", "rsvp_duplicate_identity_note", "rsvp_success_yes_title", "rsvp_success_yes_text", "rsvp_success_no_title", "rsvp_success_no_text"],
  },
  {
    title: "Lista de presentes",
    keys: ["gifts_eyebrow", "gifts_title", "gifts_intro"],
  },
  {
    title: "Informações, trajes e perguntas frequentes",
    keys: ["info_eyebrow", "info_title", "info_intro", "venue_eyebrow", "venue_time_prefix", "venue_map_label", "dress_eyebrow", "dress_title", "dress_text", "dress_note", "faq_title", "faq_1_title", "faq_1_text", "faq_2_title", "faq_2_text", "faq_3_title", "faq_3_text", "wedding_party_eyebrow", "wedding_party_title", "wedding_party_text", "bridesmaids_title", "bridesmaids_text", "groomsmen_title", "groomsmen_text"],
  },
  { title: "Rodapé", keys: ["footer_names", "footer_date_place", "footer_admin_label", "footer_admin_back"] },
];

const fieldLabels: Record<string, string> = {
  couple_name_one: "Nome (noiva/noivo 1)",
  couple_name_two: "Nome (noiva/noivo 2)",
  wedding_date: "Data curta",
  wedding_date_long: "Data por extenso",
  wedding_time: "Horário",
  venue_name: "Local",
  venue_address: "Endereço",
  venue_map_url: "Link do mapa",
  home_countdown_script: "Texto sobre o contador",
  home_countdown_title: "Título do contador",
  home_countdown_description: "Descrição do contador",
  story_section_title: "Título da seção",
  story_title: "Título da história",
  story_text: "Texto da história",
  proposal_text: "Texto do pedido",
  home_invitation_title: "Chamada para confirmar presença",
  gifts_intro: "Introdução dos presentes",
  info_intro: "Introdução das informações",
  dress_text: "Orientação de trajes",
  dress_note: "Observação sobre trajes",
  footer_date_place: "Data e local no rodapé",
};

function labelFor(key: string) {
  return fieldLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStatus(status: GuestStatus) {
  if (status === "confirmado") return "Confirmado";
  if (status === "nao_vai") return "Não vai";
  return "Sem resposta";
}

function giftStatusLabel(status: AdminGift["status"]) {
  return status === "available" ? "Disponível" : "Indisponível";
}

function paymentAttemptLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    in_process: "Em processamento",
    approved: "Aprovado",
    rejected: "Recusado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    charged_back: "Contestação",
    duplicate_refund_required: "Duplicado — precisa de reembolso",
    amount_mismatch: "Valor divergente — verificar",
    preference_failed: "Falha ao criar pagamento",
    other: "Outro status",
  };
  return labels[status] || status;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Não foi possível preparar a imagem."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível comprimir a imagem."))),
        "image/jpeg",
        0.84,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("O arquivo selecionado não pôde ser lido como imagem."));
    };
    image.src = objectUrl;
  });
}

export default function Admin() {
  const { content, refresh: refreshContent, save: saveContent } = useSiteContent();
  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState("Visão geral");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newName, setNewName] = useState("");
  const [draftContent, setDraftContent] = useState<Record<string, string>>({});
  const [photoDrafts, setPhotoDrafts] = useState<Record<string, { file?: File; preview?: string; remove?: boolean }>>({});
  const [adminGifts, setAdminGifts] = useState<AdminGift[]>([]);
  const [giftPurchases, setGiftPurchases] = useState<GiftPurchase[]>([]);
  const [giftAttempts, setGiftAttempts] = useState<GiftPaymentAttempt[]>([]);
  const [giftDataLoading, setGiftDataLoading] = useState(false);
  const [giftError, setGiftError] = useState("");
  const [giftDraft, setGiftDraft] = useState<GiftDraft>({ name: "", description: "", image_url: "", price: "" });
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);

  const fetchGuests = useCallback(async () => {
    if (!supabase) return;
    setGuestLoading(true);
    const { data, error } = await supabase.from("guests").select("id,name,status,created_at,updated_at").order("created_at", { ascending: false });
    if (error) setGuestError(error.message);
    else {
      setGuests(data as Guest[]);
      setGuestError("");
    }
    setGuestLoading(false);
  }, []);

  const fetchGiftData = useCallback(async () => {
    if (!supabase) return;
    setGiftDataLoading(true);
    const [giftsResult, purchasesResult, attemptsResult] = await Promise.all([
      supabase.from("gifts").select("id,name,description,image_url,price,status").order("name"),
      supabase.from("gift_purchases").select("id,gift_id,payer_name,message,amount_paid,mp_payment_id,purchased_at").order("purchased_at", { ascending: false }),
      supabase.from("gift_payment_attempts").select("id,gift_id,payer_name,message,amount,status,mp_payment_id,created_at").order("created_at", { ascending: false }),
    ]);

    const firstError = giftsResult.error || purchasesResult.error || attemptsResult.error;
    if (firstError) {
      setGiftError(`Não foi possível carregar os dados dos presentes: ${firstError.message}`);
    } else {
      setAdminGifts((giftsResult.data ?? []) as AdminGift[]);
      setGiftPurchases((purchasesResult.data ?? []) as GiftPurchase[]);
      setGiftAttempts((attemptsResult.data ?? []) as GiftPaymentAttempt[]);
      setGiftError("");
    }
    setGiftDataLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setSessionReady(true);
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError(error.message);
      const user = data.session?.user;
      if (user?.app_metadata.role === "admin") setUserEmail(user.email || "");
      else if (user) setAuthError("Esta conta não tem permissão de administração.");
      setSessionReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user?.app_metadata.role === "admin") {
        setUserEmail(user.email || "");
        setAuthError("");
      } else {
        setUserEmail("");
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userEmail) {
      void fetchGuests();
      void fetchGiftData();
    }
  }, [userEmail, fetchGuests, fetchGiftData]);

  useEffect(() => {
    setDraftContent(content);
  }, [content]);

  useEffect(() => () => {
    Object.values(photoDrafts).forEach((photo) => {
      if (photo.preview) URL.revokeObjectURL(photo.preview);
    });
  }, [photoDrafts]);

  const filteredGuests = useMemo(
    () => guests.filter((guest) => {
      const matchesName = guest.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"));
      const matchesStatus = statusFilter === "Todos" || formatStatus(guest.status) === statusFilter;
      return matchesName && matchesStatus;
    }),
    [guests, search, statusFilter],
  );
  const responseCount = guests.filter((guest) => guest.status !== null).length;
  const confirmedCount = guests.filter((guest) => guest.status === "confirmado").length;
  const declinedCount = guests.filter((guest) => guest.status === "nao_vai").length;
  const totalGiftAmount = giftPurchases.reduce((total, purchase) => total + Number(purchase.amount_paid), 0);
  const pendingGiftAttempts = giftAttempts.filter((attempt) => ["pending", "in_process"].includes(attempt.status));
  const flaggedGiftAttempts = giftAttempts.filter((attempt) => ["duplicate_refund_required", "amount_mismatch"].includes(attempt.status));

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError("Não foi possível entrar. Confira o e-mail, a senha e a permissão de admin.");
    } else if (data.user.app_metadata.role !== "admin") {
      await supabase.auth.signOut();
      setAuthError("Esta conta não tem permissão de administração.");
    } else {
      setUserEmail(data.user.email || "");
      setPassword("");
    }
    setBusy(false);
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setNotice(`Erro ao sair: ${error.message}`);
    else {
      setUserEmail("");
      setGuests([]);
      setAdminGifts([]);
      setGiftPurchases([]);
      setGiftAttempts([]);
      setNotice("");
    }
  };

  const updateGuest = async (guest: Guest, patch: Partial<Pick<Guest, "name" | "status">>) => {
    if (!supabase) return;
    const cleanName = patch.name?.trim().replace(/\s+/g, " ");
    if (cleanName !== undefined && (Array.from(cleanName).length < 2 || Array.from(cleanName).length > 100)) {
      setGuestError("O nome deve ter de 2 a 100 caracteres.");
      return;
    }
    const { data, error } = await supabase.from("guests").update({ ...patch, ...(cleanName ? { name: cleanName } : {}) }).eq("id", guest.id).select("id,name,status,created_at,updated_at").single();
    if (error) setGuestError(`Não foi possível atualizar o convidado: ${error.message}`);
    else {
      setGuests((current) => current.map((item) => item.id === guest.id ? data as Guest : item));
      setEditingId(null);
      setNotice("Convidado atualizado com sucesso.");
      setGuestError("");
    }
  };

  const addGuest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const cleanName = newName.trim().replace(/\s+/g, " ");
    const length = Array.from(cleanName).length;
    if (length < 2 || length > 100) {
      setGuestError("O nome deve ter de 2 a 100 caracteres.");
      return;
    }
    const { data, error } = await supabase.from("guests").insert({ name: cleanName, status: null }).select("id,name,status,created_at,updated_at").single();
    if (error) setGuestError(`Não foi possível adicionar o convidado: ${error.message}`);
    else {
      setGuests((current) => [data as Guest, ...current]);
      setNewName("");
      setGuestError("");
      setNotice("Convidado adicionado com sucesso.");
    }
  };

  const deleteGuest = async (guest: Guest) => {
    if (!supabase || !window.confirm(`Excluir a resposta de ${guest.name}? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("guests").delete().eq("id", guest.id);
    if (error) setGuestError(`Não foi possível excluir o convidado: ${error.message}`);
    else {
      setGuests((current) => current.filter((item) => item.id !== guest.id));
      setNotice("Convidado excluído.");
    }
  };

  const saveGift = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const name = giftDraft.name.trim().replace(/\s+/g, " ");
    const description = giftDraft.description.trim();
    const imageUrl = giftDraft.image_url.trim();
    const priceValue = Number(giftDraft.price.replace(",", "."));
    if (Array.from(name).length < 2 || Array.from(name).length > 120) {
      setGiftError("O nome do presente deve ter de 2 a 120 caracteres.");
      return;
    }
    if (description.length < 1 || description.length > 500) {
      setGiftError("A descrição deve ter até 500 caracteres.");
      return;
    }
    if (!imageUrl) {
      setGiftError("Informe a URL da imagem do presente.");
      return;
    }
    try {
      const parsedImageUrl = new URL(imageUrl, window.location.origin);
      if (!["http:", "https:"].includes(parsedImageUrl.protocol)) {
        setGiftError("Use uma imagem com endereço HTTP ou HTTPS.");
        return;
      }
    } catch {
      setGiftError("Informe uma URL de imagem válida.");
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue <= 0 || !/^\d+(?:[.,]\d{1,2})?$/.test(giftDraft.price.trim())) {
      setGiftError("Informe um valor positivo com até duas casas decimais.");
      return;
    }

    setBusy(true);
    setGiftError("");
    const values = { name, description, image_url: imageUrl, price: priceValue };
    const result = editingGiftId
      ? await supabase.from("gifts").update(values).eq("id", editingGiftId)
      : await supabase.from("gifts").insert(values);
    if (result.error) {
      setGiftError(`Não foi possível salvar o presente: ${result.error.message}`);
    } else {
      setGiftDraft({ name: "", description: "", image_url: "", price: "" });
      setEditingGiftId(null);
      setNotice(editingGiftId ? "Presente atualizado." : "Presente criado.");
      await fetchGiftData();
    }
    setBusy(false);
  };

  const editGift = (gift: AdminGift) => {
    setEditingGiftId(gift.id);
    setGiftDraft({
      name: gift.name,
      description: gift.description,
      image_url: gift.image_url,
      price: String(gift.price),
    });
    setGiftError("");
  };

  const deleteGift = async (gift: AdminGift) => {
    if (!supabase || !window.confirm(`Apagar "${gift.name}"? Presentes com compra ou tentativa vinculada não podem ser apagados.`)) return;
    const { error } = await supabase.from("gifts").delete().eq("id", gift.id);
    if (error) {
      setGiftError(`Não foi possível apagar o presente. Compras ou tentativas vinculadas impedem a exclusão. ${error.message}`);
    } else {
      setNotice("Presente apagado.");
      await fetchGiftData();
    }
  };

  const saveTextContent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await saveContent(draftContent);
      setNotice("Salvo com sucesso.");
    } catch (error) {
      setNotice(`Erro ao salvar conteúdo: ${error instanceof Error ? error.message : "falha inesperada."}`);
    } finally {
      setBusy(false);
    }
  };

  const selectPhoto = (key: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setNotice("A imagem deve ter no máximo 8 MB.");
      return;
    }
    setPhotoDrafts((current) => {
      const oldPreview = current[key]?.preview;
      if (oldPreview) URL.revokeObjectURL(oldPreview);
      return { ...current, [key]: { file, preview: URL.createObjectURL(file) } };
    });
    setNotice("");
  };

  const savePhoto = async (key: string) => {
    if (!supabase) return;
    const draft = photoDrafts[key];
    setBusy(true);
    try {
      let value = "";
      if (draft?.file) {
        const compressed = await compressImage(draft.file);
        const path = `site/${key}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("site-images").upload(path, compressed, { contentType: "image/jpeg", upsert: false });
        if (uploadError) throw uploadError;
        value = supabase.storage.from("site-images").getPublicUrl(path).data.publicUrl;
      }
      await saveContent({ [key]: value });
      setPhotoDrafts((current) => {
        const preview = current[key]?.preview;
        if (preview) URL.revokeObjectURL(preview);
        return { ...current, [key]: {} };
      });
      setNotice("Salvo com sucesso.");
    } catch (error) {
      setNotice(`Erro ao salvar foto: ${error instanceof Error ? error.message : "falha inesperada."}`);
    } finally {
      setBusy(false);
    }
  };

  if (!sessionReady) return <main className="admin-login"><p>Verificando sessão…</p></main>;
  if (!userEmail) {
    return (
      <main className="admin-login">
        <div className="login-art"><span>Área reservada aos noivos</span></div>
        <form onSubmit={signIn}>
          <a className="back-site" href="/">← Voltar ao site</a>
          <p className="eyebrow">Administração</p>
          <h1>Acesso dos noivos</h1>
          <p>Entre com o e-mail e a senha cadastrados no Supabase Auth.</p>
          <label htmlFor="admin-email">E-mail</label>
          <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="admin-password">Senha</label>
          <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          {authError && <p className="form-error" role="alert">{authError}</p>}
          {!isSupabaseConfigured && <p className="form-error" role="alert">Configure as variáveis públicas do Supabase para habilitar o login.</p>}
          <button className="button primary full" disabled={busy || !isSupabaseConfigured}>{busy ? "Entrando…" : "Entrar"}</button>
        </form>
      </main>
    );
  }

  const tabs = ["Visão geral", "Convidados", "Presentes", "Conteúdo", "Fotos"];
  const photoFields = [
    ["photo_couple", "Foto principal"],
    ["photo_greenhouse", "Foto da história"],
    ["photo_garden", "Foto do pedido"],
    ["photo_table", "Foto da celebração"],
  ];

  return (
    <main className="dashboard">
      <aside>
        <div className="mark mark-light"><span>S</span><i>&</i><span>H</span></div>
        <nav>{tabs.map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}<span>›</span></button>)}</nav>
        <p className="admin-user-email">{userEmail}</p>
        <button className="logout" onClick={() => void signOut()}>Sair</button>
      </aside>
      <section className="dash-main">
        <header><div><p className="eyebrow">Área administrativa</p><h1>{tab}</h1></div></header>
        {notice && <p className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")}>Fechar</button></p>}
        {tab === "Visão geral" && <div className="metric-grid">
          {[["Total de respostas", responseCount], ["Confirmados", confirmedCount], ["Não vão", declinedCount], ["Sem resposta", guests.length - responseCount]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>Dados atualizados do banco</small></article>)}
          <button className="button primary" onClick={() => { setTab("Convidados"); void fetchGuests(); }}>Abrir lista de convidados</button>
        </div>}
        {tab === "Convidados" && <article className="admin-table">
          <div className="guest-admin-counts">{[["Respostas", responseCount], ["Confirmados", confirmedCount], ["Não vão", declinedCount]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
          <div className="section-heading"><div><h2>Respostas de presença</h2><p>Os dados desta lista são visíveis apenas para admin autenticado.</p></div></div>
          <form className="guest-add-form" onSubmit={addGuest}><label htmlFor="new-guest-name">Adicionar convidado</label><input id="new-guest-name" minLength={2} maxLength={100} required value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Nome completo" /><button className="button primary">Adicionar</button></form>
          <div className="table-tools"><input aria-label="Buscar por nome" placeholder="Buscar por nome" value={search} onChange={(event) => setSearch(event.target.value)} /><label className="sort-control">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todos</option><option>Confirmado</option><option>Não vai</option><option>Sem resposta</option></select></label></div>
          {guestError && <p className="form-error" role="alert">{guestError}</p>}
          {guestLoading ? <p>Carregando convidados…</p> : <div className="table-scroll"><table><thead><tr><th>Nome</th><th>Status</th><th>Data/hora da resposta</th><th>Ações</th></tr></thead><tbody>{filteredGuests.map((guest) => <tr key={guest.id}><td>{editingId === guest.id ? <input aria-label={`Editar nome de ${guest.name}`} value={editingName} onChange={(event) => setEditingName(event.target.value)} /> : guest.name}</td><td><select aria-label={`Status de ${guest.name}`} className={`status-select status-${guest.status || "pending"}`} value={guest.status || ""} onChange={(event) => void updateGuest(guest, { status: (event.target.value || null) as GuestStatus })}><option value="">Sem resposta</option><option value="confirmado">Confirmado</option><option value="nao_vai">Não vai</option></select></td><td>{guest.status ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(guest.updated_at)) : "—"}</td><td className="table-actions">{editingId === guest.id ? <><button onClick={() => void updateGuest(guest, { name: editingName })}>Salvar</button><button onClick={() => setEditingId(null)}>Cancelar</button></> : <button onClick={() => { setEditingId(guest.id); setEditingName(guest.name); }}>Editar nome</button>}<button className="delete" onClick={() => void deleteGuest(guest)}>Excluir</button></td></tr>)}</tbody></table>{filteredGuests.length === 0 && <p>Nenhum convidado encontrado.</p>}</div>}
        </article>}
        {tab === "Presentes" && <section className="gift-admin">
          <div className="gift-admin-summary">
            <article><span>Total arrecadado</span><strong>{formatCurrency(totalGiftAmount)}</strong></article>
            <article><span>Compras confirmadas</span><strong>{giftPurchases.length}</strong></article>
            <article><span>Pagamentos pendentes</span><strong>{pendingGiftAttempts.length}</strong></article>
            <article className={flaggedGiftAttempts.length ? "needs-attention" : ""}><span>Pagamentos a revisar</span><strong>{flaggedGiftAttempts.length}</strong></article>
          </div>
          <article className="admin-table">
            <div className="section-heading">
              <div><h2>{editingGiftId ? "Editar presente" : "Adicionar presente"}</h2><p>O status é alterado exclusivamente após confirmação do pagamento pelo servidor.</p></div>
            </div>
            <form className="admin-gift-form" onSubmit={(event) => void saveGift(event)}>
              <label htmlFor="gift-name">Nome<input id="gift-name" required minLength={2} maxLength={120} value={giftDraft.name} onChange={(event) => setGiftDraft((current) => ({ ...current, name: event.target.value }))} /></label>
              <label htmlFor="gift-description">Descrição curta<textarea id="gift-description" required maxLength={500} rows={2} value={giftDraft.description} onChange={(event) => setGiftDraft((current) => ({ ...current, description: event.target.value }))} /></label>
              <label htmlFor="gift-image-url">URL da imagem<input id="gift-image-url" required value={giftDraft.image_url} onChange={(event) => setGiftDraft((current) => ({ ...current, image_url: event.target.value }))} /></label>
              <label htmlFor="gift-price">Valor em R$<input id="gift-price" required inputMode="decimal" placeholder="120,00" value={giftDraft.price} onChange={(event) => setGiftDraft((current) => ({ ...current, price: event.target.value }))} /></label>
              {giftError && <p className="form-error" role="alert">{giftError}</p>}
              <div className="admin-gift-form-actions">
                <button className="button primary" disabled={busy}>{busy ? "Salvando…" : editingGiftId ? "Salvar alterações" : "Criar presente"}</button>
                {editingGiftId && <button className="button ghost" type="button" onClick={() => { setEditingGiftId(null); setGiftDraft({ name: "", description: "", image_url: "", price: "" }); setGiftError(""); }}>Cancelar edição</button>}
              </div>
            </form>
          </article>
          <article className="admin-table">
            <div className="section-heading"><div><h2>Presentes e compras confirmadas</h2><p>Os dados de compradores e mensagens são visíveis somente nesta área autenticada.</p></div><button className="button ghost" onClick={() => void fetchGiftData()}>Atualizar</button></div>
            {giftDataLoading ? <p>Carregando presentes e pagamentos…</p> : giftError ? <p className="form-error" role="alert">{giftError}</p> : <div className="table-scroll"><table><thead><tr><th>Presente</th><th>Status</th><th>Quem presenteou</th><th>Mensagem</th><th>Valor pago</th><th>Data</th><th>Ações</th></tr></thead><tbody>
              {adminGifts.map((gift) => {
                const purchase = giftPurchases.find((item) => item.gift_id === gift.id);
                return <tr key={gift.id}><td>{gift.name}<small className="gift-admin-description">{gift.description}</small></td><td><span className={`gift-admin-status ${gift.status}`}>{giftStatusLabel(gift.status)}</span></td><td>{purchase?.payer_name || "—"}</td><td className="gift-admin-message">{purchase?.message || "—"}</td><td>{purchase ? formatCurrency(Number(purchase.amount_paid)) : "—"}</td><td>{purchase ? formatAdminDate(purchase.purchased_at) : "—"}</td><td className="table-actions"><button onClick={() => editGift(gift)}>Editar</button><button className="delete" onClick={() => void deleteGift(gift)}>Apagar</button></td></tr>;
              })}
            </tbody></table>{adminGifts.length === 0 && <p>Nenhum presente cadastrado.</p>}</div>}
          </article>
          <article className="admin-table">
            <div className="section-heading"><div><h2>Pagamentos pendentes</h2><p>Pagamentos ainda não aprovados não reservam nem indisponibilizam presentes.</p></div></div>
            {pendingGiftAttempts.length ? <div className="table-scroll"><table><thead><tr><th>Presente</th><th>Nome</th><th>Mensagem</th><th>Valor</th><th>Status</th><th>Iniciada em</th></tr></thead><tbody>
              {pendingGiftAttempts.map((attempt) => <tr key={attempt.id}><td>{adminGifts.find((gift) => gift.id === attempt.gift_id)?.name || "Presente removido"}</td><td>{attempt.payer_name}</td><td className="gift-admin-message">{attempt.message}</td><td>{formatCurrency(Number(attempt.amount))}</td><td>{paymentAttemptLabel(attempt.status)}</td><td>{formatAdminDate(attempt.created_at)}</td></tr>)}
            </tbody></table></div> : <p>Nenhum pagamento pendente.</p>}
          </article>
          <article className="admin-table gift-admin-alert">
            <div className="section-heading"><div><h2>Pagamentos duplicados ou divergentes</h2><p>Confira no Mercado Pago e faça o reembolso manual quando necessário.</p></div></div>
            {flaggedGiftAttempts.length ? <div className="table-scroll"><table><thead><tr><th>Presente</th><th>Nome</th><th>Mensagem</th><th>Valor</th><th>Pagamento</th><th>Status</th><th>Data</th></tr></thead><tbody>
              {flaggedGiftAttempts.map((attempt) => <tr className="gift-duplicate-row" key={attempt.id}><td>{adminGifts.find((gift) => gift.id === attempt.gift_id)?.name || "Presente removido"}</td><td>{attempt.payer_name}</td><td className="gift-admin-message">{attempt.message}</td><td>{formatCurrency(Number(attempt.amount))}</td><td>{attempt.mp_payment_id || "—"}</td><td>{paymentAttemptLabel(attempt.status)}</td><td>{formatAdminDate(attempt.created_at)}</td></tr>)}
            </tbody></table></div> : <p>Nenhum pagamento precisa de revisão.</p>}
          </article>
        </section>}
        {tab === "Conteúdo" && <form className="content-editor" onSubmit={saveTextContent}>
          <h2>Textos e informações do site</h2>
          <p>Campos vazios usam o conteúdo original. As alterações são publicadas após salvar.</p>
          {contentSections.map((section) => <fieldset className="admin-content-section" key={section.title}><legend>{section.title}</legend>{section.keys.map((key) => <label key={key} htmlFor={`content-${key}`}>{labelFor(key)}<textarea id={`content-${key}`} rows={key.includes("text") || key.includes("intro") || key.includes("description") ? 4 : 2} value={draftContent[key] ?? defaultSiteContent[key] ?? ""} onChange={(event) => setDraftContent((current) => ({ ...current, [key]: event.target.value }))} /></label>)}</fieldset>)}
          <button className="button primary" disabled={busy}>{busy ? "Salvando…" : "Salvar conteúdo"}</button>
        </form>}
        {tab === "Fotos" && <article className="content-editor">
          <h2>Fotos do site</h2><p>JPEG, PNG ou WebP, até 8 MB. Imagens grandes são reduzidas automaticamente. A prévia só é publicada ao salvar.</p>
          {photoFields.map(([key, title]) => {
            const draft = photoDrafts[key];
            const currentUrl = draft?.preview || content[key] || "";
            return <div className="photo-editor-row" key={key}><h3>{title}</h3>{currentUrl && <img src={currentUrl} alt={`Prévia de ${title}`} />}<label htmlFor={`upload-${key}`}>Selecionar nova imagem<input id={`upload-${key}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectPhoto(key, event.target.files?.[0])} /></label><div><button type="button" className="button ghost" disabled={busy} onClick={() => void savePhoto(key)}>Salvar imagem</button><button type="button" className="button ghost" disabled={busy || !content[key]} onClick={() => { setPhotoDrafts((current) => ({ ...current, [key]: { remove: true } })); void saveContent({ [key]: "" }).then(() => { setPhotoDrafts((current) => ({ ...current, [key]: {} })); setNotice("Foto removida. A foto original será usada como padrão."); }).catch((error: unknown) => setNotice(`Erro ao remover foto: ${error instanceof Error ? error.message : "falha inesperada."}`)); }}>Remover imagem personalizada</button></div><small>Remover restaura a foto original do site como padrão.</small></div>;
          })}
        </article>}
      </section>
    </main>
  );
}
