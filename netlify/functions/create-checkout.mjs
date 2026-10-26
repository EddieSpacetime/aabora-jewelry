// Creates a Stripe Checkout Session and returns its URL.
// Prices always come from data/products.json on the server, never from the browser.
// Needs one environment variable on Netlify: STRIPE_SECRET_KEY

const STRIPE_URL = "https://api.stripe.com/v1/checkout/sessions";
const LOCALES = ["en", "it", "el", "ru"];
const SIZED = ["ring", "bracelet", "belt"];
const WRAP_NAME = { en: "Gift wrap", it: "Confezione regalo", el: "Συσκευασία δώρου", ru: "Подарочная упаковка" };

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

const secretKey = () =>
  (typeof Netlify !== "undefined" && Netlify.env && Netlify.env.get("STRIPE_SECRET_KEY")) || process.env.STRIPE_SECRET_KEY;

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const key = secretKey();
  if (!key) return json({ error: "STRIPE_SECRET_KEY is not set" }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }

  const origin = new URL(req.url).origin;
  let products, sizes, ship, company;
  try {
    [products, sizes, ship, company] = await Promise.all(
      ["products", "sizes", "shipping", "company"].map((n) =>
        fetch(`${origin}/data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); }))
    );
  } catch (e) {
    console.error("Could not load data file:", e.message);
    return json({ error: "Shop data unavailable" }, 500);
  }

  const lang = LOCALES.includes(body.lang) ? body.lang : "en";
  const items = Array.isArray(body.items) ? body.items.slice(0, 30) : [];
  if (!items.length) return json({ error: "Empty cart" }, 400);

  const params = new URLSearchParams();
  const isPublic = !/^(localhost|127\.0\.0\.1)/.test(new URL(origin).hostname);
  let n = 0, subtotal = 0;
  for (const it of items) {
    const p = products.find((x) => String(x.id) === String(it.id));
    const qty = Number(it.qty);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > 10) return json({ error: "Invalid item" }, 400);
    const size = String(it.size || "");
    const allowed = SIZED.includes(p.category) ? sizes[p.category] || [] : [];
    if (allowed.length ? !allowed.includes(size) : size) return json({ error: "Invalid size" }, 400);
    const cents = Math.round(Number(p.price) * 100);
    if (!(cents > 0)) return json({ error: "Invalid price" }, 400);

    const pre = `line_items[${n}]`;
    params.set(`${pre}[quantity]`, String(qty));
    params.set(`${pre}[price_data][currency]`, "eur");
    params.set(`${pre}[price_data][unit_amount]`, String(cents));
    params.set(`${pre}[price_data][product_data][name]`, (p.name[lang] || p.name.en || "Aabora") + (size ? ` — ${size}` : ""));
    params.set(`${pre}[price_data][product_data][metadata][product_id]`, String(p.id));
    if (size) params.set(`${pre}[price_data][product_data][metadata][size]`, size);
    if (p.image && isPublic) params.set(`${pre}[price_data][product_data][images][0]`, `${origin}/${encodeURI(p.image)}`);
    subtotal += cents * qty;
    n++;
  }

  const gift = body.gift || {};
  const wrapCents = Math.round((Number(company.giftWrapPrice) || 0) * 100);
  if (gift.wrap && wrapCents > 0) {
    const pre = `line_items[${n}]`;
    params.set(`${pre}[quantity]`, "1");
    params.set(`${pre}[price_data][currency]`, "eur");
    params.set(`${pre}[price_data][unit_amount]`, String(wrapCents));
    params.set(`${pre}[price_data][product_data][name]`, WRAP_NAME[lang]);
    n++;
  }
  params.set("metadata[gift_wrap]", gift.wrap ? "yes" : "no");
  if (gift.note) params.set("metadata[gift_note]", String(gift.note).slice(0, 240));

  const countries = Array.isArray(ship.countries) ? ship.countries : [];
  const rates = (ship.rates || []).filter((r) => Number.isFinite(r.amount) && r.amount >= 0);
  if (!countries.length || !rates.length) {
    console.error("data/shipping.json is not configured (countries and rate amounts are empty).");
    return json({ error: "Shipping is not configured" }, 500);
  }
  countries.forEach((c, k) => params.set(`shipping_address_collection[allowed_countries][${k}]`, c));
  const free = ship.freeOver != null && subtotal >= Math.round(Number(ship.freeOver) * 100);
  rates.forEach((r, k) => {
    const pre = `shipping_options[${k}][shipping_rate_data]`;
    params.set(`${pre}[type]`, "fixed_amount");
    params.set(`${pre}[display_name]`, (r.name && (r.name[lang] || r.name.en)) || "Shipping");
    params.set(`${pre}[fixed_amount][amount]`, String(free ? 0 : Math.round(r.amount * 100)));
    params.set(`${pre}[fixed_amount][currency]`, "eur");
    if (Number.isInteger(r.minDays) && Number.isInteger(r.maxDays)) {
      params.set(`${pre}[delivery_estimate][minimum][unit]`, "business_day");
      params.set(`${pre}[delivery_estimate][minimum][value]`, String(r.minDays));
      params.set(`${pre}[delivery_estimate][maximum][unit]`, "business_day");
      params.set(`${pre}[delivery_estimate][maximum][value]`, String(r.maxDays));
    }
  });

  params.set("mode", "payment");
  params.set("locale", lang);
  params.set("phone_number_collection[enabled]", "true");
  params.set("success_url", `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}/cart.html`);

  const res = await fetch(STRIPE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    console.error("Stripe error:", JSON.stringify(data));
    return json({ error: "Could not create checkout" }, 502);
  }
  return json({ url: data.url });
};
