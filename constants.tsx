import React from 'react';

// ============================================================================
// SHINY-MATCHING COLOR SCHEME
// ============================================================================

// Jurisdiction colors (matching R Shiny app)
export const JURISDICTION_COLORS: Record<string, string> = {
  Federal: "#996666",    // Muted salmon/maroon
  Provincial: "#668899", // Slate blue
  All: "#cccccc"         // Gray
};

// Loading/accent colors
export const loadingBackgroundColor = '#f3f4f6';  // Light gray (simpler than before)
export const accentColorPrimary = '#2c3e50';      // Dark blue-gray (Shiny's darkText)
export const accentColorSecondary = '#668899';    // Provincial blue

// Chart colors
export const chartColors = [
  '#2c3e50',  // Dark blue-gray (primary)
  '#996666',  // Federal salmon
  '#668899',  // Provincial blue
  '#6FA577',  // Sage green
  '#9BA8A0',  // Muted teal
  '#A8B5C7',  // Dusty blue
  '#8A9FB3',  // Steel blue
  '#7A8F8A'   // Muted green
];

// Management domains list
export const MANAGEMENT_DOMAINS = [
  "All",
  "Spatial Designation",
  "Governance Administration",
  "Restoration",
  "Species Status and Assessment",
  "Water Use and Watercourse Modifications",
  "Climate Change and Natural Disasters",
  "Agriculture",
  "Forest and Range",
  "Aquaculture and Hatcheries",
  "Mining and Energy",
  "Transportation Infrastructure",
  "Fisheries",
  "Human Disturbance",
  "Invasive or Problematic Species and Disease",
  "Pollution"
];

// Jurisdiction options
export const JURISDICTIONS = ["All", "Federal", "Provincial"];

// ============================================================================
// SHINY UI COLORS (for reference)
// ============================================================================
export const SHINY_COLORS = {
  // Jurisdiction
  federal: '#996666',
  provincial: '#668899',
  federalHover: '#aa7777',
  provincialHover: '#7799aa',
  allJurisdiction: '#cccccc',
  
  // Text
  darkText: '#2c3e50',
  
  // Buttons
  buttonDark: '#2c3e50',
  linkButton: '#0074D9',
  
  // Disclaimer bar
  disclaimerBg: '#fff3cd',
  disclaimerBorder: '#ffc107',
  disclaimerAccent: '#996666',
  disclaimerText: '#664d03',
  
  // Data info bar
  infoBarBg: '#e8f4f8',
  infoBarBorder: '#668899',
  
  // Highlights
  highlightSearch: '#ffff00',
  highlightDomain: '#e8f4f8',
  
  // Badges
  badgeOfficial: '#e3f2fd',
  badgeOfficialText: '#1976d2',
  badgeType: '#f3e5f5',
  badgeTypeText: '#7b1fa2',
  badgeDiscretion: '#fff3e0',
  badgeDiscretionText: '#f57c00',
};