export function updatePageTitle(academyName?: string | null, pageName?: string) {
  const baseTitle = academyName || 'Student Portal';
  const fullTitle = pageName ? `${pageName} - ${baseTitle}` : baseTitle;
  
  document.title = fullTitle;
  
  // Update meta tags if they exist
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', fullTitle);
  }
  
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute('content', fullTitle);
  }
}