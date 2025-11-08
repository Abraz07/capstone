#!/usr/bin/env python3
"""Test if all imports work"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing imports...")
    from app.main import app
    print("✅ app.main imported successfully")
    print("✅ Service is ready to start!")
    print("")
    print("Run: python3 start.py")
except Exception as e:
    print(f"❌ Import error: {e}")
    import traceback
    traceback.print_exc()

