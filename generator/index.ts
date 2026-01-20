#!/usr/bin/env node
/**
 * CLI entry point for the marathon training plan generator.
 *
 * Usage:
 *   npx ts-node index.ts --input athlete.json --output plans/
 *   npx ts-node index.ts --input athlete.json --level moderate
 */

import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

import { RawAthleteIntake } from './types/intake-raw';
import { AthleteIntake, PlanLevel } from './types';
import { normalizeIntake } from './parsers';
import { generateAllPlans, generatePlan, validatePlan } from './generators/plan-generator';
import { TrainingPlan } from './types/plan';

interface CLIOptions {
  input: string;
  output: string;
  level?: PlanLevel;
  validate?: boolean;
  startDate?: string;
}

/**
 * Read and parse athlete input file.
 */
function readAthleteInput(inputPath: string): RawAthleteIntake | AthleteIntake {
  const fullPath = path.resolve(inputPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Input file not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Check if input is raw (needs parsing) or already structured.
 */
function isRawIntake(input: any): input is RawAthleteIntake {
  return input.recentRace?.raw !== undefined ||
    input.availableDays?.weekday !== undefined;
}

/**
 * Write plan to output file.
 */
function writePlan(plan: TrainingPlan, outputDir: string, filename: string): void {
  const fullDir = path.resolve(outputDir);

  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }

  const fullPath = path.join(fullDir, filename);
  fs.writeFileSync(fullPath, JSON.stringify(plan, null, 2));

  console.log(`  Written: ${fullPath}`);
}

/**
 * Main CLI handler.
 */
async function main(options: CLIOptions): Promise<void> {
  console.log('Eugene Marathon Training Plan Generator');
  console.log('=======================================\n');

  // Read input
  console.log(`Reading athlete data from: ${options.input}`);
  const rawInput = readAthleteInput(options.input);

  // Parse/normalize if needed
  let athleteIntake: AthleteIntake;
  if (isRawIntake(rawInput)) {
    console.log('Parsing raw intake data...');
    athleteIntake = normalizeIntake(rawInput);
  } else {
    athleteIntake = rawInput as AthleteIntake;
  }

  console.log(`\nAthlete Profile:`);
  console.log(`  Recent race: ${athleteIntake.recentRace.timeFormatted} ${athleteIntake.recentRace.distance.replace('_', ' ')}`);
  console.log(`  Max HR: ${athleteIntake.heartRate.maxHR} bpm`);
  console.log(`  Weekly hours available: ${athleteIntake.weeklyHoursLimit}`);
  console.log(`  Goal: ${athleteIntake.goal.replace('_', ' ')}`);

  // Determine start date
  const startDate = options.startDate
    ? new Date(options.startDate)
    : new Date();

  console.log(`\nPlan start date: ${startDate.toISOString().split('T')[0]}`);
  console.log(`Race date: 2026-04-26\n`);

  // Generate plan(s)
  if (options.level) {
    // Generate single level
    console.log(`Generating ${options.level} plan...`);
    const plan = generatePlan(athleteIntake, options.level, startDate);

    if (options.validate) {
      const validation = validatePlan(plan);
      if (!validation.valid) {
        console.error('\nValidation errors:');
        validation.errors.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
      }
      if (validation.warnings.length > 0) {
        console.log('\nValidation warnings:');
        validation.warnings.forEach(w => console.log(`  - ${w}`));
      }
    }

    writePlan(plan, options.output, `${options.level}.json`);
    console.log(`\nPredicted finish: ${plan.metadata.predictedFinishTime?.target}`);
  } else {
    // Generate all levels
    console.log('Generating all plan levels...\n');
    const plans = generateAllPlans(athleteIntake, startDate);

    for (const [level, plan] of Object.entries(plans) as [PlanLevel, TrainingPlan][]) {
      console.log(`${level.charAt(0).toUpperCase() + level.slice(1)} Plan:`);

      if (options.validate) {
        const validation = validatePlan(plan);
        if (!validation.valid) {
          console.error('  Validation errors:');
          validation.errors.forEach(e => console.error(`    - ${e}`));
        }
        if (validation.warnings.length > 0) {
          console.log('  Warnings:');
          validation.warnings.forEach(w => console.log(`    - ${w}`));
        }
      }

      writePlan(plan, options.output, `${level}.json`);
      console.log(`  Predicted finish: ${plan.metadata.predictedFinishTime?.target}`);
      console.log(`  Peak mileage: ${Math.max(...plan.weeks.map(w => w.totalMileage))} miles/week\n`);
    }
  }

  console.log('\nDone!');
}

// Set up CLI
program
  .name('plan-generator')
  .description('Generate personalized marathon training plans')
  .version('1.0.0')
  .requiredOption('-i, --input <path>', 'Path to athlete intake JSON file')
  .option('-o, --output <path>', 'Output directory for plan files', '../plans')
  .option('-l, --level <level>', 'Generate single plan level (conservative|moderate|ambitious)')
  .option('--validate', 'Validate generated plans')
  .option('--start-date <date>', 'Plan start date (YYYY-MM-DD, defaults to today)')
  .action((options: CLIOptions) => {
    // Validate level option if provided
    if (options.level && !['conservative', 'moderate', 'ambitious'].includes(options.level)) {
      console.error(`Invalid level: ${options.level}`);
      console.error('Valid options: conservative, moderate, ambitious');
      process.exit(1);
    }

    main(options).catch(error => {
      console.error('\nError:', error.message);
      process.exit(1);
    });
  });

program.parse();
