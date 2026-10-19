import React, { useState, useEffect } from 'react';
import { getTransparentLogoDataUrl } from '../utils/logoProcessor';
import { LOGO_ASSET_PATH } from '../data/defaultSites';

interface PureLogoProps {
  alt?: string;
  className?: string;
}

export const PureLogo: React.FC<PureLogoProps> = ({
  alt = 'لوگوی مرکز مثبت زندگی ۷۸۲۸',
  className = 'w-full h-full object-contain',
}) => {
  const [src, setSrc] = useState<string>(LOGO_ASSET_PATH);

  useEffect(() => {
    let mounted = true;
    getTransparentLogoDataUrl().then((dataUrl) => {
      if (mounted && dataUrl) {
        setSrc(dataUrl);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
};
