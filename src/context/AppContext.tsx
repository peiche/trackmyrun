import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Run, Goal } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
  runs: Run[];
  goals: Goal[];
  addRun: (run: Omit<Run, 'id'>) => Promise<void>;
  updateRun: (id: string, run: Partial<Run>) => Promise<void>;
  deleteRun: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  toggleGoalCompletion: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Fetch runs and goals when the component mounts
  useEffect(() => {
    fetchRuns();
    fetchGoals();
  }, []);

  // Fetch runs from Supabase
  const fetchRuns = async () => {
    const { data: runsData, error } = await supabase
      .from('runs')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching runs:', error);
      return;
    }

    setRuns(runsData || []);
  };

  // Fetch goals from Supabase
  const fetchGoals = async () => {
    const { data: goalsData, error } = await supabase
      .from('goals')
      .select('*')
      .order('target_date', { ascending: true });

    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }

    setGoals(goalsData || []);
  };

  // Run functions
  const addRun = async (run: Omit<Run, 'id'>) => {
    const { data, error } = await supabase
      .from('runs')
      .insert([run])
      .select()
      .single();

    if (error) {
      console.error('Error adding run:', error);
      return;
    }

    setRuns(prev => [data, ...prev]);
  };

  const updateRun = async (id: string, runUpdates: Partial<Run>) => {
    const { error } = await supabase
      .from('runs')
      .update(runUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating run:', error);
      return;
    }

    setRuns(prev => 
      prev.map(run => run.id === id ? { ...run, ...runUpdates } : run)
    );
  };

  const deleteRun = async (id: string) => {
    const { error } = await supabase
      .from('runs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting run:', error);
      return;
    }

    setRuns(prev => prev.filter(run => run.id !== id));
  };

  // Goal functions
  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    const { data, error } = await supabase
      .from('goals')
      .insert([goal])
      .select()
      .single();

    if (error) {
      console.error('Error adding goal:', error);
      return;
    }

    setGoals(prev => [data, ...prev]);
  };

  const updateGoal = async (id: string, goalUpdates: Partial<Goal>) => {
    const { error } = await supabase
      .from('goals')
      .update(goalUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating goal:', error);
      return;
    }

    setGoals(prev => 
      prev.map(goal => goal.id === id ? { ...goal, ...goalUpdates } : goal)
    );
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting goal:', error);
      return;
    }

    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const toggleGoalCompletion = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const { error } = await supabase
      .from('goals')
      .update({ completed: !goal.completed })
      .eq('id', id);

    if (error) {
      console.error('Error toggling goal completion:', error);
      return;
    }

    setGoals(prev => 
      prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
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