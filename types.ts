
export interface LegislationItem {
  id: string;
  jurisdiction: 'Federal' | 'Provincial';
  act_name: string;
  legislation_name: string;
  section: string;
  heading: string;
  aggregate_paragraph: string;
  management_domain: string;
  iucn_threat: string;
  clause_type: string;
  scope: string;
  management_domain_keywords: string;
  clause_type_keywords: string;
  aggregate_keywords?: string;
  actionable_type?: string;
  responsible_official?: string;
  discretion_type?: string;
}

export interface FilterState {
  jurisdiction: 'All' | 'Federal' | 'Provincial';
  managementDomain: string;
  searchTerm: string;
  actName: string;
  legislationName: string;
}

export interface FilterOption {
  name: string;
  count: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export type AppTab = 'dashboard' | 'explorer';