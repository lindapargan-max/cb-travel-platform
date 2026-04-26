import { useEffect } from 'react';

const DEFAULT_OG_IMAGE = 'https://cbtravel.uk/icons/icon-512.png';
const SITE_NAME = 'CB Travel';

interface SEOProps {
  title: string;
  description?: string;
  ogImage?: string;
  noIndex?: boolean;
}

function setMetaByName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setMetaByProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function useSEO({ title, description, ogImage, noIndex }: SEOProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const desc = description || 'CB Travel — Award-winning luxury travel agency specialising in bespoke holidays, cruises, and tailor-made travel experiences worldwide.';
    const img = ogImage || DEFAULT_OG_IMAGE;

    setMetaByName('description', desc);
    setMetaByName('twitter:card', 'summary_large_image');
    setMetaByName('twitter:title', fullTitle);
    setMetaByName('twitter:description', desc);
    setMetaByName('twitter:image', img);

    setMetaByProperty('og:title', fullTitle);
    setMetaByProperty('og:description', desc);
    setMetaByProperty('og:image', img);
    setMetaByProperty('og:site_name', SITE_NAME);
    setMetaByProperty('og:type', 'website');

    if (noIndex) {
      setMetaByName('robots', 'noindex,nofollow');
    }
  }, [title, description, ogImage, noIndex]);
}
