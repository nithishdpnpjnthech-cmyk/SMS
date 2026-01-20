import { useState, useEffect } from 'react';

interface AcademyBranding {
  academyName: string | null;
}

export function useAcademyBranding() {
  const [branding, setBranding] = useState<AcademyBranding>({ academyName: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcademyBranding();
  }, []);

  const fetchAcademyBranding = async () => {
    try {
      const response = await fetch('/api/settings/academy');
      if (response.ok) {
        const data = await response.json();
        setBranding({ academyName: data.academyName });
      }
    } catch (error) {
      console.error('Failed to fetch academy branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPortalName = () => {
    return branding.academyName || 'Student Portal';
  };

  return {
    branding,
    loading,
    getPortalName,
  };
}