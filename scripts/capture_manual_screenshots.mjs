/**
 * Capture réelle des écrans DK MEUBLE pour les manuels PDF.
 * Usage: node scripts/capture_manual_screenshots.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FRONT = path.join(ROOT, "docs", "manuals", "screenshots", "front");
const ADMIN = path.join(ROOT, "docs", "manuals", "screenshots", "admin");
const BASE = process.env.SITE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@dkmeuble.sn";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password";

fs.mkdirSync(FRONT, { recursive: true });
fs.mkdirSync(ADMIN, { recursive: true });

async function shot(page, file, fullPage = true) {
  const dest = file.startsWith("admin/")
    ? path.join(ADMIN, path.basename(file))
    : path.join(FRONT, path.basename(file));
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, fullPage });
  console.log("OK", dest);
}

async function gotoSafe(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1200);
    return true;
  } catch (e) {
    console.warn("FAIL", url, e.message);
    return false;
  }
}

const frontPages = [
  ["01_accueil.png", "/"],
  ["02_produits.png", "/produits"],
  ["03_categories.png", "/categories"],
  ["04_promo.png", "/promo"],
  ["05_reconditionne.png", "/reconditionne"],
  ["06_destockage.png", "/destockage"],
  ["07_services.png", "/services"],
  ["08_showrooms.png", "/showrooms"],
  ["09_marques.png", "/marques"],
  ["10_realisations.png", "/realisations"],
  ["11_a_propos.png", "/a-propos"],
  ["12_contact.png", "/contact"],
  ["13_devis.png", "/devis"],
  ["14_panier.png", "/panier"],
  ["15_commande.png", "/commande"],
  ["16_compte_connexion.png", "/compte/connexion"],
  ["17_compte.png", "/compte"],
  ["18_politique.png", "/politique-confidentialite"],
  ["19_cgu.png", "/cgu"],
];

const adminPages = [
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
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

console.log("BASE", BASE);

for (const [file, route] of frontPages) {
  if (await gotoSafe(page, BASE + route)) {
    // Prefer first product if on listing
    if (route === "/produits") {
      const link = page.locator('a[href*="/produits/"]').first();
      if (await link.count()) {
        await shot(page, file, true);
        await link.click().catch(() => null);
        await page.waitForTimeout(1500);
        await shot(page, "02b_fiche_produit.png", true);
        continue;
      }
    }
    await shot(page, file, true);
  }
}

// Footer area on home
if (await gotoSafe(page, BASE + "/")) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await shot(page, "20_footer.png", false);
}

// Admin login
await gotoSafe(page, BASE + "/admin/login");
await shot(page, "admin/01_login.png", true);

const email = page.locator('input[type="email"], input[name="email"]').first();
const pass = page.locator('input[type="password"], input[name="password"]').first();
if ((await email.count()) && (await pass.count())) {
  await email.fill(ADMIN_EMAIL);
  await pass.fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(2500);
}

let loggedIn = page.url().includes("/admin") && !page.url().includes("/login");
console.log("admin_logged_in", loggedIn);

for (const [file, route] of adminPages) {
  if (file === "01_login.png") continue;
  if (!loggedIn && route !== "/admin/login") continue;
  if (await gotoSafe(page, BASE + route)) {
    // If redirected to login, stop admin captures
    if (page.url().includes("/admin/login")) {
      console.warn("Session admin absente — captures admin limitées.");
      loggedIn = false;
      break;
    }
    await shot(page, "admin/" + file, true);
  }
}

await browser.close();
console.log("DONE");
