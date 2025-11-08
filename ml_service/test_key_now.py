#!/usr/bin/env python3
"""Quick test of OpenAI key"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.config import settings

print("🔍 Testing OpenAI Key...")
print("")

if settings.OPENAI_API_KEY:
    key = settings.OPENAI_API_KEY.strip()
    print(f"✅ Key loaded: {key[:10]}...{key[-10:]}")
    print(f"   Length: {len(key)} characters")
    print(f"   Starts with sk-: {key.startswith('sk-')}")
    print(f"   Model: {settings.OPENAI_MODEL}")
    print("")
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=key)
        print("✅ OpenAI client created successfully!")
        print("🎉 Ready to use!")
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print("❌ Key not loaded")

