#!/usr/bin/env python3
"""Test OpenAI API key configuration"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from config.config import settings
    
    print("🔍 Checking OpenAI Configuration...")
    print("")
    
    if settings.OPENAI_API_KEY:
        key = settings.OPENAI_API_KEY
        print(f"✅ OpenAI API Key found!")
        print(f"   Key starts with: {key[:7]}...")
        print(f"   Key length: {len(key)} characters")
        print(f"   Model: {settings.OPENAI_MODEL}")
        print("")
        
        # Try to import OpenAI
        try:
            from openai import OpenAI
            client = OpenAI(api_key=key)
            print("✅ OpenAI client initialized successfully!")
            print("")
            print("🎉 Everything looks good! Your OpenAI key is configured correctly.")
        except ImportError:
            print("⚠️  OpenAI library not installed")
            print("   Run: pip install openai")
        except Exception as e:
            print(f"❌ Error initializing OpenAI client: {e}")
    else:
        print("❌ OpenAI API Key not found!")
        print("   Please add OPENAI_API_KEY to config/.env")
        print("")
        print("   Example:")
        print("   OPENAI_API_KEY=sk-your-key-here")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

