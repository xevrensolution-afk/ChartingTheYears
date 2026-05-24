'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/kit/Card';
import { KitButton } from '@/components/ui/kit/Button';
import { Icon } from '@/components/ui/kit/Icon';
import apiClient from '@/lib/apiClient';
import { getApiErrorMessage, showApiToast } from '@/components/ui/kit/Toast';

interface ImportResult {
  totalProcessed: number;
  imported: number;
  skipped: number;
}

export default function BookImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'replace'>('skip');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevention of tab close/refresh during import
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'importing') {
        const message = 'Import is currently in progress. Navigating away or refreshing will abort the process.';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status]);

  // Smooth progress bar simulation crawler
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (status === 'importing') {
      setProgress(0);
      intervalId = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) return prev + 2.5; // fast start
          if (prev < 70) return prev + 1.2; // steady climb
          if (prev < 95) return prev + 0.4; // slow approach
          return prev; // hold at 95% until complete
        });
      }, 400);
    } else if (status === 'success') {
      setProgress(100);
    } else {
      setProgress(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xml')) {
        setFile(droppedFile);
      } else {
        showApiToast({
          variant: 'error',
          title: 'Invalid File',
          message: 'Please drop a valid WordPress XML (.xml) backup file.',
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleImport = async () => {
    if (!file) return;

    setStatus('importing');
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('duplicateMode', duplicateMode);

    try {
      const response = await apiClient.post<{ data: ImportResult }>('/api/books/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3 minutes timeout to process base64 downloads safely
      });

      if (response.data && response.data.data) {
        setResult(response.data.data);
        setStatus('success');
        showApiToast({
          variant: 'success',
          title: 'Import Successful',
          message: `Import completed! processed: ${response.data.data.totalProcessed} books.`,
        });
      } else {
        throw new Error('Malformed API response');
      }
    } catch (err: any) {
      console.error('[Importer UI] Error importing books:', err);
      const msg = getApiErrorMessage(err, 'Failed to import books');
      setErrorMessage(msg);
      setStatus('error');
      showApiToast({
        variant: 'error',
        title: 'Import Failed',
        message: msg,
      });
    }
  };

  const resetImporter = () => {
    setFile(null);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-coffee/10 text-coffee">
              <img src="/icon-svgs/import.svg" alt="" width="20" height="20" />
            </span>
            Import Books
          </h1>
          <p className="text-ink-mute mt-1">Upload a WordPress WXR XML backup to batch import books.</p>
        </div>
        <Link href="/admin/books">
          <KitButton variant="outline" size="sm" disabled={status === 'importing'}>
            <Icon name="arrow-left" size={14} className="mr-1" /> Back to Catalog
          </KitButton>
        </Link>
      </div>

      <Card className="p-8">
        {status === 'idle' && (
          <div className="space-y-6">
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[250px] ${
                isDragActive
                  ? 'border-accent bg-accent-soft/10 scale-[0.99]'
                  : 'border-line/80 hover:border-accent hover:bg-surface-2/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="h-16 w-16 rounded-full bg-coffee/10 flex items-center justify-center mb-6 text-coffee">
                <img src="/icon-svgs/import.svg" alt="" width="32" height="32" />
              </div>
              
              <h3 className="text-lg font-semibold text-ink mb-2">
                Drag & Drop WordPress XML File
              </h3>
              
              <p className="text-sm text-ink-mute max-w-sm mb-6">
                Only standard WordPress eXtended RSS (.xml) files are supported. Maximum file size up to 10MB.
              </p>
              
              <KitButton type="button" variant="accent" size="md">
                Browse Files
              </KitButton>
            </div>

            {/* Selected File Details & Settings */}
            {file && (
              <div className="space-y-6 animate-fade-in">
                {/* Options Panel */}
                <div className="p-5 bg-surface-2 rounded-xl border border-line/40 space-y-4">
                  <h4 className="text-sm font-bold text-ink uppercase tracking-wider">Duplicate Prevention Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="duplicateMode"
                        checked={duplicateMode === 'skip'}
                        onChange={() => setDuplicateMode('skip')}
                        className="mt-1 accent-coffee"
                      />
                      <div>
                        <span className="text-sm font-semibold text-ink group-hover:text-coffee transition-colors">
                          Skip existing books (Recommended)
                        </span>
                        <p className="text-xs text-ink-mute">
                          If a book with the same title and author exists in your catalog, skip it to prevent duplication.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="duplicateMode"
                        checked={duplicateMode === 'replace'}
                        onChange={() => setDuplicateMode('replace')}
                        className="mt-1 accent-coffee"
                      />
                      <div>
                        <span className="text-sm font-semibold text-ink group-hover:text-coffee transition-colors">
                          Replace and overwrite existing books
                        </span>
                        <p className="text-xs text-ink-mute">
                          Overwrite duplicate catalog entries with newly extracted XML review descriptions and Base64 images.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Upload Action */}
                <div className="p-5 bg-surface-2 rounded-xl border border-line/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-coffee/20 flex items-center justify-center text-coffee">
                      <Icon name="books" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink text-sm">{file.name}</h4>
                      <p className="text-xs text-ink-mute mt-0.5">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <KitButton variant="outline" size="sm" onClick={resetImporter}>
                      Remove
                    </KitButton>
                    <KitButton variant="accent" size="sm" onClick={handleImport}>
                      Start Import
                    </KitButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'importing' && (
          <div className="py-12 space-y-8 flex flex-col items-center justify-center">
            {/* Warning Banner */}
            <div className="w-full p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3 text-left">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="font-bold text-danger text-sm">Import in progress</h4>
                <p className="text-xs text-danger/80 mt-0.5">
                  Do not reload, refresh, close this tab, or navigate away. Navigating will disrupt the database catalog seed.
                </p>
              </div>
            </div>

            {/* Spinning Loader */}
            <div className="relative h-20 w-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-accent-soft/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-coffee animate-spin" />
            </div>

            {/* Progress Bar Container */}
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-ink">Analyzing backup records...</span>
                <span className="font-black text-coffee">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-surface-3 rounded-full h-3 overflow-hidden border border-line">
                <div 
                  className="bg-coffee h-full rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-mute text-center">
                Fetching remote cover images, encoding into Base64, and updating tags...
              </p>
            </div>
          </div>
        )}

        {status === 'success' && result && (
          <div className="py-8 text-center space-y-8 animate-fade-in flex flex-col items-center justify-center">
            {/* Success Badge */}
            <div className="h-20 w-20 rounded-full bg-publish/15 flex items-center justify-center text-publish ring-8 ring-publish/5 animate-bounce">
              <span className="text-3xl">✓</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-ink">Import Completed</h3>
              <p className="text-sm text-ink-mute max-w-sm mx-auto">
                All book reviews in your WordPress backup WXR file have been successfully processed.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              <div className="p-4 bg-surface-2 rounded-xl border border-line/40 text-center">
                <p className="text-[10px] uppercase font-bold tracking-wider text-ink-mute mb-1">Total Found</p>
                <p className="text-2xl font-black text-ink">{result.totalProcessed}</p>
              </div>
              <div className="p-4 bg-publish/10 rounded-xl border border-publish/20 text-center">
                <p className="text-[10px] uppercase font-bold tracking-wider text-publish mb-1">
                  {duplicateMode === 'replace' ? 'Processed' : 'Imported'}
                </p>
                <p className="text-2xl font-black text-publish">{result.imported}</p>
              </div>
              <div className="p-4 bg-surface-3 rounded-xl border border-line/40 text-center">
                <p className="text-[10px] uppercase font-bold tracking-wider text-ink-mute mb-1">Skipped (Dupes)</p>
                <p className="text-2xl font-black text-ink">{result.skipped}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Link href="/admin/books">
                <KitButton variant="accent">
                  Go to Catalog
                </KitButton>
              </Link>
              <KitButton variant="outline" onClick={resetImporter}>
                Import Another File
              </KitButton>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8 text-center space-y-6 animate-fade-in flex flex-col items-center justify-center">
            {/* Error Badge */}
            <div className="h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center text-danger ring-8 ring-danger/5">
              <span className="text-2xl">✕</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-ink">Import Failed</h3>
              <p className="text-sm text-danger/80 max-w-md mx-auto leading-relaxed">
                {errorMessage || 'An error occurred while parsing and saving the book records.'}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <KitButton variant="accent" onClick={resetImporter}>
                Try Again
              </KitButton>
              <Link href="/admin/books">
                <KitButton variant="outline">
                  View Catalog
                </KitButton>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
