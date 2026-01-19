// types.ts

export interface LegislationItem {
  // IDs for joining
  paragraph_id: string;
  legislation_id: string;
  
  // Legislation metadata
  jurisdiction: string;
  act_name: string;
  legislation_name: string;
  url: string;
  agency: string;
  
  // Paragraph data
  section: string;
  heading: string;
  aggregate_paragraph: string;
  
  // Labels
  management_domain: string;
  iucn_threat: string;
  clause_type: string;
  scope: string;
  
  // Actionable clause data
  actionable_type: string;
  responsible_official: string;
  discretion_type: string;
}

export interface FilterState {
  jurisdiction: string;
  managementDomain: string;
  searchTerm: string;
  actName: string;
  legislationName: string;
}

export interface FilterOption {
  name: string;
  count: number;
}

export type AppTab = 'dashboard' | 'explorer';