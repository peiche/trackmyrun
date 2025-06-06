import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Run, Goal } from '../types';
import { supabase } from '../lib/supabase';
import { checkAllGoalsForCompletion } from '../utils/goalCompletion';

interface AppContextType {
  runs: Run[];
  goals: Goal[];
  addRun: (run: Omit<Run, 'id' | 'user_id'>) => Promise<void>;
  updateRun: (id: string, run: Partial<Omit<Run, 'id' | 'user_id'>>) => Promise<void>;
  deleteRun: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'user_id'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Omit<Goal, 'id' | 'user_id'>>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  toggleGoalCompletion: (id: string) => Promise<void>;
  checkGoalCompletions: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
  currentUserId: string | null;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, currentUserId }) => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Fetch runs and goals when the component mounts or user changes
  useEffect(() => {
    if (currentUserId) {
      fetchRuns();
      fetchGoals();
    } else {
      setRuns([]);
      setGoals([]);
    }
  }, [currentUserId]);

  // Check for goal completions whenever runs or goals change
  useEffect(() => {
    if (currentUserId && runs.length > 0 && goals.length > 0) {
      checkGoalCompletions();
    }
  }, [runs.length, goals.length, currentUserId]);

  // Fetch runs from Supabase
  const fetchRuns = async () => {
    if (!currentUserId) return;

    const { data: runsData, error } = await supabase
      .from('runs')
      .select('*')
      .eq('user_id', currentUserId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching runs:', error);
      return;
    }

    setRuns(runsData || []);
  };

  // Fetch goals from Supabase
  const fetchGoals = async () => {
    if (!currentUserId) return;

    const { data: goalsData, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', currentUserId)
      .order('target_date', { ascending: true });

    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }

    setGoals(goalsData || []);
  };

  // Check for automatic goal completions
  const checkGoalCompletions = async () => {
    if (!currentUserId || goals.length === 0 || runs.length === 0) return;

    const goalsToUpdate = checkAllGoalsForCompletion(goals, runs);
    
    if (goalsToUpdate.length > 0) {
      console.log(`Auto-completing ${goalsToUpdate.length} goals`);
      
      // Update goals in database
      for (const goal of goalsToUpdate) {
        const { error } = await supabase
          .from('goals')
          .update({ completed: true })
          .eq('id', goal.id)
          .eq('user_id', currentUserId);

        if (error) {
          console.error('Error auto-completing goal:', error);
        }
      }

      // Update local state
      setGoals(prev => 
        prev.map(goal => {
          const updatedGoal = goalsToUpdate.find(g => g.id === goal.id);
          return updatedGoal ? { ...goal, completed: true } : goal;
        })
      );
    }
  };

  // Run functions
  const addRun = async (run: Omit<Run, 'id' | 'user_id'>) => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('runs')
      .insert([{ ...run, user_id: currentUserId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding run:', error);
      return;
    }

    setRuns(prev => [data, ...prev]);
  };

  const updateRun = async (id: string, runUpdates: Partial<Omit<Run, 'id' | 'user_id'>>) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('runs')
      .update(runUpdates)
      .eq('id', id)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error updating run:', error);
      return;
    }

    setRuns(prev => 
      prev.map(run => run.id === id ? { ...run, ...runUpdates } : run)
    );
  };

  const deleteRun = async (id: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('runs')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error deleting run:', error);
      return;
    }

    setRuns(prev => prev.filter(run => run.id !== id));
  };

  // Goal functions
  const addGoal = async (goal: Omit<Goal, 'id' | 'user_id'>) => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('goals')
      .insert([{ ...goal, user_id: currentUserId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding goal:', error);
      return;
    }

    setGoals(prev => [data, ...prev]);
  };

  const updateGoal = async (id: string, goalUpdates: Partial<Omit<Goal, 'id' | 'user_id'>>) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('goals')
      .update(goalUpdates)
      .eq('id', id)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error updating goal:', error);
      return;
    }

    setGoals(prev => 
      prev.map(goal => goal.id === id ? { ...goal, ...goalUpdates } : goal)
    );
  };

  const deleteGoal = async (id: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error deleting goal:', error);
      return;
    }

    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const toggleGoalCompletion = async (id: string) => {
    if (!currentUserId) return;

    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const { error } = await supabase
      .from('goals')
      .update({ completed: !goal.completed })
      .eq('id', id)
      .eq('user_id', currentUserId);

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
        toggleGoalCompletion,
        checkGoalCompletions
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