import React, { useState } from 'react';
import ImportOptions from './ImportOptions';
import GarminConnect from './GarminConnect';
import FileImport from './FileImport';

interface ImportHubProps {
  onClose: () => void;
}

type ImportMode = 'options' | 'garmin-connect' | 'file-upload';

const ImportHub: React.FC<ImportHubProps> = ({ onClose }) => {
  const [mode, setMode] = useState<ImportMode>('options');

  const handleSelectOption = (option: 'garmin-connect' | 'file-upload') => {
    setMode(option);
  };

  const handleBack = () => {
    setMode('options');
  };

  switch (mode) {
    case 'garmin-connect':
      return <GarminConnect onClose={onClose} />;
    
    case 'file-upload':
      return <FileImport onClose={onClose} onBack={handleBack} />;
    
    default:
      return <ImportOptions onSelectOption={handleSelectOption} onClose={onClose} />;
  }
};

export default ImportHub;