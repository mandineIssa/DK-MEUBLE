/**
 * Captures admin only après login.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ADMIN = path.join(ROOT, "docs", "manuals", "screenshots", "admin");
const BASE = process.env.SITE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "test@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "DocManual2026!";

fs.mkdirSync(ADMIN, { recursive: true });

const pages = [
  ["01_login.png", "/admin/login"],
  ["02_dashboard.png", "/admin"],
  ["03_produits.png", "/admin/produits"],
  ["04_categories.png", "/admin/categories"],
  ["05_listing.png", "/admin/listing"],
  ["06_navigation.png", "/admin/navigation"],
  ["07_footer.png", "/admin/footer"],
  ["08_marques.png", "/admin/marques"],
  ["09_showrooms.png", "/admin/showrooms"],
  ["10_commandes.png", "/admin/commandes"],
  ["11_livraison.png", "/admin/livraison"],
  ["12_realisations.png", "/admin/realisations"],
  ["13_services.png", "/admin/services"],
  ["14_accueil_cms.png", "/admin/accueil"],
  ["15_contenu.png", "/admin/contenu"],
  ["16_devis.png", "/admin/devis"],
  ["17_entreprises.png", "/admin/entreprises"],
  ["18_devis_b2b.png", "/admin/devis-b2b"],
  ["19_factures.png", "/admin/factures"],
  ["20_avis.png", "/admin/avis"],
  ["21_campagnes.png", "/admin/campagnes"],
  ["22_promotions.png", "/admin/promotions"],
  ["23_messages.png", "/admin/messages"],
  ["24_newsletter.png", "/admin/newsletter"],
  ["25_notifications.png", "/admin/notifications"],
  ["26_clients.png", "/admin/clients"],
  ["27_favoris.png", "/admin/favoris"],
  ["28_visites.png", "/admin/visites"],
  ["29_parametres.png", "/admin/parametres"],
  ["30_commandes_reglages.png", "/admin/commandes/reglages"],
  ["31_promotions_reglages.png", "/admin/promotions/reglages"],
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(BASE + "/admin/login", { waitUntil: "networkidle", timeout: 60000 });
await page.screenshot({ path: path.join(ADMIN, "01_login.png"), fullPage: true });

await page.fill("#email", ADMIN_EMAIL);
await page.fill("#password", ADMIN_PASSWORD);
await Promise.all([
  page.waitForURL(/\/admin(?!\/login)/, { timeout: 20000 }).catch(() => null),
  page.click('button[type="submit"]'),
]);
await page.waitForTimeout(2500);
console.log("url_after_login", page.url());

const loggedIn = /\/admin(\/|$)/.test(page.url()) && !page.url().includes("/login");
console.log("logged_in", loggedIn);
if (!loggedIn) {
  const err = await page.locator("text=/incorrect|erreur|expir/i").first().textContent().catch(() => "");
  console.log("login_error_hint", err);
  await browser.close();
  process.exit(1);
}

for (const [file, route] of pages) {
  if (file === "01_login.png") continue;
  try {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1400);
    if (page.url().includes("/admin/login")) {
      console.warn("lost session at", route);
      break;
    }
    await page.screenshot({ path: path.join(ADMIN, file), fullPage: true });
    console.log("OK", file);
  } catch (e) {
    console.warn("FAIL", file, e.message);
  }
}

await browser.close();
console.log("DONE");
