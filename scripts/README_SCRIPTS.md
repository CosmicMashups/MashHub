# Scripts Directory

This directory contains all utility scripts and automation tools for the MashHub project.

## Contents

### Batch Scripts (Windows)
- **activate_venv.bat** - Activates Python virtual environment
- **setup_venv.bat** - Sets up Python virtual environment
- **deploy.bat** - Deployment automation script
- **diagnose.bat** - System diagnostic script
- **fix_dependencies.bat** - Fixes dependency issues
- **upgrade_supabase.bat** - Upgrades Supabase dependencies

### Python Scripts
- **check_env.py** - Checks environment configuration
- **test_simple_connection.py** - Tests basic database connection
- **test_supabase_connection.py** - Tests Supabase-specific connection

### JavaScript/Node Scripts
- **create-dirs.js** - Creates necessary directory structure
- **diagnose_supabase.js** - Diagnoses Supabase connection issues
- **diagnose_supabase.cjs** - CommonJS version of Supabase diagnostics
- **create-openspec-proposal.js** - Creates OpenSpec proposals
- **seed.ts** - Database seeding script

## Usage

### Running Batch Scripts
From the project root:
```cmd
scripts\activate_venv.bat
```

### Running Python Scripts
```bash
python scripts/check_env.py
```

### Running Node Scripts
```bash
node scripts/create-dirs.js
```

## Organization

All automation and utility scripts have been moved to this directory to:
- Keep the root directory clean
- Make it easier to find and maintain scripts
- Provide a central location for all automation tools
- Separate scripts from configuration files

Scripts can still be run from the project root by specifying the `scripts/` prefix.
