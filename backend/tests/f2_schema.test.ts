import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Feature 2: Database Schema & Seed Data Gate', () => {
  const schemaSqlPath = path.resolve(__dirname, '../../supabase/migrations/001_schema.sql');
  const seedSqlPath = path.resolve(__dirname, '../../supabase/migrations/003_seed.sql');
  const schemaDocPath = path.resolve(__dirname, '../../SCHEMA.md');

  it('Migration and schema documentation files exist', () => {
    expect(fs.existsSync(schemaSqlPath)).toBe(true);
    expect(fs.existsSync(seedSqlPath)).toBe(true);
    expect(fs.existsSync(schemaDocPath)).toBe(true);
  });

  it('Seed data defines exactly 6 distinct divisions', () => {
    const seedContent = fs.readFileSync(seedSqlPath, 'utf8');
    const divisions = [
      'labels-stickers',
      'race-event-numbers',
      'mtb-boards',
      'stamps',
      'trophies',
      'laser-cut-work',
    ];

    for (const div of divisions) {
      expect(seedContent).toContain(`'${div}'`);
    }

    // Ensure count of divisions inserted is 6
    const matches = seedContent.match(/div_[a-z_]+_id\s+UUID\s+:=\s+'[^']+'/g);
    expect(matches?.length).toBe(6);
  });

  it('Each division has at least 1 active parameter-driven product (no SKU-per-size)', () => {
    const seedContent = fs.readFileSync(seedSqlPath, 'utf8');
    const expectedProductSlugs = [
      'custom-labels-stickers',
      'tyvek-race-numbers',
      'downhill-mtb-number-boards',
      'self-inking-rubber-stamps',
      'custom-engraved-acrylic-trophy',
      'architectural-laser-cut-panel',
    ];

    for (const slug of expectedProductSlugs) {
      expect(seedContent).toContain(`'${slug}'`);
    }

    // Verify parameter-driven indicators: min_width_mm, max_width_mm, supports_csv_merge
    expect(seedContent).toContain('supports_csv_merge');
    expect(seedContent).toContain('min_width_mm');
  });

  it('Race-number template has >=2 placeholders with min/max font size set', () => {
    const seedContent = fs.readFileSync(seedSqlPath, 'utf8');

    // Runner number placeholder
    expect(seedContent).toContain("'runner_number'");
    expect(seedContent).toContain("'name'");

    // Check min/max font sizes for runner_number (e.g., 24 min, 120 max)
    expect(seedContent).toMatch(/runner_number.*?24.*?120/s);
    expect(seedContent).toMatch(/name.*?12.*?40/s);
  });

  it('All money fields in schema are defined as integers (paise)', () => {
    const schemaContent = fs.readFileSync(schemaSqlPath, 'utf8');
    expect(schemaContent).toContain('base_price_minor INT');
    expect(schemaContent).toContain('setup_fee_minor INT');
    expect(schemaContent).toContain('subtotal_minor INT');
    expect(schemaContent).toContain('tax_minor INT');
    expect(schemaContent).toContain('total_minor INT');
    expect(schemaContent).toContain('unit_price_minor INT');
    expect(schemaContent).toContain('line_total_minor INT');
  });
});
