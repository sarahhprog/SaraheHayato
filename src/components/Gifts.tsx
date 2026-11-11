import { useCallback, useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { getSiteText, useSiteContent } from "../lib/siteContent";
import { supabase } from "../lib/supabase";

type Gift = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  status: "available" | "unavailable";
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function Gifts() {
  const { content } = useSiteContent();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<Gift | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [messageTouched, setMessageTouched] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);

  const loadGifts = useCallback(async () => {
    if (!supabase) {
      setLoadError(
        "A lista de presentes está temporariamente indisponível. Tente novamente mais tarde.",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("gifts")
      .select("id,name,description,image_url,price,status")
      .order("status", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      setLoadError(
        "Não foi possível carregar a lista de presentes. Verifique sua conexão e tente novamente.",
      );
    } else {
      setGifts((data ?? []) as Gift[]);
      setLoadError("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadGifts();
  }, [loadGifts]);

  const closeModal = () => {
    if (paymentBusy) return;
    setSelected(null);
    setPaymentError("");
  };

  const startPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, " ");
    const cleanMessage = message.trim();
    setNameTouched(true);
    setMessageTouched(true);
    if (Array.from(cleanName).length < 2 || Array.from(cleanName).length > 100) {
      setPaymentError("Informe seu nome com pelo menos 2 caracteres.");
      return;
    }
    if (Array.from(cleanMessage).length < 1 || Array.from(cleanMessage).length > 1000) {
      setPaymentError("Escreva uma mensagem de até 1.000 caracteres.");
      return;
    }
    if (!selected || !supabase) {
      setPaymentError("O pagamento está temporariamente indisponível. Tente novamente mais tarde.");
      return;
    }

    setPaymentBusy(true);
    setPaymentError("");
    const { data, error } = await supabase.functions.invoke<{ checkoutUrl: string }>(
      "create-preference",
      {
        body: { giftId: selected.id, name: cleanName, message: cleanMessage },
      },
    );

    if (error) {
      let messageFromServer = "";
      if (error instanceof FunctionsHttpError) {
        const response = error.context.clone();
        const errorBody = (await response.json().catch(() => null)) as { error?: unknown } | null;
        if (typeof errorBody?.error === "string") messageFromServer = errorBody.error;
      }
      setPaymentError(
        messageFromServer ||
          "Não foi possível iniciar o pagamento. Confira os dados e tente novamente.",
      );
      setPaymentBusy(false);
      return;
    }

    if (!data?.checkoutUrl || !data.checkoutUrl.startsWith("https://")) {
      setPaymentError("O Mercado Pago não retornou um link de pagamento válido. Tente novamente.");
      setPaymentBusy(false);
      return;
    }

    sessionStorage.setItem("gift-payment-payer-name", cleanName);
    window.location.assign(data.checkoutUrl);
  };

  const nameError =
    Array.from(name.trim()).length < 2
      ? "Seu nome é obrigatório e deve ter pelo menos 2 caracteres."
      : Array.from(name.trim()).length > 100
        ? "O nome deve ter até 100 caracteres."
        : "";
  const messageError =
    Array.from(message.trim()).length < 1
      ? "A mensagem é obrigatória."
      : Array.from(message.trim()).length > 1000
        ? "A mensagem deve ter até 1.000 caracteres."
        : "";
  const text = (key: string) => getSiteText(content, key);

  return (
    <main>
      <section className="page-intro paper">
        <p className="eyebrow">{text("gifts_eyebrow")}</p>
        <h1>{text("gifts_title")}</h1>
        <p>{text("gifts_intro")}</p>
      </section>
      <section className="gifts-section" aria-label="Lista de presentes">
        {loading ? (
          <p className="gift-list-message" role="status">
            Carregando presentes…
          </p>
        ) : loadError ? (
          <div className="gift-list-message" role="alert">
            <p>{loadError}</p>
            <button className="button primary" onClick={() => void loadGifts()}>
              Tentar novamente
            </button>
          </div>
        ) : gifts.length === 0 ? (
          <p className="gift-list-message">A lista de presentes estará disponível em breve.</p>
        ) : (
          <div className="gift-grid">
            {gifts.map((gift) => {
              const isAvailable = gift.status === "available";
              return (
                <article
                  className={`gift-card${isAvailable ? "" : " is-unavailable"}`}
                  key={gift.id}
                >
                  <div className="gift-image">
                    <img src={gift.image_url} alt={gift.name} />
                    {!isAvailable && <span className="gift-status-badge">Indisponível</span>}
                  </div>
                  <div className="gift-card-content">
                    <h2>{gift.name}</h2>
                    <p className="gift-desc">{gift.description}</p>
                    <div className="gift-bottom">
                      <strong>{formatPrice(Number(gift.price))}</strong>
                      {isAvailable && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(gift);
                            setName("");
                            setMessage("");
                            setNameTouched(false);
                            setMessageTouched(false);
                            setPaymentError("");
                          }}
                        >
                          Presentear
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selected && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <section
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gift-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={closeModal}
              disabled={paymentBusy}
              aria-label="Fechar"
            >
              Fechar ×
            </button>
            <p className="eyebrow">Um gesto de carinho</p>
            <h2 id="gift-modal-title">{selected.name}</h2>
            <p className="payment-price">{formatPrice(Number(selected.price))}</p>
            <p>
              Preencha seu nome e uma mensagem para os noivos. Depois, você continuará o pagamento
              com segurança no Mercado Pago.
            </p>
            <form className="gift-payment-form" onSubmit={(event) => void startPayment(event)}>
              <label htmlFor="gift-payer-name">Seu nome</label>
              <input
                id="gift-payer-name"
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => setNameTouched(true)}
                aria-describedby={nameTouched && nameError ? "gift-name-error" : undefined}
                aria-invalid={Boolean(nameTouched && nameError)}
              />
              {nameTouched && nameError && (
                <p className="form-error" id="gift-name-error" role="alert">
                  {nameError}
                </p>
              )}
              <label htmlFor="gift-message">Mensagem para os noivos</label>
              <textarea
                id="gift-message"
                name="message"
                maxLength={1000}
                required
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onBlur={() => setMessageTouched(true)}
                aria-describedby={messageTouched && messageError ? "gift-message-error" : undefined}
                aria-invalid={Boolean(messageTouched && messageError)}
              />
              {messageTouched && messageError && (
                <p className="form-error" id="gift-message-error" role="alert">
                  {messageError}
                </p>
              )}
              {paymentError && (
                <p className="form-error" role="alert">
                  {paymentError}
                </p>
              )}
              <button
                className="button primary full"
                type="submit"
                disabled={paymentBusy || Boolean(nameError) || Boolean(messageError)}
              >
                {paymentBusy ? "Preparando pagamento…" : "Ir para o pagamento"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
