/**
 * Schema Validator
 *
 * Validates that the user's Supabase database has the correct schema
 * for the app to function properly. Helps catch schema mismatches early.
 */

import { supabase } from './supabase';

interface SchemaValidationResult {
  isValid: boolean;
  missingColumns: string[];
  missingTables: string[];
  errorMessage?: string;
}

/**
 * Validates that the action_roadmaps table has all required columns
 */
export async function validateActionRoadmapsSchema(): Promise<SchemaValidationResult> {
  try {
    // Attempt a select with all required columns
    // This will fail if any column is missing
    const { data, error } = await supabase
      .from('action_roadmaps')
      .select('id, user_id, dream, root_motivation, roadmap_title, status, created_at, updated_at')
      .limit(0); // Don't fetch any rows, just validate the query

    if (error) {
      // Check if it's a column not found error
      if (error.code === 'PGRST204' || error.message.includes('column')) {
        // Parse error message to find which column is missing
        const missingColumn = extractMissingColumn(error.message);

        return {
          isValid: false,
          missingColumns: missingColumn ? [missingColumn] : ['unknown'],
          missingTables: [],
          errorMessage: `Database schema is outdated. The 'action_roadmaps' table is missing the '${missingColumn}' column. Please update your database schema.`,
        };
      }

      // Check if table doesn't exist
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return {
          isValid: false,
          missingColumns: [],
          missingTables: ['action_roadmaps'],
          errorMessage: 'The action_roadmaps table does not exist in your database. Please run the database schema setup.',
        };
      }

      // Other errors
      return {
        isValid: false,
        missingColumns: [],
        missingTables: [],
        errorMessage: `Schema validation error: ${error.message}`,
      };
    }

    // Schema is valid
    return {
      isValid: true,
      missingColumns: [],
      missingTables: [],
    };
  } catch (error: any) {
    return {
      isValid: false,
      missingColumns: [],
      missingTables: [],
      errorMessage: `Unexpected error during schema validation: ${error.message}`,
    };
  }
}

/**
 * Validates roadmap_actions table schema
 */
export async function validateRoadmapActionsSchema(): Promise<SchemaValidationResult> {
  try {
    const { data, error } = await supabase
      .from('roadmap_actions')
      .select('id, roadmap_id, title, description, why_it_matters, duration_minutes, order_index, is_completed, completed_at, gabby_tip, category, created_at')
      .limit(0);

    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('column')) {
        const missingColumn = extractMissingColumn(error.message);

        return {
          isValid: false,
          missingColumns: missingColumn ? [missingColumn] : ['unknown'],
          missingTables: [],
          errorMessage: `Database schema is outdated. The 'roadmap_actions' table is missing the '${missingColumn}' column.`,
        };
      }

      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return {
          isValid: false,
          missingColumns: [],
          missingTables: ['roadmap_actions'],
          errorMessage: 'The roadmap_actions table does not exist in your database.',
        };
      }

      return {
        isValid: false,
        missingColumns: [],
        missingTables: [],
        errorMessage: `Schema validation error: ${error.message}`,
      };
    }

    return {
      isValid: true,
      missingColumns: [],
      missingTables: [],
    };
  } catch (error: any) {
    return {
      isValid: false,
      missingColumns: [],
      missingTables: [],
      errorMessage: `Unexpected error: ${error.message}`,
    };
  }
}

/**
 * Validates all roadmap-related tables
 */
export async function validateRoadmapSchema(): Promise<SchemaValidationResult> {
  const roadmapsResult = await validateActionRoadmapsSchema();
  if (!roadmapsResult.isValid) {
    return roadmapsResult;
  }

  const actionsResult = await validateRoadmapActionsSchema();
  if (!actionsResult.isValid) {
    return actionsResult;
  }

  return {
    isValid: true,
    missingColumns: [],
    missingTables: [],
  };
}

/**
 * Helper to extract the missing column name from error message
 */
function extractMissingColumn(errorMessage: string): string | null {
  // Pattern: "Could not find the 'column_name' column"
  const match = errorMessage.match(/['"]([^'"]+)['"].*column/i);
  return match ? match[1] : null;
}

/**
 * Get user-friendly instructions for fixing schema issues
 */
export function getSchemaFixInstructions(validation: SchemaValidationResult): string {
  if (validation.isValid) return '';

  let instructions = '⚠️ Your database schema needs to be updated.\n\n';

  if (validation.missingTables.length > 0) {
    instructions += `Missing tables: ${validation.missingTables.join(', ')}\n\n`;
    instructions += '📋 To fix this:\n';
    instructions += '1. Open your Supabase project dashboard\n';
    instructions += '2. Go to the SQL Editor\n';
    instructions += '3. Run the complete schema from supabase-schema.sql\n';
  } else if (validation.missingColumns.length > 0) {
    instructions += `Missing columns in action_roadmaps: ${validation.missingColumns.join(', ')}\n\n`;
    instructions += '📋 To fix this:\n';
    instructions += '1. Open your Supabase project dashboard\n';
    instructions += '2. Go to the SQL Editor\n';
    instructions += '3. Run this command:\n\n';

    // Provide specific ALTER TABLE commands for missing columns
    validation.missingColumns.forEach(column => {
      if (column === 'dream') {
        instructions += `ALTER TABLE action_roadmaps ADD COLUMN dream text NOT NULL DEFAULT '';\n`;
      } else if (column === 'root_motivation') {
        instructions += `ALTER TABLE action_roadmaps ADD COLUMN root_motivation text;\n`;
      } else if (column === 'roadmap_title') {
        instructions += `ALTER TABLE action_roadmaps ADD COLUMN roadmap_title text NOT NULL DEFAULT 'Your Golden Path';\n`;
      }
    });
  }

  return instructions;
}
