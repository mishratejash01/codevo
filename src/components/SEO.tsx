import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string; 
}

export const SEO = ({ title, description, url = 'https://codevo.co.in', image = '/og-image.png' }: SEOProps) => {
  
  // 👇 FIX: Ensure the image URL is always "Absolute" (starts with https://)
  // WhatsApp and LinkedIn will IGNORE links that look like "/image.png"
  const absoluteImage = image.startsWith('http') 
    ? image 
    : `https://codevo.co.in${image.startsWith('/') ? image : `/${image}`}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title} | Codevo</title>
      <meta name="description" content={description} />
      
      {/* Social Media (Open Graph) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {/* 👇 Uses the fixed absolute URL */}
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {/* 👇 Uses the fixed absolute URL */}
      <meta name="twitter:image" content={absoluteImage} />
      
      {/* Structured Data for Organization (Helps with Sitelinks) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Codevo",
          "url": "https://codevo.co.in",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://codevo.co.in/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
};
