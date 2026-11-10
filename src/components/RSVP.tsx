import { useState } from "react";
import { getSiteText, useSiteContent } from "../lib/siteContent";
import { supabase } from "../lib/supabase";

type GuestStatus = "confirmado" | "nao_vai";
type RSVPResult = { duplicate?: boolean; saved?: boolean };

export default function RSVP() {
  const { content } = useSiteContent();
  const [name, setName] = useState("");
  const [pendingStatus, setPendingStatus] = useState<GuestStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedStatus, setSavedStatus] = useState<GuestStatus | null>(null);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState(false);

  const submit = async (status: GuestStatus, confirmUpdate = false) => {
    const cleanName = name.trim().replace(/\s+/g, " ");
    const nameLength = Array.from(cleanName).length;
    if (nameLength < 2 || nameLength > 100) {
      setError(getSiteText(content, "rsvp_name_error"));
      return;
    }
    if (!supabase) {
      setError(getSiteText(content, "rsvp_unavailable"));
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const { data, error: submitError } = await supabase.rpc("submit_rsvp", {
        p_name: cleanName,
        p_status: status,
        p_confirm_update: confirmUpdate,
      });
      if (submitError) throw submitError;
      const result = data as RSVPResult;
      if (result.duplicate) {
        setPendingStatus(status);
        setDuplicate(true);
        return;
      }
      if (!result.saved) throw new Error("Não foi possível registrar sua resposta.");
      setSavedStatus(status);
      setDuplicate(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? `Não foi possível enviar sua resposta: ${submitError.message}`
          : getSiteText(content, "rsvp_send_error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const status = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const chosenStatus = status?.value as GuestStatus | undefined;
    if (chosenStatus === "confirmado" || chosenStatus === "nao_vai") {
      void submit(chosenStatus);
    }
  };

  if (savedStatus) {
    const attending = savedStatus === "confirmado";
    return (
      <main>
        <section className="page-intro paper">
          <p className="eyebrow">{getSiteText(content, "rsvp_eyebrow")}</p>
          <h1>{getSiteText(content, attending ? "rsvp_success_yes_title" : "rsvp_success_no_title")}</h1>
          <p>{getSiteText(content, attending ? "rsvp_success_yes_text" : "rsvp_success_no_text")}</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="page-intro paper">
        <p className="eyebrow">{getSiteText(content, "rsvp_eyebrow")}</p>
        <h1>{getSiteText(content, "rsvp_title")}</h1>
        <p>{getSiteText(content, "rsvp_intro")}</p>
      </section>
      <section className="rsvp-shell">
        <form className="invite-card rsvp-form" onSubmit={onSubmit}>
          <label htmlFor="rsvp-name">{getSiteText(content, "rsvp_name_label")}</label>
          <input
            id="rsvp-name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
              setDuplicate(false);
            }}
            placeholder={getSiteText(content, "rsvp_name_placeholder")}
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          {duplicate && (
            <div className="rsvp-duplicate" role="alert">
              <p>{getSiteText(content, "rsvp_duplicate_question")}</p>
              <button
                className="button primary"
                type="button"
                disabled={isSubmitting}
                onClick={() => pendingStatus && void submit(pendingStatus, true)}
              >
                Atualizar resposta
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => {
                  setDuplicate(false);
                  setPendingStatus(null);
                }}
              >
                Cancelar
              </button>
              <small>{getSiteText(content, "rsvp_duplicate_identity_note")}</small>
            </div>
          )}
          <div className="rsvp-actions">
            <button className="button primary" type="submit" name="status" value="confirmado" disabled={isSubmitting}>
              {isSubmitting && pendingStatus === "confirmado" ? "Enviando…" : getSiteText(content, "rsvp_yes_button")}
            </button>
            <button className="button ghost" type="submit" name="status" value="nao_vai" disabled={isSubmitting}>
              {isSubmitting && pendingStatus === "nao_vai" ? "Enviando…" : getSiteText(content, "rsvp_no_button")}
            </button>
          </div>
          {!supabase && <p className="form-error" role="status">{getSiteText(content, "rsvp_unavailable")}</p>}
        </form>
      </section>
    </main>
  );
}
