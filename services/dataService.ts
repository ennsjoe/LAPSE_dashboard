import Papa from 'papaparse';
import { 
  LegislationItem, 
  ParagraphRow, 
  LegislationRow, 
  IucnKeywordRow, 
  GovernanceKeywordRow 
} from '../types';

// Cache for loaded data
let dataCache: LegislationItem[] | null = null;
let governanceKeywordCache: Map<string, string[]> | null = null;

/**
 * Parse CSV file from URL
 */
async function parseCSV<T>(url: string): Promise<T[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.statusText}`);
  }
  
  const csvText = await response.text();
  
  return new Promise((resolve, reject) => {
    Papa.parse<T>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn(`CSV parsing warnings for ${url}:`, results.errors);
        }
        resolve(results.data);
      },
      error: (error) => reject(error),
    });
  });
}

/**
 * Extract IUCN threats from paragraph text using keyword matching
 */
function extractIucnThreats(
  paragraphText: string,
  iucnKeywordMap: Map<string, string>
): string {
  const lowerText = paragraphText.toLowerCase();
  const matchedThreats = new Set<string>();
  
  iucnKeywordMap.forEach((threat, keyword) => {
    if (lowerText.includes(keyword.toLowerCase())) {
      matchedThreats.add(threat);
    }
  });
  
  return Array.from(matchedThreats).join('; ');
}

/**
 * Extract governance keywords from paragraph text for specific management domains
 */
function extractGovernanceKeywords(
  paragraphText: string,
  managementDomain: string,
  governanceKeywordMap: Map<string, string[]>
): string {
  const lowerText = paragraphText.toLowerCase();
  const domainsToCheck = managementDomain.split(';').map(d => d.trim());
  const matchedKeywords = new Set<string>();
  
  // For each domain in this paragraph, check if it has governance keywords defined
  domainsToCheck.forEach(domain => {
    const keywords = governanceKeywordMap.get(domain.toLowerCase());
    if (keywords) {
      keywords.forEach(keyword => {
        // Use word boundary matching for more accurate results
        const regex = new RegExp(`\\b${keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        if (regex.test(lowerText)) {
          matchedKeywords.add(keyword);
        }
      });
    }
  });
  
  return Array.from(matchedKeywords).join('; ');
}

/**
 * Load all CSV files and join them into LegislationItem array
 */
