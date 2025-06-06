import React, { useState } from 'react';
import Card from '../common/Card';
import { useAppContext } from '../../context/AppContext';
import { formatDate, formatPace } from '../../utils/calculations';
import { Edit, Trash2, CheckCircle, Target, TrendingUp, Calendar, Award } from 'lucide-react';
import GoalForm from './GoalForm';
import { Goal } from '../../types';
import { checkGoalCompletion, getGoalProgressPercentage } from '../../utils/goalCompletion';

const GoalsList: React.FC = () => {
  const { goals, runs, deleteGoal, toggleGoalCompletion } = useAppContext();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Sort goals by completion status and target date
  const sortedGoals = [...goals].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1; // Show incomplete goals first
    }
    return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
  });
  
  const getGoalStatus = (goal: Goal): React.ReactNode => {
    const progress = checkGoalCompletion(goal, runs);
    const progressPercentage = getGoalProgressPercentage(goal, runs);
    
    if (goal.completed) {
      return (
        <div className="space-y-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
            <Award size={12} className="mr-1" /> Completed
          </span>
          <p className="text-xs text-gray-600 dark:text-gray-400">{progress.message}</p>
        </div>
      );
    }
    
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let statusColor = 'blue';
    let statusIcon = <Calendar size={12} className="mr-1" />;
    let timeText = '';
    
    if (diffDays < 0) {
      statusColor = 'red';
      statusIcon = <Calendar size={12} className="mr-1" />;
      timeText = `Overdue by ${Math.abs(diffDays)} days`;
    } else if (diffDays === 0) {
      statusColor = 'orange';
      statusIcon = <Calendar size={12} className="mr-1" />;
      timeText = 'Due today';
    } else if (diffDays <= 7) {
      statusColor = 'orange';
      statusIcon = <Calendar size={12} className="mr-1" />;
      timeText = `${diffDays} days left`;
    } else {
      statusColor = 'blue';
      statusIcon = <Calendar size={12} className="mr-1" />;
      timeText = `${diffDays} days left`;
    }
    
    if (progress.isAchieved) {
      statusColor = 'green';
      statusIcon = <CheckCircle size={12} className="mr-1" />;
    }
    
    const colorClasses = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
    };
    
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[statusColor]}`}>
            {statusIcon}
            {progress.isAchieved ? 'Goal Achieved!' : timeText}
          </span>
          {progressPercentage > 0 && progressPercentage < 100 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
              <TrendingUp size={12} className="mr-1" />
              {progressPercentage.toFixed(0)}%
            </span>
          )}
        </div>
        
        {/* Progress bar */}
        {progressPercentage > 0 && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progress.isAchieved ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, progressPercentage)}%` }}
            ></div>
          </div>
        )}
        
        <p className="text-xs text-gray-600 dark:text-gray-400">{progress.message}</p>
      </div>
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
                    : checkGoalCompletion(goal, runs).isAchieved
                    ? 'border-l-green-400'
                    : 'border-l-blue-500'}
                `}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mr-3">
                        {goal.name}
                      </h3>
                      <div className="flex items-center ml-3">
                        <button
                          onClick={() => toggleGoalCompletion(goal.id)}
                          className={`
                            mr-2 p-1.5 rounded-md transition-colors
                            ${goal.completed 
                              ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' 
                              : 'text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }
                          `}
                          title={goal.completed ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => setEditingGoal(goal)}
                          className="mr-2 p-1.5 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Edit goal"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="p-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete goal"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">
                      Target date: {formatDate(goal.target_date)}
                    </p>
                    
                    {getGoalStatus(goal)}
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {goal.target_distance && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-md p-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Target Distance:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{goal.target_distance} miles</span>
                    </div>
                  )}
                  
                  {goal.target_pace && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-md p-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Target Pace:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatPace(goal.target_pace)} per mile</span>
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