import React from 'react';
import { Upload, ExternalLink, FileText } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

interface ImportOptionsProps {
  onSelectOption: (option: 'garmin-connect' | 'file-upload') => void;
  onClose: () => void;
}

const ImportOptions: React.FC<ImportOptionsProps> = ({ onSelectOption, onClose }) => {
  return (
    <Card className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Import Your Running Data</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ×
        </button>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Choose how you'd like to import your running data into RunTracker.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors group"
          onClick={() => onSelectOption('garmin-connect')}
        >
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 transition-colors">
              <ExternalLink className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Garmin Connect
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Connect your Garmin account to automatically sync your activities. 
              Choose which runs to import and keep your data up to date.
            </p>
            <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Automatic sync
              </div>
              <div className="flex items-center justify-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Select activities
              </div>
              <div className="flex items-center justify-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Real-time data
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors group"
          onClick={() => onSelectOption('file-upload')}
        >
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-teal-100 dark:bg-teal-900/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/40 transition-colors">
              <Upload className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Upload Files
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload TCX or GPX files exported from Garmin Connect or other fitness platforms. 
              Perfect for one-time imports or historical data.
            </p>
            <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                TCX & GPX support
              </div>
              <div className="flex items-center justify-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Batch upload
              </div>
              <div className="flex items-center justify-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                No account needed
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <div className="flex items-start">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              How to export from Garmin Connect
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>1. Log into your Garmin Connect account</li>
              <li>2. Go to Activities and select the run you want to export</li>
              <li>3. Click the gear icon (⚙️) and select "Export to TCX" or "Export to GPX"</li>
              <li>4. Use the file upload option above to import the downloaded file</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Card>
  );
};

export default ImportOptions;