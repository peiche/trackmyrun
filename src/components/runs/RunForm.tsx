import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Run } from '../../types';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Card from '../common/Card';
import { format } from 'date-fns';
import { calculatePace } from '../../utils/calculations';
import { Save, X } from 'lucide-react';

interface RunFormProps {
  onClose: () => void;
  initialData?: Run;
}

const RunForm: React.FC<RunFormProps> = ({ onClose, initialData }) => {
  const { addRun, updateRun } = useAppContext();
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState<Omit<Run, 'id' | 'pace'>>({
    user_id: initialData?.user_id || '',
    date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
    distance: initialData?.distance || 0,
    duration: initialData?.duration || 0,
    route: initialData?.route || '',
    notes: initialData?.notes || '',
    feeling_rating: initialData?.feeling_rating || 3,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (formData.distance <= 0) {
      newErrors.distance = 'Distance must be greater than 0';
    }
    
    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Calculate pace
    const pace = calculatePace(formData.distance, formData.duration);
    
    if (isEditing && initialData) {
      updateRun(initialData.id, { ...formData, pace });
    } else {
      addRun({ ...formData, pace });
    }
    
    onClose();
  };
  
  const feelingOptions = [
    { value: 1, label: '1 - Terrible' },
    { value: 2, label: '2 - Poor' },
    { value: 3, label: '3 - Average' },
    { value: 4, label: '4 - Good' },
    { value: 5, label: '5 - Excellent' },
  ];
  
  return (
    <Card className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {isEditing ? 'Edit Run' : 'Log New Run'}
        </h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            error={errors.date}
            fullWidth
          />
          
          <Input
            label="Distance (miles)"
            type="number"
            name="distance"
            min="0"
            step="0.01"
            value={formData.distance || ''}
            onChange={handleNumberChange}
            error={errors.distance}
            fullWidth
          />
          
          <Input
            label="Duration (minutes)"
            type="number"
            name="duration"
            min="0"
            step="0.01"
            value={formData.duration || ''}
            onChange={handleNumberChange}
            error={errors.duration}
            fullWidth
          />
          
          <Select
            label="How did you feel?"
            name="feeling_rating"
            options={feelingOptions}
            value={formData.feeling_rating.toString()}
            onChange={handleSelectChange('feeling_rating')}
            fullWidth
          />
        </div>
        
        <Input
          label="Route"
          name="route"
          value={formData.route || ''}
          onChange={handleChange}
          placeholder="Where did you run?"
          fullWidth
          autoComplete="off"
        />
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="How was your run?"
          ></textarea>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            icon={<Save size={16} />}
          >
            {isEditing ? 'Update Run' : 'Save Run'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default RunForm;