export async function loadLegislationData(): Promise<LegislationItem[]> {
  // Return cached data if available
  if (dataCache) {
    return dataCache;
  }

  console.log('Loading CSV files...');
  
  // Determine the base path based on environment
  // In development: files are at /filename.csv
  // In production with GitHub Pages: files are at /LAPSE_dashboard/filename.csv
  const basePath = import.meta.env.BASE_URL || '/';
  
  // Load all CSVs in parallel
  const [paragraphRows, legislationRows, iucnKeywordRows, governanceKeywordRows] = await Promise.all([
    parseCSV<ParagraphRow>(`${basePath}paragraph_output.csv`),
    parseCSV<LegislationRow>(`${basePath}legislation_output.csv`),
    parseCSV<IucnKeywordRow>(`${basePath}iucn_l2_keywords.csv`),
    parseCSV<GovernanceKeywordRow>(`${basePath}governance_keywords.csv`),
  ]);

  console.log(`Loaded ${paragraphRows.length} paragraphs, ${legislationRows.length} legislation records`);
  console.log(`Loaded ${iucnKeywordRows.length} IUCN keywords, ${governanceKeywordRows.length} governance keywords`);

  // Create lookup maps
  const legislationMap = new Map<string, LegislationRow>();
  legislationRows.forEach(leg => {
    legislationMap.set(leg.legislation_id, leg);
  });

  // Create IUCN keyword map (keyword -> IUCN L2 category)
  const iucnKeywordMap = new Map<string, string>();
  iucnKeywordRows.forEach(row => {
    iucnKeywordMap.set(row.keyword.toLowerCase(), row.iucn_l2);
  });

  // Create governance keyword map (management_domain -> array of keywords)
  const governanceKeywordMap = new Map<string, string[]>();
  governanceKeywordRows.forEach(row => {
    const domain = row.management_domain.toLowerCase();
    if (!governanceKeywordMap.has(domain)) {
      governanceKeywordMap.set(domain, []);
    }
    governanceKeywordMap.get(domain)!.push(row.keyword);
  });

  // Cache governance keywords for use in filtering
  governanceKeywordCache = governanceKeywordMap;

  // Join paragraphs with legislation data
  const joinedData: LegislationItem[] = paragraphRows.map((para, index) => {
    const legislation = legislationMap.get(para.legislation_id);
    
    if (!legislation) {
      console.warn(`No legislation found for paragraph ${para.paragraph_id}, legislation_id: ${para.legislation_id}`);
    }

    // Extract IUCN threats from paragraph text
    const iucnThreat = para.paragraph 
      ? extractIucnThreats(para.paragraph, iucnKeywordMap)
      : '';

    // Extract governance keywords for applicable domains
    const governanceKeywords = para.paragraph && para.management_domain
      ? extractGovernanceKeywords(para.paragraph, para.management_domain, governanceKeywordMap)
      : '';

    // Combine existing keywords with extracted governance keywords
    const combinedMgmtKeywords = [para.mgmt_d_keyword, governanceKeywords]
      .filter(Boolean)
      .join('; ');

    // Combine all keywords for aggregate display
    const allKeywords = [
      combinedMgmtKeywords,
      para.clause_type_keyword,
    ].filter(Boolean).join('; ');

    return {
      id: String(index + 1),
      paragraph_id: parseInt(para.paragraph_id) || 0,
      legislation_id: parseInt(para.legislation_id) || 0,
      jurisdiction: (legislation?.jurisdiction || 'Federal') as 'Federal' | 'Provincial',
      legislation_type: legislation?.legislation_type || '',
      act_name: legislation?.act_name || '',
      legislation_name: legislation?.legislation_name || '',
      url: legislation?.url || '',
      agencies: legislation?.agencies || '',
      section: para.section || '',
      heading: para.heading || '',
      paragraph: para.paragraph || '',
      management_domain: para.management_domain || '',
      mgmt_d_keyword: combinedMgmtKeywords,
      clause_type: para.clause_type || '',
      clause_type_keyword: para.clause_type_keyword || '',
      actionable_type: para.actionable_type || '',
      responsible_official: para.responsible_official || '',
      discretion_type: para.discretion_type || '',
      iucn_threat: iucnThreat,
      aggregate_keywords: allKeywords,
    };
  });

  // Cache the result
  dataCache = joinedData;
  
  console.log(`Successfully joined ${joinedData.length} legislation items`);
  
  return joinedData;
}

/**
 * Get governance keywords for a specific management domain
 */
export function getGovernanceKeywordsForDomain(domain: string): string[] {
  if (!governanceKeywordCache) {
    return [];
  }
  return governanceKeywordCache.get(domain.toLowerCase()) || [];
}

/**
 * Filter keywords by matching against governance keywords for a specific domain
 */
export function filterKeywordsByDomain(
  allKeywords: string,
  paragraphText: string,
  targetDomain: string
): string[] {
  if (!targetDomain || targetDomain === 'All' || !governanceKeywordCache) {
    // If no specific domain selected, return all keywords
    return allKeywords.split(';').map(k => k.trim()).filter(k => k.length > 0);
  }

  // Check if this domain has governance keywords defined
  const domainKeywords = governanceKeywordCache.get(targetDomain.toLowerCase());
  const isGovernanceDomain = domainKeywords && domainKeywords.length > 0;
  
  if (!isGovernanceDomain) {
    // Not a governance domain, return all keywords
    return allKeywords.split(';').map(k => k.trim()).filter(k => k.length > 0);
  }

  // For governance domains, filter keywords to only those belonging to the target domain
  const lowerText = paragraphText.toLowerCase();
  const matchedKeywords: string[] = [];

  domainKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (regex.test(lowerText)) {
      matchedKeywords.push(keyword);
    }
  });

  return matchedKeywords;
}

/**
 * Clear the data cache (useful for testing or reloading)
 */
export function clearCache(): void {
  dataCache = null;
  governanceKeywordCache = null;
}
