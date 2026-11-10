import { useMemo, useState } from "react";
import { getSiteText, useSiteContent } from "../lib/siteContent";

const giftDefaults = [
  { image: "gift_1_image", available: 3 },
  { image: "gift_2_image", available: 2 },
  { image: "gift_3_image", available: 4 },
  { image: "gift_4_image", available: 5 },
  { image: "gift_5_image", available: 6 },
  { image: "gift_6_image", available: 8 },
];

export default function Gifts() {
  const { content } = useSiteContent();
  const [category, setCategory] = useState("Todos");
  const [selected, setSelected] = useState<string | null>(null);
  const items = giftDefaults.map((gift, index) => {
    const number = index + 1;
    return {
      ...gift,
      name: getSiteText(content, `gift_${number}_name`),
      category: getSiteText(content, `gift_${number}_category`),
      price: Number(getSiteText(content, `gift_${number}_price`)) || 0,
      description: getSiteText(content, `gift_${number}_description`) || getSiteText(content, "gifts_description"),
      imageUrl: getSiteText(content, gift.image),
    };
  });
  const categories = ["Todos", ...new Set(items.map((gift) => gift.category))];
  const visible = useMemo(
    () => category === "Todos" ? items : items.filter((gift) => gift.category === category),
    [category, items],
  );
  const text = (key: string) => getSiteText(content, key);

  return (
    <main>
      <section className="page-intro paper">
        <p className="eyebrow">{text("gifts_eyebrow")}</p>
        <h1>{text("gifts_title")}</h1>
        <p>{text("gifts_intro")}</p>
      </section>
      <section className="gifts-section">
        <div className="filters" aria-label="Filtrar presentes">
          {categories.map((item) => <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        <div className="gift-grid">
          {visible.map((gift) => (
            <article className="gift-card" key={gift.name}>
              <div className="gift-image">{gift.imageUrl && <img src={gift.imageUrl} alt={gift.name} />}<span>{gift.category}</span></div>
              <div>
                <p className="availability">{gift.available} cotas disponíveis</p>
                <h3>{gift.name}</h3>
                <p className="gift-desc">{gift.description}</p>
                <div className="gift-bottom"><strong>{gift.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong><button onClick={() => setSelected(gift.name)}>{text("gift_button")}</button></div>
              </div>
            </article>
          ))}
        </div>
      </section>
      {selected && <div className="modal-backdrop" onMouseDown={() => setSelected(null)}><section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="gift-modal-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}>{text("gift_modal_close")} ×</button><p className="eyebrow">{text("gift_modal_title")}</p><h2 id="gift-modal-title">{selected}</h2><p>{text("gift_modal_text")}</p><button className="button primary" onClick={() => setSelected(null)}>{text("gift_modal_close")}</button></section></div>}
    </main>
  );
}
