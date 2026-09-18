# -*- coding: utf-8 -*-
"""Génère Manuel_Utilisateur_Frontend.pdf et Manuel_Utilisateur_Backend.pdf."""
from __future__ import annotations

from datetime import date
from io import BytesIO
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SHOT_F = ROOT / "docs" / "manuals" / "screenshots" / "front"
SHOT_A = ROOT / "docs" / "manuals" / "screenshots" / "admin"
OUT_F = ROOT / "Manuel_Utilisateur_Frontend.pdf"
OUT_B = ROOT / "Manuel_Utilisateur_Backend.pdf"

ORANGE = colors.HexColor("#E85D04")
BLACK = colors.HexColor("#1A1A1A")
GRAY = colors.HexColor("#555555")
LIGHT = colors.HexColor("#F7F7F7")
TODAY = date.today().strftime("%d/%m/%Y")
VERSION = "1.0"


def styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "ct", fontName="Helvetica-Bold", fontSize=22, textColor=BLACK, alignment=TA_CENTER, spaceAfter=8
        ),
        "cover_sub": ParagraphStyle(
            "cs", fontName="Helvetica", fontSize=12, textColor=GRAY, alignment=TA_CENTER, spaceAfter=6
        ),
        "h1": ParagraphStyle(
            "h1", fontName="Helvetica-Bold", fontSize=14, textColor=ORANGE, spaceBefore=14, spaceAfter=8
        ),
        "h2": ParagraphStyle(
            "h2", fontName="Helvetica-Bold", fontSize=11, textColor=BLACK, spaceBefore=10, spaceAfter=4
        ),
        "h3": ParagraphStyle(
            "h3", fontName="Helvetica-Bold", fontSize=10, textColor=ORANGE, spaceBefore=8, spaceAfter=3
        ),
        "body": ParagraphStyle(
            "body", fontName="Helvetica", fontSize=9.2, leading=12.5, textColor=BLACK, alignment=TA_JUSTIFY, spaceAfter=5
        ),
        "bullet": ParagraphStyle(
            "bu", fontName="Helvetica", fontSize=9, leading=12, textColor=BLACK, leftIndent=6, spaceAfter=2
        ),
        "label": ParagraphStyle(
            "lb", fontName="Helvetica-Bold", fontSize=9, textColor=ORANGE, spaceBefore=4, spaceAfter=2
        ),
        "cap": ParagraphStyle(
            "cap", fontName="Helvetica-Oblique", fontSize=8, textColor=GRAY, alignment=TA_CENTER, spaceBefore=2, spaceAfter=8
        ),
        "meta": ParagraphStyle(
            "meta", fontName="Helvetica", fontSize=8.5, textColor=GRAY, alignment=TA_CENTER, spaceAfter=4
        ),
        "toc": ParagraphStyle(
            "toc", fontName="Helvetica", fontSize=9.5, leading=14, textColor=BLACK, spaceAfter=2
        ),
        "warn": ParagraphStyle(
            "warn", fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#9B2226"), spaceAfter=6
        ),
    }


