interface SeoProps {
  title: string;
  description: string;
  path: string;
}

import { Helmet } from "react-helmet-async";

const BASE = (import.meta.env.VITE_PUBLIC_SITE_URL ?? "http://localhost:8080").replace(/\/$/, "");

const Seo = ({ title, description, path }: SeoProps) => {
  const url = `${BASE}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
};

export default Seo;
