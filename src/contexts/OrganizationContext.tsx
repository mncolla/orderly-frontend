import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Organization } from '../types/organization';

interface OrganizationContextType {
  selectedOrganization: Organization | null;
  setSelectedOrganization: (org: Organization | null) => void;
  selectedOrganizationId: string | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  const value: OrganizationContextType = {
    selectedOrganization,
    setSelectedOrganization,
    selectedOrganizationId: selectedOrganization?.id || null,
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};
