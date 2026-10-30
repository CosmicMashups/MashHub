# Python Virtual Environment Guide for Windows

## What is a Virtual Environment?
A virtual environment is an isolated Python environment that keeps project dependencies separate from your system Python installation.

## Quick Start

### Option 1: Create and Activate a New Virtual Environment

1. **Open Command Prompt or PowerShell** in your project folder:
   ```
   cd "d:\Projects\Research Projects\MashHub"
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```
   This creates a folder called `venv` with an isolated Python installation.

3. **Activate the virtual environment:**
   
   **For Command Prompt (cmd):**
   ```bash
   venv\Scripts\activate.bat
   ```
   
   **For PowerShell:**
   ```bash
   venv\Scripts\Activate.ps1
   ```
   
   **For Git Bash:**
   ```bash
   source venv/Scripts/activate
   ```

4. **You'll know it's active when you see `(venv)` at the start of your command prompt:**
   ```
   (venv) D:\Projects\Research Projects\MashHub>
   ```

5. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Option 2: Use the Batch Script (Easiest)

I've created a batch script that does everything automatically. Just run:
```bash
setup_venv.bat
```

## Working with Virtual Environment

### Activate (each time you open a new terminal)
```bash
venv\Scripts\activate.bat
```

### Deactivate (when you're done)
```bash
deactivate
```

### Install packages (while activated)
```bash
pip install package_name
```

### Update requirements.txt (after installing new packages)
```bash
pip freeze > requirements.txt
```

## Troubleshooting

### PowerShell: "execution of scripts is disabled"
If you get an error when trying to activate in PowerShell:
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Check if virtual environment is active
```bash
python -c "import sys; print('Virtual env active!' if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix) else 'Not in virtual env')"
```

### Delete and recreate virtual environment
If something goes wrong:
```bash
rmdir /s venv
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
```

## For This Project Specifically

1. Activate virtual environment (or create one if it doesn't exist)
2. Upgrade supabase:
   ```bash
   pip install --upgrade supabase
   ```
3. Run the test:
   ```bash
   python test_simple_connection.py
   ```
4. Run the upsert script:
   ```bash
   python src\assets\upsert.py
   ```
