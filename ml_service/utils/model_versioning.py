import os
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional
from loguru import logger
from config.config import settings

class ModelVersioning:
    def __init__(self, model_dir: str = None):
        self.model_dir = Path(model_dir or settings.MODEL_DIR)
        self.version_file = self.model_dir / "versions.json"
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self._load_versions()
    
    def _load_versions(self):
        """Load version information"""
        if self.version_file.exists():
            with open(self.version_file, 'r') as f:
                self.versions = json.load(f)
        else:
            self.versions = {}
            self._save_versions()
    
    def _save_versions(self):
        """Save version information"""
        with open(self.version_file, 'w') as f:
            json.dump(self.versions, f, indent=2)
    
    def register_model(self, model_name: str, model_path: str, metrics: Dict = None) -> str:
        """Register a new model version"""
        version = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if model_name not in self.versions:
            self.versions[model_name] = {}
        
        self.versions[model_name][version] = {
            'path': model_path,
            'created_at': datetime.now().isoformat(),
            'metrics': metrics or {},
            'is_current': False
        }
        
        # Set as current version
        self._set_current_version(model_name, version)
        self._save_versions()
        
        logger.info(f"Registered {model_name} version {version}")
        return version
    
    def _set_current_version(self, model_name: str, version: str):
        """Set current version for a model"""
        if model_name in self.versions:
            for v in self.versions[model_name]:
                self.versions[model_name][v]['is_current'] = (v == version)
    
    def get_current_version(self, model_name: str) -> Optional[str]:
        """Get current version of a model"""
        if model_name not in self.versions:
            return None
        
        for version, info in self.versions[model_name].items():
            if info.get('is_current', False):
                return version
        
        # Return latest version if no current set
        if self.versions[model_name]:
            return max(self.versions[model_name].keys())
        
        return None
    
    def get_model_path(self, model_name: str, version: str = None) -> Optional[str]:
        """Get path to a specific model version"""
        if model_name not in self.versions:
            return None
        
        if version is None:
            version = self.get_current_version(model_name)
        
        if version and version in self.versions[model_name]:
            return self.versions[model_name][version]['path']
        
        return None
    
    def list_versions(self, model_name: str) -> Dict:
        """List all versions of a model"""
        return self.versions.get(model_name, {})
    
    def archive_old_versions(self, model_name: str, keep: int = 5):
        """Archive old model versions, keeping only the N most recent"""
        if model_name not in self.versions:
            return
        
        versions = sorted(self.versions[model_name].keys(), reverse=True)
        current = self.get_current_version(model_name)
        
        # Keep current version and N-1 most recent
        to_keep = versions[:keep]
        if current and current not in to_keep:
            to_keep.append(current)
        
        to_archive = [v for v in versions if v not in to_keep]
        
        archive_dir = self.model_dir / "archive" / model_name
        archive_dir.mkdir(parents=True, exist_ok=True)
        
        for version in to_archive:
            version_info = self.versions[model_name][version]
            old_path = Path(version_info['path'])
            
            if old_path.exists():
                archive_path = archive_dir / f"{model_name}_{version}{old_path.suffix}"
                shutil.move(str(old_path), str(archive_path))
                logger.info(f"Archived {model_name} version {version}")
            
            del self.versions[model_name][version]
        
        self._save_versions()

