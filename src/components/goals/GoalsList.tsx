import React, { useState } from 'react';
import Card from '../common/Card';
import { useAppContext } from '../../context/AppContext';
import { formatDate, formatPace } from '../../utils/calculations';
import { Edit, Trash2, CheckCircle, Target } from 'lucide-react';
import GoalForm from './GoalForm';
import { Goal } from '../../types';

const GoalsList: React.FC = () => {
  const { goals, deleteGoal, toggleGoalCompletion } = useAppContext();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Sort goals by completion status and target date
  const sortedGoals = [...goals].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1; // Show incomplete goals first
    }
    return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
  });
  
  const getGoalProgress = (goal: Goal): React.ReactNode => {
    if (goal.completed) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900 text-green-800 dark:text-green-200">
          <CheckCircle size={12} className="mr-1" /> Completed
        </span>
      );
    }
    
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Overdue by {Math.abs(diffDays)} days
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900 text-blue-800 dark:text-blue-200">
        {diffDays} days left
      </span>
    );
  };
  
  return (
    <>
      {editingGoal ? (
        <GoalForm 
          initialData={editingGoal} 
          onClose={() => setEditingGoal(null)} 
        />
      ) : (
        <div className="space-y-6">
          {sortedGoals.length > 0 ? (
            sortedGoals.map((goal) => (
              <Card 
                key={goal.id} 
                className={`
                  border-l-4 transition-all
                  ${goal.completed 
                    ? 'border-l-green-500' 
                    : 'border-l-blue-500'}
                `}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mr-3">
                        {goal.name}
                      </h3>
                      {getGoalProgress(goal)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Target date: {formatDate(goal.target_date)}
                    </p>
                  </div>
                  
                  <div className="flex items-center mt-3 sm:mt-0">
                    <button
                      onClick={() => toggleGoalCompletion(goal.id)}
                      className={`
                        mr-2 p-1.5 rounded-md
                        ${goal.completed ? 'text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-900' : 'text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-900'}
                      `}
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="mr-2 p-1.5 rounded-md text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-900"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {goal.target_distance && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                      <span className="text-xs text-gray-500 block">Target Distance:</span>
                      <span className="font-medium">{goal.target_distance} miles</span>
                    </div>
                  )}
                  
                  {goal.target_pace && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                      <span className="text-xs text-gray-500 block">Target Pace:</span>
                      <span className="font-medium">{formatPace(goal.target_pace)} per mile</span>
                    </div>
                  )}
                </div>
                
                {goal.description && (
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <p>{goal.description}</p>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No goals yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create your first running goal to track your progress
              </p>
            </Card>
          )}
        </div>
      )}
    </>
  );
};

export default GoalsList;