def footer(canvas, doc, title: str):
    canvas.saveState()
    canvas.setStrokeColor(ORANGE)
    canvas.setLineWidth(1.2)
    w, _ = A4
    canvas.line(1.6 * cm, 1.35 * cm, w - 1.6 * cm, 1.35 * cm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(GRAY)
    canvas.drawString(1.6 * cm, 0.75 * cm, f"DK MEUBLE — {title}")
    canvas.drawRightString(w - 1.6 * cm, 0.75 * cm, f"v{VERSION} · p. {doc.page}")
    canvas.restoreState()


def img_flow(path: Path, sty, caption: str, max_w=16.5 * cm, max_h=10.5 * cm):
    if not path.exists():
        return [Paragraph(f"<i>[Capture manquante : {path.name}]</i>", sty["warn"])]
    im = PILImage.open(path)
    if im.mode in ("RGBA", "P"):
        im = im.convert("RGB")
    # Crop extremely tall full-page shots to top portion for readability
    w, h = im.size
    if h > w * 2.2:
        im = im.crop((0, 0, w, int(w * 1.35)))
        w, h = im.size
    ratio = min(max_w / w, max_h / h)
    tw, th = w * ratio, h * ratio
    buf = BytesIO()
    im.save(buf, format="JPEG", quality=78, optimize=True)
    buf.seek(0)
    flow = Image(buf, width=tw, height=th)
    return [flow, Paragraph(caption, sty["cap"])]


def feature(sty, title, objectif, acces, etapes, shot, caption, resultat, erreurs=None):
    parts = [
        Paragraph(title, sty["h2"]),
        Paragraph("Objectif", sty["label"]),
        Paragraph(objectif, sty["body"]),
        Paragraph("Accès", sty["label"]),
        Paragraph(acces, sty["body"]),
        Paragraph("Étapes", sty["label"]),
    ]
    for i, e in enumerate(etapes, 1):
        parts.append(Paragraph(f"{i}. {e}", sty["bullet"]))
    parts.append(Paragraph("Capture d'écran", sty["label"]))
    parts.extend(img_flow(shot, sty, caption))
    parts.append(Paragraph("Résultat attendu", sty["label"]))
    parts.append(Paragraph(resultat, sty["body"]))
    if erreurs:
        parts.append(Paragraph("Erreurs possibles", sty["label"]))
        for e in erreurs:
            parts.append(Paragraph(f"• {e}", sty["bullet"]))
    return KeepTogether(parts)


def cover(sty, title, subtitle):
    return [
        Spacer(1, 2.2 * cm),
        Paragraph("DK MEUBLE", sty["cover_title"]),
        Paragraph(title, sty["cover_title"]),
        Paragraph(subtitle, sty["cover_sub"]),
        Spacer(1, 0.4 * cm),
        Paragraph(f"Version {VERSION} — {TODAY}", sty["meta"]),
        Paragraph("Document confidentiel — usage interne / formation", sty["meta"]),
        Spacer(1, 0.6 * cm),
        Paragraph(
            "Ce manuel décrit uniquement les fonctionnalités réellement présentes dans l’application DK MEUBLE "
            "(site Next.js + API Laravel). Les captures ont été réalisées sur l’environnement local.",
            sty["body"],
        ),
        PageBreak(),
    ]


def build_frontend():
    sty = styles()
    story = []
    story += cover(sty, "Manuel d’utilisation — Frontend", "Visiteurs, clients et utilisateurs inscrits")

    story.append(Paragraph("Table des matières", sty["h1"]))
    toc = [
        "1. Présentation",
        "2. Accéder au site et naviguer",
        "3. Recherche et catalogue",
        "4. Fiche produit",
        "5. Compte client (OTP)",
        "6. Panier et commande",
        "7. Devis, contact et services",
        "8. Showrooms, marques, réalisations",
        "9. Newsletter et footer",
        "10. Pages légales",
        "11. FAQ",
        "12. Glossaire",
    ]
    for t in toc:
        story.append(Paragraph(t, sty["toc"]))
    story.append(PageBreak())

    story.append(Paragraph("1. Présentation", sty["h1"]))
    story.append(
        Paragraph(
            "DK MEUBLE est une boutique en ligne d’électroménager et de mobilier. Le frontend (site public) permet de "
            "parcourir le catalogue, rechercher des produits, demander un devis, contacter l’équipe, gérer un panier, "
            "passer commande et se connecter via téléphone (OTP). Les moyens de paiement affichés côté site incluent "
            "notamment Wave, Orange Money et le paiement cash (selon configuration).",
            sty["body"],
        )
    )
    story.append(Paragraph("Public concerné", sty["label"]))
    for b in ["Visiteurs anonymes", "Clients inscrits (téléphone vérifié)", "Prospects B2B (devis / entreprises)"]:
        story.append(Paragraph(f"• {b}", sty["bullet"]))

    story.append(
        feature(
            sty,
            "2. Accéder au site — Page d’accueil",
            "Découvrir l’enseigne, le menu et les sections dynamiques de la home.",
            "Ouvrir l’URL du site (ex. http://localhost:3000 ou https://dkmeuble.sn).",
            [
                "Ouvrir le navigateur.",
                "Saisir l’adresse du site.",
                "Observer le bandeau : logo, recherche, icônes compte / magasin / panier.",
                "Utiliser le menu : Catégories, Nos produits, Promotion, Reconditionné, Destockage, Services, Contact.",
            ],
            SHOT_F / "01_accueil.png",
            "Fig. 1 — Accueil / en-tête et navigation DK MEUBLE",
            "La page d’accueil s’affiche avec le header noir/orange et les blocs contenus configurés en admin.",
            ["Page blanche / sections vides : vérifier que l’API Laravel tourne et que la home est configurée (Admin → Page d’accueil)."],
        )
    )

    story.append(
        feature(
            sty,
            "3. Catalogue produits",
            "Lister et filtrer les produits publiés.",
            "Menu → Nos produits  |  URL : /produits",
            [
                "Cliquer sur « Nos produits ».",
                "Utiliser la barre de recherche du catalogue.",
                "Filtrer via la colonne catégories (Électroménager, Meubles, etc.).",
                "Ouvrir un produit en cliquant sur sa carte.",
            ],
            SHOT_F / "02_produits.png",
            "Fig. 2 — Catalogue /produits (recherche + filtres catégories)",
            "La liste des produits publiés s’affiche ; un état vide propose un bouton « Nous contacter ».",
        )
    )

    story.append(
        feature(
            sty,
            "4. Fiche produit",
            "Consulter le détail d’un article avant achat ou devis.",
            "Catalogue → cliquer sur un produit  |  /produits/[slug]",
            [
                "Ouvrir un produit.",
                "Parcourir les images / description / prix.",
                "Ajouter au panier ou demander un devis selon les boutons affichés.",
            ],
            SHOT_F / "02b_fiche_produit.png",
            "Fig. 3 — Fiche produit",
            "Les informations produit et actions (panier / devis / contact) sont visibles.",
        )
    )

    for title, file, url, obj in [
        ("Catégories", "03_categories.png", "/categories", "Parcourir l’arborescence des catégories."),
        ("Promotions", "04_promo.png", "/promo", "Voir les offres promotionnelles."),
        ("Reconditionné", "05_reconditionne.png", "/reconditionne", "Consulter les articles reconditionnés."),
        ("Déstockage", "06_destockage.png", "/destockage", "Accéder aux produits en déstockage."),
        ("Services", "07_services.png", "/services", "Découvrir les services proposés."),
        ("Showrooms", "08_showrooms.png", "/showrooms", "Localiser les points de vente."),
        ("Marques", "09_marques.png", "/marques", "Parcourir les marques du catalogue."),
        ("Réalisations", "10_realisations.png", "/realisations", "Voir les projets / portfolio."),
        ("À propos", "11_a_propos.png", "/a-propos", "Lire la présentation de l’entreprise."),
    ]:
        story.append(
            feature(
                sty,
                title,
                obj,
                f"Menu ou URL : {url}",
                [f"Ouvrir {url}.", "Parcourir le contenu affiché."],
                SHOT_F / file,
                f"Fig. — {title}",
                "La page correspondante s’affiche correctement.",
            )
        )

    story.append(PageBreak())
    story.append(Paragraph("5. Compte client (connexion OTP)", sty["h1"]))
    story.append(
        Paragraph(
            "L’inscription / connexion client se fait par téléphone avec code OTP (SMS), pas par e-mail/mot de passe classique. "
            "Google / Facebook peuvent être proposés si configurés (OAuth).",
            sty["body"],
        )
    )
    story.append(
        feature(
            sty,
            "Connexion / création de compte",
            "S’authentifier pour accéder au compte, favoris, commandes et notifications.",
            "Icône profil → /compte/connexion",
            [
                "Cliquer sur l’icône compte.",
                "Saisir le numéro de téléphone.",
                "Demander le code OTP.",
                "Saisir le code reçu (en mode test le code peut s’afficher à l’écran si SMS_DRIVER=log).",
                "Accéder à l’espace /compte.",
            ],
            SHOT_F / "16_compte_connexion.png",
            "Fig. — Écran de connexion compte",
            "Après validation OTP, l’utilisateur est connecté à son espace client.",
            ["OTP non reçu : vérifier le numéro et le mode SMS (log/Twilio).", "Trop de tentatives : attendre le délai anti-spam."],
        )
    )
    story.append(
        feature(
            sty,
            "Espace compte",
            "Retrouver commandes, notifications et préférences.",
            "/compte (après connexion)",
            ["Se connecter.", "Ouvrir /compte.", "Naviguer vers notifications / préférences si besoin."],
            SHOT_F / "17_compte.png",
            "Fig. — Espace compte",
            "Le tableau de bord client affiche les raccourcis disponibles.",
        )
    )

    story.append(Paragraph("6. Panier et commande", sty["h1"]))
    story.append(
        feature(
            sty,
            "Panier",
            "Préparer les articles avant commande.",
            "Icône panier → /panier",
            [
                "Ajouter un produit depuis une fiche.",
                "Ouvrir le panier.",
                "Modifier les quantités ou retirer un article.",
                "Passer à la commande.",
            ],
            SHOT_F / "14_panier.png",
            "Fig. — Panier",
            "Le panier affiche les lignes et le total (ou un état vide / chargement).",
        )
    )
    story.append(
        feature(
            sty,
            "Passer commande",
            "Finaliser la commande : adresse, livraison, paiement.",
            "/commande",
            [
                "Depuis le panier, accéder à la commande.",
                "Renseigner les informations client / adresse.",
                "Choisir le mode de livraison disponible.",
                "Choisir un mode de paiement activé (ex. Wave, Orange Money, cash — selon admin).",
                "Confirmer la commande.",
                "Consulter l’écran de confirmation (/commande/confirmation).",
            ],
            SHOT_F / "15_commande.png",
            "Fig. — Tunnel de commande",
            "Une commande est créée avec statut initial « en_attente » côté serveur.",
            ["Mode de paiement indisponible : un message d’erreur indique de choisir un autre moyen."],
        )
    )

    story.append(Paragraph("7. Devis, contact et services", sty["h1"]))
    for title, file, url, obj in [
        ("Contact", "12_contact.png", "/contact", "Envoyer un message à l’équipe DK MEUBLE."),
        ("Devis", "13_devis.png", "/devis", "Demander un devis produit / projet."),
    ]:
        story.append(
            feature(
                sty,
                title,
                obj,
                url,
                ["Ouvrir la page.", "Remplir le formulaire.", "Envoyer et attendre la confirmation à l’écran."],
                SHOT_F / file,
                f"Fig. — {title}",
                "La demande apparaît ensuite côté admin (Messages / Devis).",
            )
        )

    story.append(Paragraph("8. Newsletter et footer", sty["h1"]))
    story.append(
        feature(
            sty,
            "Newsletter (bandeau footer)",
            "S’abonner aux offres en acceptant la politique de confidentialité.",
            "Bas de n’importe quelle page (footer)",
            [
                "Lire les conditions / politique.",
                "Cocher la case RGPD.",
                "Saisir l’e-mail.",
                "Cliquer sur « S’abonner ».",
            ],
            SHOT_F / "20_footer.png",
            "Fig. — Newsletter + contact + paiements (footer)",
            "Un message de succès ou d’erreur s’affiche sous le formulaire.",
            ["Case RGPD non cochée : inscription refusée."],
        )
    )

    story.append(Paragraph("9. Pages légales", sty["h1"]))
    story.append(
        feature(
            sty,
            "Politique de confidentialité",
            "Consulter le traitement des données personnelles.",
            "/politique-confidentialite",
            ["Ouvrir le lien depuis le footer ou la newsletter."],
            SHOT_F / "18_politique.png",
            "Fig. — Politique de confidentialité",
            "Le texte légal éditable en admin s’affiche.",
        )
    )
    story.append(
        feature(
            sty,
            "CGU",
            "Consulter les conditions générales d’utilisation.",
            "/cgu",
            ["Ouvrir /cgu."],
            SHOT_F / "19_cgu.png",
            "Fig. — CGU",
            "Les CGU s’affichent.",
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("10. FAQ Frontend", sty["h1"]))
    faqs = [
        ("Comment rechercher un produit ?", "Utilisez la barre « Rechercher un produit… » puis le bouton RECHERCHER."),
        ("Comment créer un compte ?", "Via /compte/connexion avec votre téléphone et un code OTP."),
        ("Comment passer commande ?", "Ajoutez au panier → /panier → /commande → confirmez paiement/livraison."),
        ("Quels paiements sont proposés ?", "Ceux activés en admin ; le footer mentionne Wave, Orange Money, cash…"),
        ("Comment demander un devis ?", "Page /devis ou depuis certaines fiches produit."),
        ("Où sont les showrooms ?", "Menu /showrooms."),
    ]
    for q, a in faqs:
        story.append(Paragraph(q, sty["h3"]))
        story.append(Paragraph(a, sty["body"]))

    story.append(Paragraph("11. Glossaire", sty["h1"]))
    gloss = [
        ("OTP", "Code à usage unique envoyé par SMS pour se connecter."),
        ("PLP", "Page Listing Produits (/produits)."),
        ("SKU", "Référence interne d’un produit."),
        ("Déstockage", "Produits soldés / clearance."),
        ("Reconditionné", "Produits remis en état."),
        ("Wave / Orange Money", "Paiements mobile money (Sénégal) si activés."),
        ("Footer", "Pied de page (newsletter, liens, contact, paiements)."),
    ]
    for k, v in gloss:
        story.append(Paragraph(f"<b>{k}</b> — {v}", sty["bullet"]))

    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Fin du manuel Frontend — DK MEUBLE v{VERSION} ({TODAY})", sty["meta"]))

    doc = SimpleDocTemplate(
        str(OUT_F),
        pagesize=A4,
        leftMargin=1.6 * cm,
        rightMargin=1.6 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.9 * cm,
        title="Manuel Utilisateur Frontend — DK MEUBLE",
        author="DK MEUBLE",
    )
    doc.build(story, onFirstPage=lambda c, d: footer(c, d, "Manuel Frontend"), onLaterPages=lambda c, d: footer(c, d, "Manuel Frontend"))
    return OUT_F


def build_backend():
    sty = styles()
    story = []
    story += cover(sty, "Manuel d’utilisation — Backend / Administration", "Administrateurs et opérateurs")

    story.append(Paragraph("Table des matières", sty["h1"]))
    for t in [
        "1. Présentation & rôles",
        "2. Connexion / déconnexion",
        "3. Tableau de bord",
        "4. Catalogue (produits, catégories, marques, listing)",
        "5. Navigation, footer, page d’accueil, contenu",
        "6. Commandes, livraison, factures",
        "7. Devis, entreprises, B2B, messages",
        "8. Promotions, campagnes, avis, favoris",
        "9. Newsletter, notifications, clients, visites",
        "10. Paramètres",
        "11. Workflow commandes",
        "12. FAQ & glossaire",
    ]:
        story.append(Paragraph(t, sty["toc"]))
    story.append(PageBreak())

    story.append(Paragraph("1. Présentation & rôles", sty["h1"]))
    story.append(
        Paragraph(
            "L’espace d’administration DK MEUBLE (Next.js /admin) permet de gérer le catalogue, les contenus, "
            "les commandes, les devis, les messages, les promotions, le footer, la newsletter et les paramètres du site. "
            "L’authentification admin utilise e-mail + mot de passe (Laravel Sanctum). "
            "Dans la version actuelle, le menu ne propose pas de gestion multi-rôles avancée : l’accès admin est réservé aux comptes administrateurs créés en base.",
            sty["body"],
        )
    )

    story.append(
        feature(
            sty,
            "2. Connexion administrateur",
            "Accéder à l’espace d’administration.",
            "URL : /admin/login",
            [
                "Ouvrir /admin/login.",
                "Saisir l’e-mail admin.",
                "Saisir le mot de passe.",
                "Cliquer sur « Se connecter ».",
            ],
            SHOT_A / "01_login.png",
            "Fig. A1 — Écran de connexion admin",
            "Redirection vers /admin (tableau de bord).",
            ["Identifiants incorrects : message d’erreur sous le formulaire.", "Session expirée : reconnectez-vous."],
        )
    )
    story.append(
        Paragraph(
            "Déconnexion : bouton « Déconnexion » en bas de la barre latérale gauche.",
            sty["body"],
        )
    )

    story.append(
        feature(
            sty,
            "3. Tableau de bord",
            "Vue d’ensemble : produits, devis nouveaux, messages nouveaux, visites.",
            "Menu → Tableau de bord  |  /admin",
            [
                "Se connecter.",
                "Lire les indicateurs (cartes colorées).",
                "Cliquer une carte pour ouvrir le module correspondant.",
            ],
            SHOT_A / "02_dashboard.png",
            "Fig. A2 — Tableau de bord",
            "Les compteurs et graphiques de visites s’affichent.",
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("4. Catalogue", sty["h1"]))
    story.append(
        feature(
            sty,
            "Produits (liste, création, photos, import CSV)",
            "Gérer le catalogue : CRUD, photos, import/export CSV.",
            "Menu → Produits  |  /admin/produits",
            [
                "Ouvrir Produits.",
                "Cliquer « Ajouter un produit » pour créer (catégorie, marque, SKU, prix, stock, statut…).",
                "En bas du formulaire : zone Photos (création) ou galerie (édition).",
                "Dans le tableau : Éditer / ＋ Photo / Supprimer.",
                "Utiliser Import/Export CSV (template téléchargeable).",
            ],
            SHOT_A / "03_produits.png",
            "Fig. A3 — Administration Produits",
            "Le produit apparaît dans la liste et sur le site s’il est « Publié ».",
            ["Catégorie obligatoire à la création.", "Import CSV : category_slug doit exister."],
        )
    )
    story.append(
        feature(
            sty,
            "Catégories",
            "Organiser l’arborescence catalogue.",
            "Menu → Catégories",
            ["Ouvrir Catégories.", "Créer / modifier / réordonner selon l’interface.", "Associer images/attributs si proposés."],
            SHOT_A / "04_categories.png",
            "Fig. A4 — Catégories",
            "Les catégories alimentent le menu et les filtres PLP.",
        )
    )
    story.append(
        feature(
            sty,
            "Listing PLP",
            "Paramétrer l’affichage de la page listing produits.",
            "Menu → Listing PLP",
            ["Ouvrir Listing PLP.", "Ajuster titres/filtres/options disponibles.", "Enregistrer."],
            SHOT_A / "05_listing.png",
            "Fig. A5 — Listing PLP",
            "Le front /produits reflète la configuration.",
        )
    )
    story.append(
        feature(
            sty,
            "Marques",
            "Gérer les marques (logo, vedette, affichage footer).",
            "Menu → Marques",
            ["Ajouter une marque.", "Cocher « Afficher dans le footer » si souhaité.", "Uploader un logo."],
            SHOT_A / "08_marques.png",
            "Fig. A6 — Marques",
            "Les marques actives apparaissent sur /marques et éventuellement au footer.",
        )
    )

    story.append(Paragraph("5. Contenu & structure du site", sty["h1"]))
    for title, file, acces, obj in [
        ("Méga-menu / Navigation", "06_navigation.png", "Menu → Méga-menu", "Configurer le menu catégories / sections."),
        ("Footer", "07_footer.png", "Menu → Footer", "Newsletter, colonnes de liens, réseaux, paiements, pages légales."),
        ("Page d’accueil", "14_accueil_cms.png", "Menu → Page d’accueil", "Piloter sections home (hero, carrousels, etc.)."),
        ("Contenu pages", "15_contenu.png", "Menu → Contenu", "Éditer blocs JSON des pages (about, contact, privacy, cgu…)."),
        ("Showrooms", "09_showrooms.png", "Menu → Showrooms", "Gérer les magasins / points de retrait."),
        ("Réalisations", "12_realisations.png", "Menu → Réalisations", "Gérer le portfolio."),
        ("Services", "13_services.png", "Menu → Services", "Gérer les services et demandes associées."),
    ]:
        story.append(
            feature(
                sty,
                title,
                obj,
                acces,
                ["Ouvrir le module.", "Modifier les champs proposés.", "Enregistrer / vérifier sur le site public."],
                SHOT_A / file,
                f"Fig. — {title}",
                "Les changements sont visibles sur le frontend après rechargement.",
            )
        )

    story.append(PageBreak())
    story.append(Paragraph("6. Commandes, livraison, factures", sty["h1"]))
    story.append(
        Paragraph(
            "Statuts commande réels : en_attente → confirmee → en_preparation → expediee → livree (ou annulee). "
            "Statuts paiement : en_attente, paye, echoue, rembourse.",
            sty["body"],
        )
    )
    story.append(
        feature(
            sty,
            "Commandes",
            "Suivre et mettre à jour les commandes clients.",
            "Menu → Commandes",
            [
                "Ouvrir la liste.",
                "Filtrer / rechercher si disponible.",
                "Ouvrir une commande.",
                "Mettre à jour le statut commande / paiement.",
                "Exporter si le bouton export est présent.",
            ],
            SHOT_A / "10_commandes.png",
            "Fig. A7 — Commandes",
            "Le client voit le nouveau statut dans son espace (si connecté).",
        )
    )
    story.append(
        feature(
            sty,
            "Réglages commandes / paiements",
            "Activer les modes de paiement et options de commande.",
            "/admin/commandes/reglages",
            ["Ouvrir les réglages.", "Activer Wave / Orange Money / cash / etc. selon les clés présentes.", "Enregistrer."],
            SHOT_A / "30_commandes_reglages.png",
            "Fig. A8 — Réglages commandes",
            "Seuls les moyens activés sont proposés au checkout.",
        )
    )
    story.append(
        feature(
            sty,
            "Livraison",
            "Configurer zones / tarifs / options de livraison.",
            "Menu → Livraison",
            ["Ouvrir Livraison.", "Créer ou modifier les règles affichées.", "Enregistrer."],
            SHOT_A / "11_livraison.png",
            "Fig. A9 — Livraison",
            "Les options apparaissent au tunnel /commande.",
        )
    )
    story.append(
        feature(
            sty,
            "Factures",
            "Consulter les factures générées.",
            "Menu → Factures",
            ["Ouvrir Factures.", "Rechercher / ouvrir une facture."],
            SHOT_A / "19_factures.png",
            "Fig. A10 — Factures",
            "La liste des factures s’affiche.",
        )
    )

    story.append(Paragraph("7. Relation client & B2B", sty["h1"]))
    for title, file, obj in [
        ("Devis", "16_devis.png", "Traiter les demandes de devis du site."),
        ("Entreprises", "17_entreprises.png", "Gérer les fiches entreprises."),
        ("Devis B2B", "18_devis_b2b.png", "Suivre les devis professionnels."),
        ("Messages", "23_messages.png", "Lire les messages du formulaire contact."),
        ("Clients", "26_clients.png", "Consulter les clients inscrits."),
        ("Avis clients", "20_avis.png", "Modérer les avis produits."),
        ("Favoris", "27_favoris.png", "Voir les listes de favoris clients."),
    ]:
        story.append(
            feature(
                sty,
                title,
                obj,
                f"Menu → {title}",
                ["Ouvrir le module.", "Consulter / traiter les éléments.", "Mettre à jour le statut si proposé."],
                SHOT_A / file,
                f"Fig. — {title}",
                "Les éléments sont traités et le statut mis à jour.",
            )
        )

    story.append(Paragraph("8. Marketing & promotions", sty["h1"]))
    for title, file, obj in [
        ("Promotions", "22_promotions.png", "Créer et gérer les promotions catalogue."),
        ("Réglages promotions", "31_promotions_reglages.png", "Paramètres globaux des promos / newsletter offres."),
        ("Campagnes", "21_campagnes.png", "Piloter les campagnes marketing."),
        ("Newsletter", "24_newsletter.png", "Exporter / gérer les abonnés newsletter."),
        ("Notifications", "25_notifications.png", "Templates, canaux SMS/email, logs notifications."),
        ("Visites", "28_visites.png", "Analytics de fréquentation du site."),
    ]:
        story.append(
            feature(
                sty,
                title,
                obj,
                f"Menu → {title.split()[0]}" if "Réglages" not in title else title,
                ["Ouvrir le module.", "Configurer.", "Enregistrer."],
                SHOT_A / file,
                f"Fig. — {title}",
                "La configuration est prise en compte.",
            )
        )

    story.append(
        feature(
            sty,
            "9. Paramètres du site",
            "Coordonnées, réseaux, logo, SEO…",
            "Menu → Paramètres",
            ["Ouvrir Paramètres.", "Mettre à jour téléphone, WhatsApp, e-mail, adresse, réseaux.", "Enregistrer."],
            SHOT_A / "29_parametres.png",
            "Fig. A11 — Paramètres",
            "Header/footer/contact reflètent les nouvelles coordonnées.",
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("10. Workflow commandes (réel)", sty["h1"]))
    story.append(
        Paragraph(
            "<b>en_attente</b> → <b>confirmee</b> → <b>en_preparation</b> → <b>expediee</b> → <b>livree</b><br/>"
            "Branche d’annulation : <b>annulee</b> (selon règles métier du service commandes).",
            sty["body"],
        )
    )

    story.append(Paragraph("11. FAQ Admin", sty["h1"]))
    for q, a in [
        ("Comment ajouter un produit avec photos ?", "Produits → Ajouter → remplir → zone Photos → Enregistrer (ou ＋ Photo dans la liste)."),
        ("Comment importer en masse ?", "Produits → Télécharger le template CSV → remplir → Uploader."),
        ("Comment changer un statut de commande ?", "Commandes → ouvrir → mettre à jour statut commande/paiement."),
        ("Comment activer Wave / Orange Money ?", "Commandes → réglages → activer les méthodes → enregistrer."),
        ("Où modifier le footer / newsletter ?", "Menu Footer (textes, liens, réseaux, logos paiement, pages légales)."),
        ("Où voir les abonnés newsletter ?", "Menu Newsletter."),
    ]:
        story.append(Paragraph(q, sty["h3"]))
        story.append(Paragraph(a, sty["body"]))

    story.append(Paragraph("12. Glossaire Admin", sty["h1"]))
    for k, v in [
        ("Sanctum", "Auth API session cookie pour l’admin."),
        ("PLP", "Page listing produits (config Listing PLP)."),
        ("OTP", "Auth client téléphone (hors admin)."),
        ("SKU", "Référence produit."),
        ("Seed", "Données initiales (templates, footer…)."),
        ("Queue", "Jobs asynchrones (notifications, paniers abandonnés)."),
    ]:
        story.append(Paragraph(f"<b>{k}</b> — {v}", sty["bullet"]))

    story.append(Spacer(1, 10))
    story.append(
        Paragraph(
            "Note : un mot de passe admin temporaire a pu être défini uniquement pour réaliser les captures de ce manuel. "
            "Changez-le immédiatement en production.",
            sty["warn"],
        )
    )
    story.append(Paragraph(f"Fin du manuel Backend — DK MEUBLE v{VERSION} ({TODAY})", sty["meta"]))

    doc = SimpleDocTemplate(
        str(OUT_B),
        pagesize=A4,
        leftMargin=1.6 * cm,
        rightMargin=1.6 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.9 * cm,
        title="Manuel Utilisateur Backend — DK MEUBLE",
        author="DK MEUBLE",
    )
    doc.build(story, onFirstPage=lambda c, d: footer(c, d, "Manuel Backend"), onLaterPages=lambda c, d: footer(c, d, "Manuel Backend"))
    return OUT_B


if __name__ == "__main__":
    f = build_frontend()
    b = build_backend()
    print(f)
    print(b)
    print("front_shots", len(list(SHOT_F.glob("*.png"))))
    print("admin_shots", len(list(SHOT_A.glob("*.png"))))
