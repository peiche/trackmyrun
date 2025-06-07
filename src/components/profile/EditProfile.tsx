import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';
import { Save, X, User, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EditProfileProps {
  onClose: () => void;
  user: any;
}

const EditProfile: React.FC<EditProfileProps> = ({ onClose, user }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load current profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile && !error) {
        setFormData(prev => ({
          ...prev,
          username: profile.username || ''
        }));
      }
    };

    loadProfile();
  }, [user?.id]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear success message when making changes
    if (successMessage) {
      setSuccessMessage('');
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    // Only validate password fields if user is trying to change password
    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
      
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      // Update username in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: formData.username })
        .eq('id', user.id);

      if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      // Update password if provided
      if (formData.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (passwordError) {
          throw new Error(`Failed to update password: ${passwordError.message}`);
        }
      }

      setSuccessMessage('Profile updated successfully!');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'An error occurred while updating your profile'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <User className="mr-2" size={20} />
          Edit Profile
        </h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Profile Information Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <User className="mr-2" size={16} />
            Profile Information
          </h3>
          
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            placeholder="Enter your username"
            fullWidth
            autoComplete="off"
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            disabled
            fullWidth
            className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Email cannot be changed. Contact support if you need to update your email.
          </p>
        </div>

        {/* Password Change Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Lock className="mr-2" size={16} />
            Change Password
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Leave password fields empty if you don't want to change your password.
          </p>
          
          <div className="relative">
            <Input
              label="Current Password"
              name="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={formData.currentPassword}
              onChange={handleChange}
              error={errors.currentPassword}
              placeholder="Enter your current password"
              fullWidth
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-500"
            >
              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          <div className="relative">
            <Input
              label="New Password"
              name="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={formData.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              placeholder="Enter your new password"
              fullWidth
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-500"
            >
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          <div className="relative">
            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Confirm your new password"
              fullWidth
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-500"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-green-700 dark:text-green-300 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-700 dark:text-red-300 text-sm">{errors.submit}</p>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            icon={<Save size={16} />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default EditProfile;