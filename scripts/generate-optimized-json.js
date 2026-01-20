#!/usr/bin/env node

/**
 * Pre-processes full_data.json into an optimized, aggregated structure
 * This reduces file size and eliminates client-side processing
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Loading full_data.json...');
const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/full_data.json'), 'utf8'));
console.log(`✅ Loaded ${rawData.length} records`);

console.log('🔄 Grouping by paragraph...');
const paragraphMap = new Map();

rawData.forEach(row => {
  const paraId = row.paragraph_id;
  
  if (!paragraphMap.has(paraId)) {
    paragraphMap.set(paraId, {
      paragraph_id: paraId,
      legislation_id: row.legislation_id,
      section: row.section || '',
      heading: row.heading || '',
      paragraph: row.paragraph || '',
      jurisdiction: row.jurisdiction || '',
      act_name: row.act_name || '',
      legislation_name: row.legislation_name || '',
      actionable_type: row.actionable_type || '',
      responsible_official: row.responsible_official || '',
      discretion_type: row.discretion_type || '',
      labels: []
    });
  }
  
  paragraphMap.get(paraId).labels.push({
    label_type: row.label_type || '',
    label_value: row.label_value || '',
    keyword: row.keyword || '',
    scope: row.scope || ''
  });
});

console.log(`✅ Grouped into ${paragraphMap.size} unique paragraphs`);

console.log('🔄 Creating final output structure...');
const outputData = [];
let idCounter = 1;

paragraphMap.forEach(para => {
  // Get unique management domains
  const managementDomains = [...new Set(
    para.labels
      .filter(l => l.label_type === 'Management Domain')
      .map(l => l.label_value)
      .filter(v => v)
  )];
  
  // Get other aggregated values
  const iucnThreats = [...new Set(
    para.labels
      .filter(l => l.label_type === 'IUCN')
      .map(l => l.label_value)
      .filter(v => v)
  )];
  
  const clauseTypes = [...new Set(
    para.labels
      .filter(l => l.label_type === 'Clause Type')
      .map(l => l.label_value)
      .filter(v => v)
  )];
  
  const scopes = [...new Set(
    para.labels
      .map(l => l.scope)
      .filter(s => s && s.trim() !== '')
  )];
  
  const managementKeywords = para.labels
    .filter(l => l.label_type === 'Management Domain')
    .map(l => l.keyword)
    .filter(k => k && k.trim() !== '')
    .join('; ');
  
  const clauseKeywords = para.labels
    .filter(l => l.label_type === 'Clause Type')
    .map(l => l.keyword)
    .filter(k => k && k.trim() !== '')
    .join('; ');
  
  // Create one row per management domain (or one if none)
  const domains = managementDomains.length > 0 ? managementDomains : [''];
  
  domains.forEach(domain => {
    outputData.push({
      id: String(idCounter++),
      jurisdiction: para.jurisdiction,
      act_name: para.act_name,
      legislation_name: para.legislation_name,
      section: para.section,
      heading: para.heading,
      aggregate_paragraph: para.paragraph,
      management_domain: domain,
      iucn_threat: iucnThreats.join('; '),
      clause_type: clauseTypes.join('; '),
      scope: scopes.join('; '),
      management_domain_keywords: managementKeywords,
      clause_type_keywords: clauseKeywords,
      aggregate_keywords: '',
      actionable_type: para.actionable_type,
      responsible_official: para.responsible_official,
      discretion_type: para.discretion_type
    });
  });
});

console.log(`✅ Created ${outputData.length} final records`);

const outputPath = path.join(__dirname, '../public/LAPSE_compendium.json');
console.log('🔄 Writing to LAPSE_compendium.json...');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 0));

const stats = fs.statSync(outputPath);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`✅ Done! Output size: ${sizeMB}MB`);
console.log(`📊 Reduction: ${((1 - stats.size / fs.statSync(path.join(__dirname, '../public/full_data.json')).size) * 100).toFixed(1)}%`);
