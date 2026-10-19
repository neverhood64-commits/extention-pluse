import React from 'react';
import {
  Building2,
  HeartHandshake,
  Sparkles,
  Briefcase,
  FileSearch,
  TicketCheck,
  CreditCard,
  Landmark,
  Headset,
  Globe,
  ExternalLink,
} from 'lucide-react';

interface PortalIconProps {
  name: string;
  className?: string;
}

export const PortalIcon: React.FC<PortalIconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'Building2':
      return <Building2 className={className} />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'FileSearch':
      return <FileSearch className={className} />;
    case 'TicketCheck':
      return <TicketCheck className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'Landmark':
      return <Landmark className={className} />;
    case 'Headset':
      return <Headset className={className} />;
    case 'ExternalLink':
      return <ExternalLink className={className} />;
    default:
      return <Globe className={className} />;
  }
};
