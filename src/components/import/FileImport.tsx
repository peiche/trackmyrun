import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAppContext } from '../../context/AppContext';
import { parseGarminFile, parseCSVFile } from '../../utils/garminParser';

interface FileImportProps {
  onClose: () => void;
}

interface ImportResult {
  success: boolean;
  fileName: string;
  message: string;
  runData?: any;
  runCount?: number;
}

const FileImport: React.FC<FileImportProps> = ({ onClose }) => {
  const { addRun } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setResults([]);

    const newResults: ImportResult[] = [];

    for (const file of files) {
      try {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (!['tcx', 'gpx', 'csv'].includes(fileExtension || '')) {
          newResults.push({
            success: false,
            fileName: file.name,
            message: 'Unsupported file format. Please use TCX, GPX, or CSV files.'
          });
          continue;
        }

        const fileContent = await readFileContent(file);

        if (fileExtension === 'csv') {
          // Handle CSV files (multiple runs)
          const runs = await parseCSVFile(fileContent);
          
          if (runs && runs.length > 0) {
            let successCount = 0;
            let errorCount = 0;

            for (const runData of runs) {
              try {
                await addRun(runData);
                successCount++;
              } catch (error) {
                errorCount++;
                console.error('Error adding run:', error);
              }
            }

            newResults.push({
              success: successCount > 0,
              fileName: file.name,
              message: `Imported ${successCount} runs successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
              runCount: successCount
            });
          } else {
            newResults.push({
              success: false,
              fileName: file.name,
              message: 'No valid run data found in CSV file.'
            });
          }
        } else {
          // Handle TCX/GPX files (single run)
          const runData = await parseGarminFile(fileContent, fileExtension || '');

          if (runData) {
            await addRun(runData);
            newResults.push({
              success: true,
              fileName: file.name,
              message: `Successfully imported run: ${runData.distance} miles on ${runData.date}`,
              runData
            });
          } else {
            newResults.push({
              success: false,
              fileName: file.name,
              message: 'Could not parse run data from file.'
            });
          }
        }
      } catch (error) {
        newResults.push({
          success: false,
          fileName: file.name,
          message: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    setResults(newResults);
    setIsProcessing(false);
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;
  const totalImportedRuns = results.reduce((sum, r) => sum + (r.runCount || (r.success ? 1 : 0)), 0);

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Upload Running Files</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Upload your runs by uploading TCX, GPX, or CSV files from Garmin Connect, Strava, or other fitness platforms.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Individual Files (TCX/GPX):</h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>1. Go to Garmin Connect and select your activity</li>
              <li>2. Click the gear icon (⚙️) in the top right</li>
              <li>3. Select "Export to TCX" or "Export to GPX"</li>
              <li>4. Upload the downloaded file here</li>
            </ol>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Bulk Import (CSV):</h4>
            <ol className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>1. Go to Garmin Connect Data Export</li>
              <li>2. Request your data export</li>
              <li>3. Download the activities CSV file</li>
              <li>4. Upload the CSV file here for bulk import</li>
            </ol>
          </div>
        </div>
      </div>

      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {isProcessing ? 'Processing files...' : 'Drop files here or click to browse'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Supports TCX, GPX, and CSV files from Garmin, Strava, and other fitness platforms
        </p>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          variant="outline"
        >
          <FileText size={16} className="mr-2" />
          Choose Files
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".tcx,.gpx,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {results.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Import Results</h3>
            <div className="flex space-x-4 text-sm">
              {totalImportedRuns > 0 && (
                <span className="text-green-600 dark:text-green-400">
                  ✓ {totalImportedRuns} runs imported
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600 dark:text-red-400">
                  ✗ {errorCount} files failed
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`
                  flex items-start p-3 rounded-md border
                  ${result.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }
                `}
              >
                <div className="flex-shrink-0 mr-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {result.fileName}
                  </p>
                  <p className={`text-sm ${result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <Button
          variant="outline"
          onClick={onClose}
        >
          {results.length > 0 ? 'Done' : 'Cancel'}
        </Button>
      </div>
    </Card>
  );
};

export default FileImport;