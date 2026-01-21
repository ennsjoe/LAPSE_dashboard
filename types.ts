
export interface LegislationItem {
  id: string;
  paragraph_id: number;
  legislation_id: number;
  jurisdiction: 'Federal' | 'Provincial';
  legislation_type: string;
  act_name: string;
  legislation_name: string;
  url: string;
  agencies: string;
  section: string;
  heading: string;
  paragraph: string;
  management_domain: string;
  mgmt_d_keyword: string;
  clause_type: string;
  clause_type_keyword: string;
  actionable_type?: string;
  responsible_official?: string;
  discretion_type?: string;
  iucn_threat: string;
  aggregate_keywords: string;
}

export interface ParagraphRow {
  paragraph_id: string;
  legislation_id: string;
  section: string;
  heading: string;
  paragraph: string;
  management_domain: string;
  mgmt_d_keyword: string;
  clause_type: string;
  clause_type_keyword: string;
  actionable_type: string;
  responsible_official: string;
  discretion_type: string;
}

export interface LegislationRow {
  legislation_id: string;
  jurisdiction: string;
  legislation_type: string;
  act_name: string;
  legislation_name: string;
  url: string;
  agencies: string;
}

export interface IucnKeywordRow {
  iucn_l2: string;
  keyword: string;
}

export interface GovernanceKeywordRow {
  management_domain: string;
  keyword: string;
  scope: string;
}

export interface FilterState {
  jurisdiction: 'All' | 'Federal' | 'Provincial';
  managementDomain: string;
  searchTerm: string;
  actName: string;
  legislationName: string;
  clauseType: string;
  actionableType: string;
  responsibleOfficial: string;
  discretionType: string;
}

export interface FilterOption {
  name: string;
  count: number;
}

export interface ChartData {
  name: string;
  value: number;
}