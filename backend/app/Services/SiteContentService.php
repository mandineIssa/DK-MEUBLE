<?php

namespace App\Services;

use App\Models\PageBlock;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SiteContentService
{
    public static function defaultSettings(): array
    {
        return [
            'brand' => [
                'name' => 'DK HOMETECH',
                'logo_url' => '',
            ],
            'contact' => [
                'whatsapp' => '',
                'phone_display' => '',
                'phone_tel' => '',
                'phones' => '',
                'email' => '',
                'address' => '',
                'hours' => '',
                'maps_embed' => '',
            ],
            'socials' => [
                'facebook' => '',
                'instagram' => '',
                'tiktok' => '',
                'youtube' => '',
            ],
            'footer' => [
                'trust' => [
                    'Qualité',
                    'Livraison partout au Sénégal',
                    'Service de confiance',
                ],
            ],
            'seo' => [
                'title' => 'DK HOMETECH — Meubles & Électroménager à Dakar',
                'description' => 'Meubles, armoires et électroménager à Dakar. Livraison partout au Sénégal. +10 ans d’expérience.',
            ],
            'legal' => [
                'cgv' => '',
                'mentions' => '',
            ],
            'contacts_services' => [
                'commercial' => '',
                'recrutement' => '',
                'reclamations' => '',
            ],
            'payment_logos' => [],
            /** Thème clair header/corps (accent partagé avec le footer via --accent-primary) */
            'theme' => self::defaultTheme(),
            'homepage' => [
                'nav_secondary' => [
                    ['label' => 'Nos produits', 'href' => '/produits', 'enabled' => true, 'order' => 0],
                    ['label' => 'Promotion', 'href' => '/promotions', 'enabled' => true, 'order' => 1],
                    ['label' => 'Reconditionné', 'href' => '/reconditionne', 'enabled' => true, 'order' => 2],
                    ['label' => 'Destockage', 'href' => '/destockage', 'enabled' => true, 'order' => 3],
                    ['label' => 'Services', 'href' => '/services', 'enabled' => true, 'order' => 4],
                    ['label' => 'Contact', 'href' => '/contact', 'enabled' => true, 'order' => 5],
                ],
                'newsletter' => [
                    'enabled' => true,
                    'title' => 'Newsletter',
                    'subtitle' => 'Recevez nos offres et nouveautés',
                    'cta_label' => "S'inscrire",
                    'provider' => 'internal',
                ],
                'whatsapp_widget' => [
                    'enabled' => true,
                    'phone' => '',
                    'message' => 'Bonjour, je souhaite des informations sur vos produits.',
                    'agent_image' => '',
                ],
                'footer_about' => 'DK HOMETECH — Meubles & électroménager à Dakar. Qualité, conseil et livraison partout au Sénégal.',
                'footer_info_links' => [
                    ['label' => 'À propos', 'href' => '/a-propos', 'enabled' => true],
                    ['label' => 'Contact', 'href' => '/contact', 'enabled' => true],
                    ['label' => 'Tous les produits', 'href' => '/produits', 'enabled' => true],
                    ['label' => 'Politique de confidentialité', 'href' => '/legal', 'enabled' => true],
                    ['label' => 'Showrooms', 'href' => '/showrooms', 'enabled' => true],
                ],
                'agency_credit' => '',
            ],
        ];
    }

    /** Palette claire Jumia — une seule accent_primary pour header, corps et footer. */
    public static function defaultTheme(): array
    {
        return [
            'header_bg' => '#ffffff',
            'body_bg' => '#ffffff',
            'content_bg_alt' => '#f5f5f5',
            'text_primary' => '#1a1a1a',
            'text_secondary' => '#6e6e6e',
            'border_light' => '#e0e0e0',
            'accent_primary' => '#f68b1e',
            'accent_primary_hover' => '#e07d16',
            'price_color' => '#f68b1e',
            'price_strikethrough' => '#9a9a9a',
            'success_color' => '#2e7d32',
            'danger_color' => '#d32f2f',
            'badge_bg' => '#f68b1e',
            'use_alt_bg_sections' => true,
            'header_compact_scroll' => 80,
            'header_nav_bg' => '#ffffff',
        ];
    }

    public static function allSettingsStatic(): array
    {
        return app(self::class)->allSettings();
    }

    public static function defaultPages(): array
    {
        return [
            'home' => [
                'hero' => [
                    'title_line1' => 'Meubles &',
                    'title_line2' => 'Électroménager',
                    'subtitle' => 'Maison • Bureau • Entreprise',
                    'image_url' => 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=80',
                    'badge_text' => "+10 ans\nd'expérience",
                    'chat_prompt' => 'Une question ? Écrivez-nous',
                    'cta_primary_label' => 'Voir les produits',
                    'cta_primary_href' => '/produits',
                    'cta_secondary_label' => 'Demander un devis',
                    'cta_secondary_href' => '/devis',
                ],
                'category_tiles' => [
                    [
                        'title' => 'Électroménager',
                        'category_slug' => 'electromenager',
                        'image_url' => 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80',
                    ],
                    [
                        'title' => 'Meubles & Armoires',
                        'category_slug' => 'meubles',
                        'image_url' => 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
                    ],
                ],
                'products_section' => [
                    'title' => 'Nos produits',
                    'cta_label' => 'Voir tout le catalogue',
                    'cta_href' => '/produits',
                ],
            ],
            'about' => [
                'hero' => [
                    'eyebrow' => 'À propos de DK HOMETECH',
                    'title' => 'Bienvenue chez DK HOMETECH',
                    'subtitle' => 'Meublez. Équipez. Faites confiance.',
                ],
                'intro' => [
                    'image_url' => 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
                    'paragraphs' => [
                        "Depuis plus de 10 ans, DK HOMETECH accompagne les particuliers, les entreprises et les institutions dans l'aménagement et l'équipement de leurs espaces.",
                        'Basée à Dakar, notre entreprise propose une large gamme de meubles, armoires, mobilier de bureau et électroménager pour répondre aux besoins de chaque client.',
                        'Notre priorité est simple : vous proposer de bons produits, au meilleur rapport qualité-prix, avec un service sérieux et de proximité.',
                    ],
                ],
                'experience' => [
                    'title' => "Plus de 10 ans d'expérience",
                    'paragraphs' => [
                        'Notre expérience nous permet de mieux comprendre les besoins de nos clients et de leur proposer des solutions adaptées.',
                        'Que vous souhaitiez équiper une maison, un appartement, un bureau, une entreprise ou une institution, notre équipe est là pour vous accompagner.',
                    ],
                ],
                'home_section' => [
                    'title' => 'Pour votre maison',
                    'intro' => "Donnez à votre maison le confort et le style qu'elle mérite.",
                    'list_label' => 'Découvrez nos solutions pour votre intérieur :',
                    'items' => [
                        'Salons et meubles',
                        'Armoires et rangements',
                        'Réfrigérateurs',
                        'Machines à laver',
                        'Équipements électroménagers',
                        'Et bien plus encore',
                    ],
                    'footer_note' => 'Un besoin particulier ? Contactez-nous et nous vous conseillerons.',
                ],
                'business_section' => [
                    'title' => 'Pour votre entreprise',
                    'intro' => "DK HOMETECH accompagne également les entreprises, bureaux et institutions dans leurs projets d'équipement.",
                    'list_label' => 'Nous pouvons vous accompagner pour :',
                    'items' => [
                        'Mobilier de bureau',
                        'Armoires de rangement',
                        'Bureaux et espaces de travail',
                        'Aménagement de locaux',
                        'Commandes en quantité',
                        'Demandes de devis professionnels',
                    ],
                    'cta_label' => 'Demander un devis',
                    'cta_href' => '/devis',
                ],
                'delivery' => [
                    'title' => 'Livraison partout au Sénégal',
                    'text' => 'Vous êtes à Dakar ou dans une autre région du Sénégal ? DK HOMETECH livre ses produits partout au Sénégal.',
                    'highlight' => 'Vous choisissez → nous vous accompagnons → nous livrons.',
                ],
                'values' => [
                    'title' => 'Nos valeurs',
                    'items' => [
                        ['title' => 'Qualité', 'text' => 'Nous sélectionnons des produits répondant aux besoins de nos clients.'],
                        ['title' => 'Prix', 'text' => 'Nous recherchons un bon rapport qualité / prix pour nos clients.'],
                        ['title' => 'Confiance', 'text' => 'Nous construisons une relation durable avec nos clients.'],
                        ['title' => 'Service', 'text' => "Nous vous accompagnons de votre demande jusqu'à la livraison."],
                    ],
                ],
                'reasons' => [
                    'title' => 'Pourquoi choisir DK HOMETECH ?',
                    'items' => [
                        ['value' => '+10 ans', 'label' => "d'expérience"],
                        ['value' => 'Tous', 'label' => 'particuliers & entreprises'],
                        ['value' => 'Sénégal', 'label' => 'livraison partout au pays'],
                        ['value' => 'WhatsApp', 'label' => 'contact rapide et simple'],
                        ['value' => 'Devis', 'label' => 'projets et commandes'],
                    ],
                ],
                'cta' => [
                    'title' => "Besoin d'un produit ?",
                    'text' => "Vous cherchez un meuble, une armoire ou un appareil électroménager ? Pas besoin de vous déplacer : envoyez-nous un message sur WhatsApp ou appelez-nous.",
                    'tagline' => 'DK HOMETECH — Qualité · Choix · Confiance',
                    'partner_line' => 'Votre partenaire pour la maison et le bureau.',
                ],
            ],
            'contact' => [
                'hero' => [
                    'eyebrow' => 'Contact',
                    'title' => 'Parlons de votre projet',
                    'subtitle' => 'WhatsApp, téléphone, devis ou message — l’équipe DK HOMETECH vous répond rapidement à Dakar.',
                ],
                'intro' => 'Une question sur un produit, une commande ou un aménagement ? Choisissez le canal le plus simple pour vous : WhatsApp, appel, devis ou formulaire ci-dessous.',
                'cta' => [
                    'title' => 'Venez nous voir en showroom',
                    'text' => 'Essayez les produits, obtenez un conseil et payez sur place si vous préférez.',
                    'primary_label' => 'Voir les showrooms',
                    'primary_href' => '/showrooms',
                    'secondary_label' => 'Demander un devis',
                    'secondary_href' => '/devis',
                ],
            ],
            'devis' => [
                'hero' => [
                    'eyebrow' => 'Devis',
                    'title' => 'Demande de devis',
                    'subtitle' => 'Particulier ou entreprise : décrivez votre besoin et nous vous recontactons avec une proposition adaptée.',
                ],
            ],
            'realizations' => [
                'hero' => [
                    'eyebrow' => 'Portfolio',
                    'title' => 'Nos réalisations',
                    'subtitle' => "Depuis plus de 10 ans, DK HOMETECH accompagne particuliers, entreprises et institutions dans leurs projets d'aménagement.",
                ],
                'cta' => [
                    'title' => 'Un projet à réaliser ?',
                    'text' => 'Parlez-nous de vos besoins — nous vous répondons rapidement.',
                ],
            ],
            'privacy' => [
                'hero' => [
                    'eyebrow' => 'Légal',
                    'title' => 'Politique de confidentialité',
                    'subtitle' => 'Comment DK HOMETECH collecte, utilise et protège vos données personnelles.',
                ],
                'intro' => 'DK HOMETECH s’engage à protéger vos données personnelles. Cette page décrit quelles informations nous collectons, pourquoi, et quels sont vos droits.',
                'sections' => [
                    [
                        'title' => 'Données collectées',
                        'body' => 'Selon votre usage du site, nous pouvons collecter : nom, e-mail, téléphone, adresse de livraison, historique de commandes, préférences (newsletter, favoris) et données techniques de navigation (cookies).',
                    ],
                    [
                        'title' => 'Finalités',
                        'body' => "• Traiter vos commandes, devis et demandes de contact\n• Vous envoyer la newsletter si vous y avez consenti\n• Améliorer le site et la sécurité (statistiques anonymisées)",
                    ],
                    [
                        'title' => 'Newsletter',
                        'body' => 'L’inscription à la newsletter est volontaire. Vous pouvez vous désabonner à tout moment via le lien présent dans chaque e-mail, ou en nous contactant.',
                    ],
                    [
                        'title' => 'Vos droits',
                        'body' => 'Vous pouvez demander l’accès, la rectification ou la suppression de vos données via notre page contact.',
                    ],
                ],
                'updated_label' => 'Dernière mise à jour : septembre 2026',
            ],
            'cgu' => [
                'hero' => [
                    'eyebrow' => 'Légal',
                    'title' => 'Conditions générales d’utilisation',
                    'subtitle' => 'Conditions d’utilisation du site DK HOMETECH.',
                ],
                'intro' => 'En accédant au site DK HOMETECH, vous acceptez les présentes conditions. Elles régissent l’utilisation du catalogue, des devis, des commandes et des services associés.',
                'sections' => [
                    [
                        'title' => 'Objet',
                        'body' => 'Le site présente des produits électroménagers et de mobilier, permet de demander un devis, de commander et de contacter notre équipe.',
                    ],
                    [
                        'title' => 'Compte & commandes',
                        'body' => 'Vous êtes responsable des informations fournies. Les prix et disponibilités peuvent évoluer ; une confirmation vous est envoyée après validation.',
                    ],
                    [
                        'title' => 'Données personnelles',
                        'body' => 'Le traitement de vos données est décrit dans notre Politique de confidentialité.',
                    ],
                    [
                        'title' => 'Contact',
                        'body' => 'Pour toute question, utilisez la page contact du site.',
                    ],
                ],
                'updated_label' => 'Dernière mise à jour : septembre 2026',
            ],
            'returns' => [
                'hero' => [
                    'eyebrow' => 'Service client',
                    'title' => 'Politique de retours & remboursements',
                    'subtitle' => 'Des conditions claires pour vos retours d’électroménager et de mobilier à Dakar et partout au Sénégal.',
                ],
                'intro' => 'Chez DK HOMETECH, votre satisfaction compte. Cette page décrit dans quels cas un retour ou un échange est possible, les délais à respecter et la marche à suivre. Les produits reconditionnés ou en déstockage peuvent être soumis à des règles spécifiques indiquées sur la fiche produit.',
                'highlights' => [
                    ['label' => 'Délai', 'value' => '7 jours', 'hint' => 'après réception'],
                    ['label' => 'État', 'value' => 'Neuf', 'hint' => 'emballage d’origine'],
                    ['label' => 'Traitement', 'value' => '48–72 h', 'hint' => 'après validation'],
                    ['label' => 'Contact', 'value' => 'WhatsApp', 'hint' => 'ou page Contact'],
                ],
                'steps' => [
                    ['title' => 'Contactez-nous', 'text' => 'Via WhatsApp, téléphone ou formulaire Contact, indiquez votre n° de commande et le motif du retour.'],
                    ['title' => 'Validation', 'text' => 'Notre équipe vérifie l’éligibilité (délai, état du produit, type d’article) sous 24 à 48 h ouvrées.'],
                    ['title' => 'Retour / reprise', 'text' => 'Selon le cas : dépôt en showroom, reprise à domicile (frais éventuels communiqués à l’avance) ou échange sur place.'],
                    ['title' => 'Remboursement', 'text' => 'Une fois le produit contrôlé, remboursement ou avoir selon le mode de paiement initial (Wave, Orange Money, cash, etc.).'],
                ],
                'eligible_title' => 'Produits éligibles au retour',
                'eligible' => [
                    'Produit non utilisé, non installé, dans son emballage d’origine avec accessoires et notice',
                    'Défaut constaté à la livraison (choc, pièce manquante) signalé sous 48 h avec photos',
                    'Erreur de référence / modèle livré différent de la commande',
                    'Mobilier non monté, sans rayure ni usure, emballage intact',
                ],
                'excluded_title' => 'Cas non couverts',
                'excluded' => [
                    'Produits reconditionnés, « ventes flash » ou déstockage marqués « ni repris ni échangés »',
                    'Appareils déjà installés, branchés ou ayant servi (hors défaut de fabrication sous garantie)',
                    'Emballage ouvert pour les articles hygiène / literie / produits scellés',
                    'Dommages dus à une mauvaise utilisation, un mauvais branchement ou un transport après livraison',
                    'Commandes professionnelles sur devis B2B (conditions contractuelles spécifiques)',
                ],
                'sections' => [
                    [
                        'title' => 'Délai de retour',
                        'body' => "Vous disposez de 7 jours calendaires à compter de la date de réception pour demander un retour (hors exceptions indiquées sur la fiche produit).\n\nPassé ce délai, seuls les recours liés à la garantie constructeur ou à un défaut de fabrication restent applicables.",
                    ],
                    [
                        'title' => 'État du produit',
                        'body' => "Le produit doit être rendu dans l’état dans lequel il a été livré : emballage d’origine, étiquettes, accessoires, notice et câbles.\n\nTout produit présentant des traces d’usage, de montage, de rayure ou de salissure pourra être refusé ou faire l’objet d’une décote.",
                    ],
                    [
                        'title' => 'Frais de retour',
                        'body' => "• Erreur de notre part ou produit défectueux à la livraison : frais de reprise à notre charge.\n• Changement d’avis (produit conforme) : frais de retour éventuellement à votre charge — montant communiqué avant validation.\n• Dépôt volontaire en showroom : souvent sans frais de transport.",
                    ],
                    [
                        'title' => 'Remboursements',
                        'body' => "Après contrôle qualité, le remboursement est effectué sous 5 à 10 jours ouvrés selon le canal de paiement initial (Wave, Orange Money, virement ou espèces en magasin).\n\nUn avoir valable 90 jours peut être proposé en alternative, sur demande.",
                    ],
                    [
                        'title' => 'Garantie & SAV',
                        'body' => "Les retours « changement d’avis » sont distincts de la garantie. En cas de panne après usage, contactez notre SAV / service réparation : un diagnostic sera proposé (sous réserve de la garantie constructeur et des conditions d’installation).",
                    ],
                ],
                'faq' => [
                    [
                        'q' => 'Puis-je retourner un réfrigérateur déjà branché ?',
                        'a' => 'Non pour un simple changement d’avis. Un appareil déjà branché ou installé n’est pas repris, sauf défaut de fabrication avéré sous garantie ou non-conformité à la livraison signalée immédiatement.',
                    ],
                    [
                        'q' => 'Que faire si le colis arrive abîmé ?',
                        'a' => 'Refusez la livraison ou notez les réserves sur le bon. Prenez des photos du carton et du produit, puis contactez-nous sous 48 h avec votre n° de commande.',
                    ],
                    [
                        'q' => 'Les meubles montés sont-ils repris ?',
                        'a' => 'En règle générale, non. Un meuble déjà monté ou abîmé lors du montage n’est pas éligible au retour « changement d’avis ». Signalez tout défaut à la réception avant montage.',
                    ],
                    [
                        'q' => 'Combien de temps pour être remboursé ?',
                        'a' => 'Après validation du retour et contrôle du produit : 5 à 10 jours ouvrés selon Wave, Orange Money ou autre mode de paiement.',
                    ],
                ],
                'cta' => [
                    'title' => 'Besoin d’un retour ou d’une assistance ?',
                    'text' => 'Notre équipe vous répond rapidement pour étudier votre demande et vous indiquer la marche à suivre.',
                    'primary_label' => 'Nous contacter',
                    'primary_href' => '/contact',
                    'secondary_label' => 'Suivre ma commande',
                    'secondary_href' => '/commande',
                ],
                'updated_label' => 'Dernière mise à jour : septembre 2026',
            ],
            'delivery' => [
                'hero' => [
                    'eyebrow' => 'Livraison',
                    'title' => 'Livraison & expédition',
                    'subtitle' => 'Livraison à domicile, retrait en showroom et délais clairs pour Dakar et tout le Sénégal.',
                ],
                'intro' => 'DK HOMETECH livre l’électroménager et le mobilier partout au Sénégal. Cette page détaille les modes de livraison, les délais indicatifs, les zones couvertes et ce qu’il faut prévoir le jour J (accès, étages, présence obligatoire).',
                'highlights' => [
                    ['label' => 'Dakar', 'value' => '24–72 h', 'hint' => 'délai indicatif'],
                    ['label' => 'Régions', 'value' => '3–7 j', 'hint' => 'selon destination'],
                    ['label' => 'Retrait', 'value' => 'Showroom', 'hint' => 'sans frais de port'],
                    ['label' => 'Paiement', 'value' => 'Flexible', 'hint' => 'Wave, OM, cash…'],
                ],
                'steps' => [
                    ['title' => 'Commande validée', 'text' => 'Après confirmation du paiement ou du devis, votre commande est préparée en magasin ou en entrepôt.'],
                    ['title' => 'Planification', 'text' => 'Nous vous contactons pour convenir d’un créneau de livraison ou d’un retrait en showroom.'],
                    ['title' => 'Transport', 'text' => 'Vos articles sont emballés et acheminés. Pour les gros volumes, une équipe peut accompagner la livraison.'],
                    ['title' => 'Réception', 'text' => 'Vérifiez l’état du colis à l’arrivée. En cas de réserve, notez-la et contactez-nous sous 48 h avec photos.'],
                ],
                'zones_title' => 'Zones & délais indicatifs',
                'zones' => [
                    ['title' => 'Dakar & banlieue', 'text' => 'Livraison généralement sous 24 à 72 h ouvrées selon stock et accessibilité (Almadies, Plateau, Parcelles, Rufisque, etc.).'],
                    ['title' => 'Thiès, Mbour, Saint-Louis…', 'text' => 'Délai indicatif 3 à 5 jours ouvrés. Un devis de transport peut être communiqué avant expédition.'],
                    ['title' => 'Autres régions', 'text' => 'Livraison nationale possible sous 5 à 7 jours ouvrés (ou plus selon l’éloignement et le volume). Contactez-nous pour un devis.'],
                    ['title' => 'Retrait showroom', 'text' => 'Disponible dès que la commande est prête. Idéal pour éviter les frais de livraison et récupérer immédiatement.'],
                ],
                'included_title' => 'Ce qui est inclus',
                'included' => [
                    'Emballage adapté électroménager / mobilier',
                    'Suivi de commande et confirmation du créneau',
                    'Aide au déchargement selon type de produit (à confirmer)',
                    'Possibilité d’installation / mise en service (service optionnel)',
                ],
                'notes_title' => 'À prévoir le jour de la livraison',
                'notes' => [
                    'Une personne majeure doit être présente pour réceptionner et signer',
                    'Accès camion / parking et passage portes / ascenseur suffisants',
                    'Pour les étages sans ascenseur : précisez-le à la commande (surcoût éventuel)',
                    'Vérifiez le colis avant de signer le bon de livraison',
                ],
                'sections' => [
                    [
                        'title' => 'Frais de livraison',
                        'body' => "Les frais dépendent de la zone, du volume et du poids. Ils sont calculés au panier ou communiqués lors de la confirmation de commande.\n\nLe retrait en showroom est gratuit. Certaines promotions peuvent offrir la livraison sur Dakar — mentionné clairement sur l’offre.",
                    ],
                    [
                        'title' => 'Gros électroménager & meubles',
                        'body' => "Réfrigérateurs, machines à laver, salons, armoires : une livraison renforcée peut être nécessaire. Nous vous indiquons à l’avance si un créneau dédié ou une équipe de manutention est requis.\n\nL’installation et le branchement ne sont pas systématiquement inclus : demandez le service dédié si besoin.",
                    ],
                    [
                        'title' => 'Retard ou absence',
                        'body' => "En cas d’absence au créneau convenu, une nouvelle livraison pourra être replanifiée. Des frais de seconde présentation peuvent s’appliquer.\n\nPrévenez-nous dès que possible pour décaler un rendez-vous.",
                    ],
                    [
                        'title' => 'Colis endommagé',
                        'body' => "Refusez la livraison ou émettez des réserves précises sur le bon. Photographiez l’emballage et le produit, puis contactez le service client sous 48 h avec votre numéro de commande.",
                    ],
                ],
                'faq' => [
                    [
                        'q' => 'Livrez-vous hors de Dakar ?',
                        'a' => 'Oui, partout au Sénégal. Les délais et frais varient selon la destination et le volume. Demandez un devis avant validation.',
                    ],
                    [
                        'q' => 'Puis-je retirer ma commande en magasin ?',
                        'a' => 'Oui. Choisissez le retrait showroom au checkout (ou précisez-le à la commande). Vous serez notifié dès que c’est prêt.',
                    ],
                    [
                        'q' => 'L’installation est-elle incluse ?',
                        'a' => 'Pas par défaut. L’installation / mise en service est un service optionnel (branchement, réglages). Demandez-le à la commande ou via WhatsApp.',
                    ],
                    [
                        'q' => 'Comment suivre ma livraison ?',
                        'a' => 'Après validation, notre équipe vous contacte pour le créneau. Vous pouvez aussi suivre l’état de commande depuis votre compte ou la page commande.',
                    ],
                ],
                'cta' => [
                    'title' => 'Une question sur votre livraison ?',
                    'text' => 'Indiquez votre zone et le type de produit : nous vous confirmons délai et tarif.',
                    'primary_label' => 'Nous contacter',
                    'primary_href' => '/contact',
                    'secondary_label' => 'Voir les showrooms',
                    'secondary_href' => '/showrooms',
                ],
                'updated_label' => 'Dernière mise à jour : septembre 2026',
            ],
            'payment' => [
                'hero' => [
                    'eyebrow' => 'Paiement',
                    'title' => 'Informations de paiement',
                    'subtitle' => 'Wave, Orange Money, cash à la livraison et autres modes acceptés — simples, sécurisés et adaptés au Sénégal.',
                ],
                'intro' => 'Chez DK HOMETECH, vous choisissez le mode de paiement le plus pratique pour vous. Les options disponibles sont confirmées au moment de la commande. Cette page décrit chaque moyen, les délais de validation et nos conseils de sécurité.',
                'highlights' => [
                    ['label' => 'Mobile Money', 'value' => 'Wave & OM', 'hint' => 'rapide et courant'],
                    ['label' => 'Livraison', 'value' => 'Cash', 'hint' => 'paiement à réception'],
                    ['label' => 'Sécurité', 'value' => 'Priorité', 'hint' => 'jamais de code secret'],
                    ['label' => 'Facture', 'value' => 'Reçu', 'hint' => 'après validation'],
                ],
                'methods' => [
                    [
                        'key' => 'wave',
                        'name' => 'Wave',
                        'badge' => 'Populaire',
                        'summary' => 'Paiement mobile rapide via votre compte Wave.',
                        'points' => [
                            'Confirmation souvent immédiate après validation',
                            'Idéal pour les commandes en ligne et les acomptes',
                            'Conservez la capture / référence de transaction',
                        ],
                    ],
                    [
                        'key' => 'orange_money',
                        'name' => 'Orange Money',
                        'badge' => 'Mobile Money',
                        'summary' => 'Payez avec Orange Money selon les instructions communiquées à la commande.',
                        'points' => [
                            'Utilisez uniquement le numéro / marchand officiel DK HOMETECH',
                            'Vérifiez le montant avant de valider',
                            'Envoyez la preuve de paiement si demandé',
                        ],
                    ],
                    [
                        'key' => 'cash',
                        'name' => 'Paiement à la livraison',
                        'badge' => 'Cash',
                        'summary' => 'Réglez en espèces à la réception (selon zone et type de commande).',
                        'points' => [
                            'Disponible principalement sur Dakar / zones couvertes',
                            'Préparez l’appoint si possible',
                            'Un reçu vous est remis après paiement',
                        ],
                    ],
                    [
                        'key' => 'showroom',
                        'name' => 'Paiement en showroom',
                        'badge' => 'Magasin',
                        'summary' => 'Payez sur place lors du retrait ou de la finalisation en magasin.',
                        'points' => [
                            'Cash et Mobile Money selon disponibilité du point de vente',
                            'Idéal pour les gros volumes et projets sur devis',
                            'Facture / reçu remis au comptoir',
                        ],
                    ],
                ],
                'steps' => [
                    ['title' => 'Choisissez votre mode', 'text' => 'Au panier / checkout (ou avec notre équipe), sélectionnez Wave, Orange Money, cash à la livraison ou paiement magasin.'],
                    ['title' => 'Validez le paiement', 'text' => 'Suivez les instructions affichées. Pour le Mobile Money, confirmez uniquement vers nos coordonnées officielles.'],
                    ['title' => 'Confirmation', 'text' => 'Dès validation, vous recevez une confirmation (SMS, WhatsApp ou e-mail) et la préparation de commande démarre.'],
                    ['title' => 'Livraison ou retrait', 'text' => 'Nous planifions la livraison ou le retrait showroom selon votre choix.'],
                ],
                'security_title' => 'Sécurité & bonnes pratiques',
                'security' => [
                    'DK HOMETECH ne vous demandera jamais votre code secret Wave / Orange Money',
                    'Méfiez-vous des faux numéros ou liens reçus hors de nos canaux officiels',
                    'Vérifiez toujours le montant et le destinataire avant de valider',
                    'En cas de doute, contactez-nous via la page Contact ou WhatsApp du site',
                ],
                'sections' => [
                    [
                        'title' => 'Quand le paiement est-il débité ?',
                        'body' => "• Mobile Money (Wave / Orange Money) : généralement dès validation de la transaction.\n• Cash à la livraison : au moment de la réception.\n• Showroom : lors du règlement en magasin.\n\nPour certaines commandes (gros volumes, devis B2B), un acompte peut être demandé avant préparation ou expédition.",
                    ],
                    [
                        'title' => 'Preuve de paiement',
                        'body' => "Conservez la capture d’écran ou la référence de transaction. Elle peut être demandée pour accélérer la confirmation, surtout hors heures ouvrées.\n\nUne fois le paiement reconnu, un reçu / confirmation de commande vous est transmis.",
                    ],
                    [
                        'title' => 'Remboursements',
                        'body' => "En cas d’annulation ou de retour validé, le remboursement suit en principe le même canal que le paiement initial (Wave, Orange Money, cash en magasin, etc.), dans les délais indiqués sur la page Retours.",
                    ],
                    [
                        'title' => 'Commandes professionnelles',
                        'body' => "Pour les entreprises et institutions, des modalités spécifiques (devis, acompte, virement) peuvent s’appliquer. Contactez le service commercial pour un accompagnement dédié.",
                    ],
                ],
                'faq' => [
                    [
                        'q' => 'Puis-je payer entièrement à la livraison ?',
                        'a' => 'Oui, lorsque l’option « paiement à la livraison » est activée pour votre zone et votre type de commande. Certaines commandes (hors stock, gros volumes) peuvent nécessiter un acompte.',
                    ],
                    [
                        'q' => 'Wave et Orange Money sont-ils sécurisés ?',
                        'a' => 'Oui, ce sont des paiements via vos applications officielles. Ne communiquez jamais votre code secret. Utilisez uniquement les coordonnées fournies par DK HOMETECH.',
                    ],
                    [
                        'q' => 'Que faire si mon paiement Mobile Money est débité mais la commande n’est pas confirmée ?',
                        'a' => 'Contactez-nous immédiatement avec la référence de transaction et votre numéro de commande / téléphone. Nous vérifions et confirmons sous les meilleurs délais.',
                    ],
                    [
                        'q' => 'Puis-je obtenir une facture ?',
                        'a' => 'Oui. Un reçu ou une facture peut être fourni selon le type de commande (particulier ou professionnel). Précisez-le à la commande ou en showroom.',
                    ],
                ],
                'cta' => [
                    'title' => 'Besoin d’aide pour payer ?',
                    'text' => 'Notre équipe vous guide pour Wave, Orange Money ou le paiement à la livraison.',
                    'primary_label' => 'Nous contacter',
                    'primary_href' => '/contact',
                    'secondary_label' => 'Voir le panier',
                    'secondary_href' => '/panier',
                ],
                'updated_label' => 'Dernière mise à jour : septembre 2026',
            ],
            'cookies' => [
                'hero' => [
                    'eyebrow' => 'Légal',
                    'title' => 'Politique de cookies',
                    'subtitle' => 'Comment DK HOMETECH utilise les cookies et technologies similaires sur le site.',
                ],
                'intro' => 'Cette politique explique ce que sont les cookies, lesquels nous utilisons, pourquoi, et comment vous pouvez les gérer. Elle complète notre Politique de confidentialité.',
                'highlights' => [
                    ['label' => 'Essentiels', 'value' => 'Obligatoires', 'hint' => 'session & sécurité'],
                    ['label' => 'Mesure', 'value' => 'Statistiques', 'hint' => 'amélioration du site'],
                    ['label' => 'Préférences', 'value' => 'Confort', 'hint' => 'langue, panier…'],
                    ['label' => 'Contrôle', 'value' => 'Vous', 'hint' => 'navigateur / paramètres'],
                ],
                'categories' => [
                    [
                        'name' => 'Cookies essentiels',
                        'badge' => 'Nécessaires',
                        'summary' => 'Indispensables au fonctionnement du site (sécurité, session, panier).',
                        'points' => [
                            'Authentification client / admin (session Sanctum)',
                            'Protection CSRF et sécurité des formulaires',
                            'Mémorisation du panier et des préférences de base',
                        ],
                    ],
                    [
                        'name' => 'Cookies de performance',
                        'badge' => 'Statistiques',
                        'summary' => 'Nous aident à comprendre l’usage du site de façon agrégée.',
                        'points' => [
                            'Pages les plus consultées, parcours d’achat',
                            'Mesure de charge et détection d’erreurs',
                            'Données utilisées pour améliorer l’expérience',
                        ],
                    ],
                    [
                        'name' => 'Cookies de préférences',
                        'badge' => 'Confort',
                        'summary' => 'Mémorisent vos choix pour personnaliser l’affichage.',
                        'points' => [
                            'Filtres / tri récemment utilisés (le cas échéant)',
                            'Préférences d’affichage ou de notification',
                            'Amélioration du confort de navigation',
                        ],
                    ],
                    [
                        'name' => 'Cookies tiers',
                        'badge' => 'Partenaires',
                        'summary' => 'Peuvent être déposés par des services externes si activés (cartes, réseaux, analytics).',
                        'points' => [
                            'Intégrations éventuelles (ex. cartes Google Maps)',
                            'Boutons / contenus de réseaux sociaux si embarqués',
                            'Régis aussi par les politiques de ces tiers',
                        ],
                    ],
                ],
                'sections' => [
                    [
                        'title' => 'Qu’est-ce qu’un cookie ?',
                        'body' => "Un cookie est un petit fichier texte déposé sur votre appareil lorsque vous visitez un site. Il permet de reconnaître votre navigateur, de sécuriser votre session ou de mémoriser certaines informations (panier, préférences).\n\nDes technologies similaires (stockage local, pixels) peuvent être utilisées dans le même but.",
                    ],
                    [
                        'title' => 'Base légale & durée',
                        'body' => "• Cookies essentiels : intérêt légitime / nécessité contractuelle pour fournir le service demandé.\n• Cookies non essentiels : dépôt selon le cadre applicable et, le cas échéant, votre consentement.\n\nLa durée de vie varie : cookies de session (supprimés à la fermeture du navigateur) ou cookies persistants (quelques jours à plusieurs mois selon leur finalité).",
                    ],
                    [
                        'title' => 'Comment gérer les cookies ?',
                        'body' => "Vous pouvez configurer votre navigateur pour refuser ou supprimer les cookies (Chrome, Firefox, Safari, Edge…). Attention : bloquer les cookies essentiels peut empêcher la connexion, le panier ou certaines pages de fonctionner correctement.\n\nPour toute question relative à vos données, consultez aussi notre Politique de confidentialité ou contactez-nous.",
                    ],
                    [
                        'title' => 'Mise à jour de cette politique',
                        'body' => "Nous pouvons actualiser cette page pour refléter l’évolution du site ou de la réglementation. La date de mise à jour est indiquée en bas de page. Nous vous invitons à la consulter régulièrement.",
                    ],
                ],
                'faq' => [
                    [
                        'q' => 'Puis-je refuser tous les cookies ?',
                        'a' => 'Vous pouvez bloquer la plupart des cookies via votre navigateur. Les cookies essentiels restent nécessaires au fonctionnement (connexion, panier, sécurité).',
                    ],
                    [
                        'q' => 'Les cookies servent-ils à la publicité ?',
                        'a' => 'DK HOMETECH utilise principalement des cookies pour le fonctionnement, la sécurité et l’amélioration du site. Si des outils publicitaires tiers sont ajoutés plus tard, cette page sera mise à jour.',
                    ],
                    [
                        'q' => 'Mes données de paiement sont-elles dans un cookie ?',
                        'a' => 'Non. Les informations de paiement Mobile Money ou cash ne sont pas stockées dans des cookies du site.',
                    ],
                    [
                        'q' => 'Où en savoir plus sur mes données personnelles ?',
                        'a' => 'Consultez la Politique de confidentialité, ou contactez-nous via la page Contact.',
                    ],
                ],
                'cta' => [
                    'title' => 'Une question sur vos données ?',
                    'text' => 'Notre équipe peut vous préciser quels cookies sont utilisés et comment exercer vos droits.',
                    'primary_label' => 'Politique de confidentialité',
                    'primary_href' => '/politique-confidentialite',
                    'secondary_label' => 'Nous contacter',
                    'secondary_href' => '/contact',
                ],
                'updated_label' => 'Dernière mise à jour : septembre 2026',
            ],
            'how_to_order' => [
                'hero' => [
                    'eyebrow' => 'Guide d’achat',
                    'title' => 'Comment commander',
                    'subtitle' => 'En ligne, WhatsApp ou en showroom — passez commande chez DK HOMETECH en quelques étapes simples.',
                ],
                'intro' => 'Commander chez DK HOMETECH est simple : parcourez le catalogue, ajoutez vos produits au panier, choisissez livraison ou retrait, puis payez comme vous voulez (Wave, Orange Money, cash…). Vous pouvez aussi commander via WhatsApp, en magasin ou demander un devis pour un projet plus large.',
                'highlights' => [
                    ['label' => 'En ligne', 'value' => '24/7', 'hint' => 'site & panier'],
                    ['label' => 'WhatsApp', 'value' => 'Rapide', 'hint' => 'conseil + commande'],
                    ['label' => 'Showroom', 'value' => 'Sur place', 'hint' => 'essayer & payer'],
                    ['label' => 'Paiement', 'value' => 'Flexible', 'hint' => 'Wave, OM, cash…'],
                ],
                'channels_title' => 'Choisissez votre façon de commander',
                'channels' => [
                    [
                        'key' => 'online',
                        'name' => 'Sur le site',
                        'badge' => 'Recommandé',
                        'summary' => 'Parcourez le catalogue, gérez votre panier et validez en quelques clics.',
                        'points' => [
                            'Disponible 24 h/24',
                            'Prix et stock affichés',
                            'Suivi de commande depuis votre compte',
                        ],
                        'cta_label' => 'Voir les produits',
                        'cta_href' => '/produits',
                    ],
                    [
                        'key' => 'whatsapp',
                        'name' => 'Par WhatsApp',
                        'badge' => 'Conseil',
                        'summary' => 'Envoyez-nous le produit ou une photo : on vous confirme dispo, prix et délai.',
                        'points' => [
                            'Réponse rapide aux heures d’ouverture',
                            'Idéal pour comparer plusieurs modèles',
                            'Confirmation écrite de votre commande',
                        ],
                        'cta_label' => 'Écrire sur WhatsApp',
                        'cta_href' => 'whatsapp',
                    ],
                    [
                        'key' => 'showroom',
                        'name' => 'En showroom',
                        'badge' => 'Magasin',
                        'summary' => 'Venez voir, toucher et essayer avant d’acheter. Paiement et retrait sur place.',
                        'points' => [
                            'Conseil en magasin',
                            'Paiement cash ou Mobile Money',
                            'Retrait immédiat selon stock',
                        ],
                        'cta_label' => 'Voir les showrooms',
                        'cta_href' => '/showrooms',
                    ],
                    [
                        'key' => 'devis',
                        'name' => 'Demande de devis',
                        'badge' => 'Projets',
                        'summary' => 'Pour un aménagement, un volume important ou une commande professionnelle.',
                        'points' => [
                            'Devis détaillé sous 24–48 h',
                            'Accompagnement sur mesure',
                            'Conditions adaptées B2B / gros volumes',
                        ],
                        'cta_label' => 'Demander un devis',
                        'cta_href' => '/devis',
                    ],
                ],
                'steps_title' => 'Commander en ligne en 5 étapes',
                'steps_subtitle' => 'Du catalogue à la confirmation, le parcours classique.',
                'steps' => [
                    ['title' => 'Choisissez vos produits', 'text' => 'Parcourez les catégories, filtres et fiches produit. Vérifiez les options (couleur, taille, état neuf / reconditionné).'],
                    ['title' => 'Ajoutez au panier', 'text' => 'Sélectionnez la quantité puis ouvrez le panier pour contrôler le total avant de continuer.'],
                    ['title' => 'Livraison ou retrait', 'text' => 'Indiquez votre zone de livraison à domicile, ou choisissez le retrait en showroom sans frais de port.'],
                    ['title' => 'Payez', 'text' => 'Wave, Orange Money, cash à la livraison ou paiement en magasin — selon les options activées pour votre commande.'],
                    ['title' => 'Confirmation', 'text' => 'Vous recevez une confirmation. Notre équipe prépare la commande et vous contacte pour le créneau ou le retrait.'],
                ],
                'tips_title' => 'Conseils pour une commande sans stress',
                'tips' => [
                    'Vérifiez le stock et les dimensions (accès escalier, porte, véhicule) avant de valider.',
                    'Conservez votre n° de commande et la preuve de paiement Mobile Money.',
                    'Pour un gros appareil ou un salon, prévoyez quelqu’un sur place le jour de la livraison.',
                    'Un doute sur le modèle ? Demandez conseil sur WhatsApp ou en showroom avant d’acheter.',
                ],
                'checklist_title' => 'Avant de valider',
                'checklist' => [
                    'Coordonnées téléphone / WhatsApp correctes',
                    'Adresse ou showroom de retrait choisi',
                    'Mode de paiement sélectionné',
                    'Total (produits + livraison) vérifié',
                ],
                'sections' => [
                    [
                        'title' => 'Compte client',
                        'body' => "Créer un compte facilite le suivi des commandes, les notifications et la réutilisation de vos infos.\n\nVous pouvez aussi commander en invité : nous vous contacterons avec les coordonnées fournies au checkout.",
                    ],
                    [
                        'title' => 'Après la commande',
                        'body' => "Dès confirmation, la préparation démarre. Selon le stock, le délai peut être immédiat (retrait) ou planifié (livraison).\n\nSuivez l’état depuis votre espace compte ou contactez-nous avec votre n° de commande. Pour les détails de port et de réception, consultez la page Livraison.",
                    ],
                    [
                        'title' => 'Modification ou annulation',
                        'body' => "Tant que la commande n’est pas préparée / expédiée, une modification ou annulation est souvent possible — contactez-nous rapidement.\n\nUne fois livrée, les conditions de retour s’appliquent (voir page Retours).",
                    ],
                ],
                'faq' => [
                    [
                        'q' => 'Dois-je créer un compte pour commander ?',
                        'a' => 'Non, ce n’est pas obligatoire. Un compte simplifie le suivi et les prochaines commandes. Sinon, renseignez vos coordonnées au moment de valider.',
                    ],
                    [
                        'q' => 'Puis-je commander uniquement sur WhatsApp ?',
                        'a' => 'Oui. Envoyez le lien du produit, la référence ou une description. Nous confirmons disponibilité, prix, livraison et mode de paiement, puis formalisons la commande.',
                    ],
                    [
                        'q' => 'Comment savoir si mon produit est en stock ?',
                        'a' => 'La fiche produit indique en général la disponibilité. En cas de doute, WhatsApp ou le showroom confirment le stock en temps réel.',
                    ],
                    [
                        'q' => 'Quels sont les modes de paiement ?',
                        'a' => 'Wave, Orange Money, cash à la livraison et paiement en showroom sont les options les plus courantes. Voir la page Paiement pour le détail.',
                    ],
                    [
                        'q' => 'Puis-je retirer ma commande en magasin ?',
                        'a' => 'Oui : choisissez le retrait showroom au checkout (ou demandez-le sur WhatsApp). Dès que la commande est prête, vous récupérez vos articles sans frais de livraison.',
                    ],
                    [
                        'q' => 'Comment suivre ma commande ?',
                        'a' => 'Connectez-vous à votre compte, ou contactez-nous avec votre n° de commande. Nous vous tenons informé des étapes (préparation, livraison, prêt au retrait).',
                    ],
                ],
                'cta' => [
                    'title' => 'Prêt à commander ?',
                    'text' => 'Parcourez le catalogue ou contactez-nous : on vous guide jusqu’à la livraison ou le retrait.',
                    'primary_label' => 'Voir les produits',
                    'primary_href' => '/produits',
                    'secondary_label' => 'Demander un devis',
                    'secondary_href' => '/devis',
                ],
                'updated_label' => 'Dernière mise à jour : septembre 2026',
            ],
        ];
    }

    public function allSettings(): array
    {
        try {
            return Cache::remember('site:settings:v2', 600, function () {
                return $this->buildAllSettings();
            });
        } catch (\Throwable $e) {
            // Cache fichier corrompu / JSON invalide → reconstruit sans cache
            report($e);
            try {
                Cache::forget('site:settings:v2');
            } catch (\Throwable) {
                // ignore
            }

            return $this->buildAllSettings();
        }
    }

    public function forgetSettingsCache(): void
    {
        Cache::forget('site:settings:v2');
        Cache::forget('site:settings:v1');
    }

    protected function buildAllSettings(): array
    {
        $defaults = self::defaultSettings();
        $stored = [];

        // Lecture défensive : une ligne JSON invalide ne doit pas faire planter toute l'API
        foreach (Setting::query()->select(['key', 'value'])->cursor() as $row) {
            try {
                $stored[$row->key] = $row->value;
            } catch (\Throwable) {
                $raw = $row->getAttributes()['value'] ?? null;
                if (is_string($raw)) {
                    $decoded = json_decode($raw, true);
                    $stored[$row->key] = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
                } else {
                    $stored[$row->key] = null;
                }
            }
        }

        $out = [];
        foreach ($defaults as $key => $default) {
            $value = $stored[$key] ?? $default;
            $out[$key] = is_array($default) && is_array($value)
                ? array_replace_recursive($default, $value)
                : (is_array($default) ? $default : $value);
        }

        foreach ($stored as $key => $value) {
            if (! array_key_exists($key, $out)) {
                $out[$key] = $value;
            }
        }

        if (isset($out['contact']) && is_array($out['contact'])) {
            foreach ($out['contact'] as $k => $v) {
                if ($v === null) {
                    $out['contact'][$k] = '';
                }
            }
        }

        if (isset($out['brand']) && is_array($out['brand'])) {
            foreach ($out['brand'] as $k => $v) {
                if ($v === null) {
                    $out['brand'][$k] = '';
                }
            }
        }

        return $out;
    }

    public function updateSettings(array $payload): array
    {
        $current = $this->buildAllSettings();

        if (isset($payload['contact']) && is_array($payload['contact'])) {
            foreach ($payload['contact'] as $k => $v) {
                if ($v === null) {
                    $payload['contact'][$k] = '';
                }
            }
        }

        if (isset($payload['brand']) && is_array($payload['brand'])) {
            foreach ($payload['brand'] as $k => $v) {
                if ($v === null) {
                    $payload['brand'][$k] = '';
                }
            }
        }

        foreach ($payload as $key => $value) {
            if (is_array($value) && isset($current[$key]) && is_array($current[$key])) {
                $value = array_replace_recursive($current[$key], $value);
            }

            Setting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        // Accent unique : synchroniser le footer avec accent_primary du thème global
        if (isset($payload['theme']) && is_array($payload['theme'])) {
            $accent = $payload['theme']['accent_primary']
                ?? ($current['theme']['accent_primary'] ?? null);
            if (is_string($accent) && $accent !== '') {
                $footerStored = Setting::query()->where('key', 'footer')->value('value');
                $footer = is_array($footerStored) ? $footerStored : [];
                $footerTheme = is_array($footer['theme'] ?? null) ? $footer['theme'] : [];
                $footerTheme['accent'] = $accent;
                $footer['theme'] = $footerTheme;
                Setting::query()->updateOrCreate(['key' => 'footer'], ['value' => $footer]);
                if (class_exists(FooterService::class)) {
                    app(FooterService::class)->forgetCache();
                }
            }
        }

        $this->forgetSettingsCache();

        return $this->allSettings();
    }

    public function pageBlocks(string $pageKey): array
    {
        $defaults = self::defaultPages()[$pageKey] ?? [];
        $blocks = PageBlock::query()
            ->where('page_key', $pageKey)
            ->orderBy('sort_order')
            ->get();

        $out = $defaults;
        foreach ($blocks as $block) {
            $content = $block->content ?? [];
            $isList = is_array($content) && array_is_list($content);
            if (
                ! $isList
                && isset($defaults[$block->block_key])
                && is_array($defaults[$block->block_key])
                && is_array($content)
            ) {
                $out[$block->block_key] = array_replace_recursive($defaults[$block->block_key], $content);
            } else {
                $out[$block->block_key] = $content;
            }
        }

        return [
            'page_key' => $pageKey,
            'blocks' => $out,
        ];
    }

    public function updatePageBlocks(string $pageKey, array $blocks): array
    {
        $sort = 0;
        foreach ($blocks as $blockKey => $content) {
            PageBlock::query()->updateOrCreate(
                ['page_key' => $pageKey, 'block_key' => $blockKey],
                ['content' => $content, 'sort_order' => $sort++]
            );
        }

        return $this->pageBlocks($pageKey);
    }
}
