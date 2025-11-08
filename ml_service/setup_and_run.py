#!/usr/bin/env python3
"""
Setup and run ML service - All-in-one script
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(cmd, check=True, shell=False):
    """Run a shell command"""
    print(f"▶️  Running: {cmd}")
    try:
        if shell:
            result = subprocess.run(cmd, shell=True, check=check, capture_output=True, text=True)
        else:
            result = subprocess.run(cmd.split(), check=check, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        if e.stderr:
            print(f"⚠️  {e.stderr}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🚀 Setting up and starting FocusWave ML Service...\n")
    
    # Check Python version
    print("📦 Checking Python version...")
    result = subprocess.run([sys.executable, "--version"], capture_output=True, text=True)
    print(f"✅ {result.stdout.strip()}\n")
    
    # Create venv if it doesn't exist
    venv_path = Path("venv")
    if not venv_path.exists():
        print("📦 Creating virtual environment...")
        run_command(f"{sys.executable} -m venv venv")
        print("✅ Virtual environment created\n")
    else:
        print("✅ Virtual environment already exists\n")
    
    # Determine pip path
    if sys.platform == "win32":
        pip_path = "venv/Scripts/pip"
        python_path = "venv/Scripts/python"
    else:
        pip_path = "venv/bin/pip"
        python_path = "venv/bin/python"
    
    # Install dependencies
    print("📦 Installing dependencies...")
    run_command(f"{pip_path} install --upgrade pip --quiet", check=False)
    run_command(f"{pip_path} install -r requirements.txt", check=False)
    print("✅ Dependencies installed\n")
    
    # Create models directory
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    print("✅ Models directory ready\n")
    
    # Create .env if it doesn't exist
    env_file = Path("config/.env")
    if not env_file.exists():
        print("⚙️  Creating config/.env...")
        env_content = """DB_HOST=localhost
DB_PORT=5432
DB_NAME=focuswave
DB_USER=postgres
DB_PASSWORD=postgres
ML_SERVICE_PORT=8001
ML_SERVICE_HOST=0.0.0.0
MODEL_DIR=./models
OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo
HF_MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english
RETRAIN_INTERVAL_HOURS=24
MIN_SAMPLES_FOR_TRAINING=50
LOG_LEVEL=INFO
"""
        env_file.parent.mkdir(parents=True, exist_ok=True)
        env_file.write_text(env_content)
        print("✅ Created config/.env\n")
    else:
        print("✅ config/.env already exists\n")
    
    # Try to train models (optional)
    print("🧠 Training models (optional, will use fallback if fails)...")
    run_command(f"{python_path} training/train_pomodoro_model.py", check=False)
    run_command(f"{python_path} training/train_distraction_model.py", check=False)
    print("")
    
    # Start the service
    print("=" * 70)
    print("🚀 Starting ML Service on http://localhost:8001")
    print("📚 API docs available at http://localhost:8001/docs")
    print("=" * 70)
    print("\nPress Ctrl+C to stop the service\n")
    
    # Run the service
    os.chdir(Path(__file__).parent)
    run_command(f"{python_path} run.py", check=False)

if __name__ == "__main__":
    main()

