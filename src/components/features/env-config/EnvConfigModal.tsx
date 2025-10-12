"use client";

/**
 * Environment Configuration Modal
 * Features:
 * - Import .env file from file system
 * - Paste .env text to auto-fill inputs (Vercel-style)
 * - Manual input for each variable
 * - Validation with helpful error messages
 * - Save to localStorage with priority over process.env
 * - Dark mode support
 * - Fully responsive design
 * - Uses shadcn/ui Dialog component
 */

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
} from "lucide-react";
import type { EnvVariable, EnvConfig } from "@/types/env-config";
import { envStorageService } from "@/lib/services/env-storage.service";
import { envConfigManager } from "@/lib/utils/env-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EnvConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnvConfigModal({ open, onOpenChange }: EnvConfigModalProps) {
  const [variables, setVariables] = useState<EnvVariable[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [isUsingStored, setIsUsingStored] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      loadCurrentConfig();
    }
  }, [open]);

  const loadCurrentConfig = () => {
    const currentConfig = envConfigManager.getConfig();
    const merged = envStorageService.mergeWithDefaults(currentConfig);
    setVariables(merged);
    setIsUsingStored(envStorageService.hasStoredConfig());
    setErrors([]);
    setSuccessMessage("");
  };

  const handlePaste = (text: string) => {
    try {
      const parsed = envStorageService.parseEnvText(text);
      const merged = envStorageService.mergeWithDefaults(parsed);
      setVariables(merged);
      setShowPasteArea(false);
      setPasteText("");
      setSuccessMessage("Environment variables loaded successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrors([
        "Failed to parse .env text. Please check the format and try again.",
      ]);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = envStorageService.parseEnvText(text);
        const merged = envStorageService.mergeWithDefaults(parsed);
        setVariables(merged);
        setSuccessMessage(`Imported ${file.name} successfully`);
        setTimeout(() => setSuccessMessage(""), 3000);
        setErrors([]);
      } catch (error) {
        setErrors([
          `Failed to import ${file.name}. Please check the file format.`,
        ]);
      }
    };
    reader.onerror = () => {
      setErrors(["Failed to read file. Please try again."]);
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) =>
      prev.map((v) => (v.key === key ? { ...v, value } : v))
    );
    setErrors([]);
  };

  const handleSave = () => {
    const config: EnvConfig = {
      NEXT_PUBLIC_DEFAULT_CHAIN_ID: "",
    };

    variables.forEach((v) => {
      if (v.value) {
        config[v.key] = v.value;
      }
    });

    const validation = envStorageService.validate(config);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      envConfigManager.setConfig(config);
      // Page will reload automatically after setConfig
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "Failed to save configuration",
      ]);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "This will clear all stored configuration and use defaults from .env file. Continue?"
      )
    ) {
      envConfigManager.clearConfig();
      // Page will reload automatically after clearConfig
    }
  };

  const handleExport = () => {
    const config: EnvConfig = {
      NEXT_PUBLIC_DEFAULT_CHAIN_ID: "",
    };

    variables.forEach((v) => {
      if (v.value) {
        config[v.key] = v.value;
      }
    });

    const envText = envStorageService.toEnvText(config);
    const blob = new Blob([envText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".env.local";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".env,.env.local,.env.production,.txt"
          onChange={handleFileImport}
          className="hidden"
        />

        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg sm:text-xl">
            Environment Configuration
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Configure runtime environment variables
            {isUsingStored && (
              <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                (Using stored config)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-4 sm:px-6 py-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Import File</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPasteArea(!showPasteArea)}
            >
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">
                {showPasteArea ? "Hide" : "Paste"} .env
              </span>
              <span className="sm:hidden">
                {showPasteArea ? "Hide" : "Paste"}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </Button>
            {isUsingStored && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleReset}
                className="sm:ml-auto"
              >
                <span className="hidden sm:inline">Reset to Defaults</span>
                <span className="sm:hidden">Reset</span>
              </Button>
            )}
          </div>

          {/* Paste Area */}
          {showPasteArea && (
            <div className="mb-6 p-3 sm:p-4 bg-muted rounded-lg border">
              <label className="block text-xs sm:text-sm font-medium mb-2">
                Paste .env content here
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`# Comments are supported\nNEXT_PUBLIC_DEFAULT_CHAIN_ID=31337\nNEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x...\nNEXT_PUBLIC_RPC_URL_LOCAL=http://127.0.0.1:8545`}
                className="w-full h-32 px-3 py-2 text-xs sm:text-sm font-mono border rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
              />
              <Button
                type="button"
                onClick={() => handlePaste(pasteText)}
                disabled={!pasteText.trim()}
                size="sm"
                className="mt-2"
              >
                Load Variables
              </Button>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm">{successMessage}</span>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium mb-1">
                    Configuration errors:
                  </p>
                  <ul className="text-xs sm:text-sm space-y-1 list-disc list-inside">
                    {errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Variable Inputs */}
          <div className="space-y-3 sm:space-y-4">
            {variables.map((variable) => (
              <div key={variable.key}>
                <label className="block text-xs sm:text-sm font-medium mb-1">
                  {variable.key}
                  {variable.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </label>
                {variable.description && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {variable.description}
                  </p>
                )}
                <input
                  type="text"
                  value={variable.value}
                  onChange={(e) =>
                    handleVariableChange(variable.key, e.target.value)
                  }
                  placeholder={`Enter ${variable.key}`}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono border rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-muted/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto"
          >
            Save & Reload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
