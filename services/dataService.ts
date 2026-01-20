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

    // Combine all keywords for aggregate display
    const allKeywords = [
      para.mgmt_d_keyword,
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
      mgmt_d_keyword: para.mgmt_d_keyword || '',
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
 * Clear the data cache (useful for testing or reloading)
 */
export function clearCache(): void {
  dataCache = null;
}
