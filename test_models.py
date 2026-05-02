# test_models.py
import sys
import os

# Add project root to path so Python can find backend.model
sys.path.append(os.path.dirname(__file__))

try:
    from backend.model.VoiceLab.audio_generator import AudioGenerator
    print("✅ AudioGenerator class imported")
except Exception as e:
    print(f"❌ Failed to import AudioGenerator: {e}")

try:
    from backend.model.ScriptGenerator.scriptGenerator import ScriptGenerator
    print("✅ ScriptGenerator class imported")
except Exception as e:
    print(f"❌ Failed to import ScriptGenerator: {e}")

# Try instantiating (this may load models, so it could take a moment)
try:
    print("Attempting to instantiate AudioGenerator...")
    ag = AudioGenerator()
    print("✅ AudioGenerator instantiated")
except Exception as e:
    print(f"❌ AudioGenerator instantiation failed: {e}")

try:
    print("Attempting to instantiate ScriptGenerator...")
    sg = ScriptGenerator()
    print("✅ ScriptGenerator instantiated")
except Exception as e:
    print(f"❌ ScriptGenerator instantiation failed: {e}")