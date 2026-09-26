/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "api.dkhometech.sn" },
      { protocol: "https", hostname: "dkhometech.sn" },
      { protocol: "https", hostname: "www.dkhometech.sn" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/promo",
        destination: "/promotions",
        permanent: true,
      },
      {
        source: "/promo/:path*",
        destination: "/promotions/:path*",
        permanent: true,
      },
      {
        source: "/cart",
        destination: "/panier",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/compte/connexion",
        permanent: true,
      },
      {
        source: "/product/:slug",
        destination: "/produits/:slug",
        permanent: true,
      },
      {
        source: "/category/:slug",
        destination: "/categorie/:slug",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/panier",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/panier/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/commande/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/compte/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

module.exports = nextConfig;
