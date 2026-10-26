# Aabora e-shop

Static site in English, Italian and Greek.

## Run locally
Translations and products load with fetch(), so open the site through a local server (not by double-clicking the files):

    python3 -m http.server 8000

Then visit http://localhost:8000

## Where things live
- Pages: *.html and legal/*.html
- Styles: assets/css (base, layout, components)
- Scripts: assets/js (i18n, products, cart, main)
- Translations: locales/en.json, it.json, el.json
- Products: data/products.json. Add "image": "assets/images/products/ring-1.jpg" to a product to show a photo instead of the drawn icon.

## Before launch
- Replace the placeholder email in contact.html and the domain in robots.txt and sitemap.xml
- Write the legal pages (legal/*.html)
- Set up payments (see below)

## Fonts (self-hosted)
Run once, with internet access: `py tools/download-fonts.py`
It downloads Literata and Manrope (Latin, Greek, Cyrillic) into assets/fonts/ and writes assets/css/fonts.css.

## Legal pages
Text lives in legal/content/<page>.<lang>.html. Fill in your business details once in data/company.json;
they are inserted wherever you see {{placeholders}}. Have a lawyer review the texts before launch.

## Product pictures and the product list
1. Put your photos anywhere inside assets/images/products/ (sub-folders are fine). The category is read from the folder or file name: ring, earring, necklace, bracelet, brooch, cufflink, belt (or "leather belt").
2. Optional, shrinks large photos (needs `py -m pip install pillow`): `py tools/optimize-images.py`
3. Run `py tools/build-products.py`. It creates data/products.csv and data/products.json.
4. Open data/products.csv in Excel, edit names, prices and materials (use File > Save As > CSV UTF-8), then run the script again.
Edit the CSV, not the JSON. Existing rows are kept when you add more photos.
The temporary drawings (placeholder-*.svg) are ignored once real photos exist.

## Logo files
assets/images/logo/: logo-wordmark.png (header), logo-monogram.png (home and footer), logo-full.png (full logo with tagline), favicon.png, apple-touch-icon.png.

## Gifts, sizes, gallery and wishlist
- Extra gallery photos: name them like the main photo plus "__" and a word, e.g. ring-1.jpg (main), ring-1__worn.jpg, ring-1__detail.jpg. Run tools/build-products.py.
- data/products.csv has two optional columns: "for" (her / him / both) for the gift filters, and story_en/it/el/ru, a short description shown on the product page.
- Sizes offered for rings, bracelets and belts are in data/sizes.json. Edit them to match what you really make.
- Gift wrap price: "giftWrapPrice" in data/company.json (0 = free).
- Wishlist and cart are stored in the visitor's browser.

## Payments (Stripe) and going live
The site uses Stripe Checkout: customers pay on Stripe's secure page, so card details never touch your site.
A small server function (netlify/functions/create-checkout.mjs) creates the payment; it takes prices from data/products.json, never from the browser.
Payments do NOT work with the local `py -m http.server` test; use Netlify (below).

1. Create a Stripe account (stripe.com) and complete the business verification. Stay in Test mode at first.
2. Copy the *secret* test key (starts with sk_test_). Never put it in any file of this project.
3. Fill in data/shipping.json: countries you ship to (e.g. ["GR","IT"]), the shipping price, optional free-shipping threshold. Until you do, checkout shows an error on purpose.
4. Publish the folder on Netlify (netlify.com): connect a GitHub repository, or use the Netlify CLI (`netlify deploy`). Netlify reads netlify.toml automatically.
5. In Netlify: Site settings > Environment variables > add STRIPE_SECRET_KEY with your sk_test_ key. Redeploy.
6. Test an order with card 4242 4242 4242 4242, any future date, any CVC. Check the payment in the Stripe dashboard (Payments) - it shows items, size, gift message and delivery address.
7. In Stripe: Settings > Payment methods (turn on the ones you want, e.g. Apple Pay, Google Pay) and Settings > Emails (customer receipts; email notifications for you).
8. To go live: finish Stripe verification, replace the key in Netlify with the live sk_live_ key, redeploy, and place one small real order.
Orders are fulfilled from the Stripe dashboard. Ask for a webhook if you want automatic order emails or a spreadsheet of orders.
Check with your accountant: VAT (prices are treated as VAT-inclusive), invoices, and consistency between data/shipping.json and your Shipping and returns page.

## Mini cart
Adding a piece, or clicking "Cart" in the header, opens a slide-out cart (Esc or a click outside closes it). On the cart and checkout pages the header link opens the full page instead.
If you set "freeOver" in data/shipping.json, the mini cart shows a free-shipping progress bar.
