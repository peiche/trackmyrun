import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Goal } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';
import { format, addMonths } from 'date-fns';
import { Save, X } from 'lucide-react';

interface GoalFormProps {
  onClose: () => void;
  initialData?: Goal;
}

const GoalForm: React.FC<GoalFormProps> = ({ onClose, initialData }) => {
  const { addGoal, updateGoal } = useAppContext();
  const isEditing = !!initialData;
  
  // Set default target date to 3 months from now
  const defaultTargetDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd');
  
  const [formData, setFormData] = useState<Omit<Goal, 'id'>>({
    name: initialData?.name || '',
    target_date: initialData?.target_date || defaultTargetDate,
    target_distance: initialData?.target_distance || undefined,
    target_pace: initialData?.target_pace || undefined,
    description: initialData?.description || '',
    completed: initialData?.completed || false,
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
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData(prev => ({ ...prev, [name]: numValue }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required';
    }
    
    if (!formData.target_date) {
      newErrors.targetDate = 'Target date is required';
    }
    
    if (formData.target_distance !== undefined && formData.target_distance <= 0) {
      newErrors.targetDistance = 'Target distance must be greater than 0';
    }
    
    if (formData.target_pace !== undefined && formData.target_pace <= 0) {
      newErrors.targetPace = 'Target pace must be greater than 0';
    }
    
    if (!formData.target_distance && !formData.target_pace) {
      newErrors.targetDistance = 'At least one target (distance or pace) is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isEditing && initialData) {
      updateGoal(initialData.id, formData);
    } else {
      addGoal(formData);
    }
    
    onClose();
  };
  
  return (
    <Card className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {isEditing ? 'Edit Goal' : 'Create New Goal'}
        </h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Input
          label="Goal Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="e.g., Complete a 10K race"
          fullWidth
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Target Date"
            type="date"
            name="targetDate"
            value={formData.target_date}
            onChange={handleChange}
            error={errors.targetDate}
            fullWidth
          />
          
          <Input
            label="Target Distance (miles)"
            type="number"
            name="targetDistance"
            min="0"
            step="0.1"
            value={formData.target_distance === undefined ? '' : formData.target_distance}
            onChange={handleNumberChange}
            error={errors.targetDistance}
            placeholder="Optional"
            fullWidth
          />
          
          <Input
            label="Target Pace (min/mile)"
            type="number"
            name="targetPace"
            min="0"
            step="0.1"
            value={formData.target_pace === undefined ? '' : formData.target_pace}
            onChange={handleNumberChange}
            error={errors.targetPace}
            placeholder="Optional"
            fullWidth
          />
          
          <div className="flex items-center h-full pt-3">
            <input
              type="checkbox"
              name="completed"
              id="completed"
              checked={formData.completed}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label 
              htmlFor="completed" 
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              Mark as completed
            </label>
          </div>
        </div>
        
        <div className="mb-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional details about your goal"
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
            {isEditing ? 'Update Goal' : 'Save Goal'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default GoalForm;