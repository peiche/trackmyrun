import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Run, Goal } from '../types';
import { mockRuns, mockGoals } from '../data/mockData';

interface AppContextType {
  runs: Run[];
  goals: Goal[];
  addRun: (run: Omit<Run, 'id'>) => void;
  updateRun: (id: string, run: Partial<Run>) => void;
  deleteRun: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleGoalCompletion: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [runs, setRuns] = useState<Run[]>(mockRuns);
  const [goals, setGoals] = useState<Goal[]>(mockGoals);

  // Run functions
  const addRun = (run: Omit<Run, 'id'>) => {
    const newRun = {
      ...run,
      id: `run-${Date.now()}`
    };
    setRuns(prev => [newRun, ...prev]);
  };

  const updateRun = (id: string, runUpdates: Partial<Run>) => {
    setRuns(prev => 
      prev.map(run => run.id === id ? { ...run, ...runUpdates } : run)
    );
  };

  const deleteRun = (id: string) => {
    setRuns(prev => prev.filter(run => run.id !== id));
  };

  // Goal functions
  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal = {
      ...goal,
      id: `goal-${Date.now()}`
    };
    setGoals(prev => [newGoal, ...prev]);
  };

  const updateGoal = (id: string, goalUpdates: Partial<Goal>) => {
    setGoals(prev => 
      prev.map(goal => goal.id === id ? { ...goal, ...goalUpdates } : goal)
    );
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const toggleGoalCompletion = (id: string) => {
    setGoals(prev => 
      prev.map(goal => 
        goal.id === id ? { ...goal, completed: !goal.completed } : goal
      )
    );
  };

  return (
    <AppContext.Provider 
      value={{
        runs,
        goals,
        addRun,
        updateRun,
        deleteRun,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleGoalCompletion
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};