import React from 'react';
import { Sun as Run, Medal, Clock, Zap } from 'lucide-react';
import Card from '../common/Card';
import { useAppContext } from '../../context/AppContext';
import { 
  calculateTotalDistance, 
  calculateAveragePace, 
  getLongestRun, 
  formatPace,
  getRunsByPeriod
} from '../../utils/calculations';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  description, 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  } as { [key: string]: string };

  return (
    <Card className="flex-1">
      <div className="flex items-start">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

const DashboardStats: React.FC = () => {
  const { runs } = useAppContext();
  
  // Get weekly and all-time runs
  const weeklyRuns = getRunsByPeriod(runs, 'week');
  const allRuns = runs;
  
  // Calculate stats
  const totalDistance = calculateTotalDistance(allRuns);
  const weeklyDistance = calculateTotalDistance(weeklyRuns);
  const averagePace = calculateAveragePace(allRuns);
  const longestRun = getLongestRun(allRuns);
  
  // Prepare stat values
  const totalMiles = `${totalDistance.toFixed(1)} mi`;
  const weeklyMiles = `${weeklyDistance.toFixed(1)} mi`;
  const avgPaceFormatted = formatPace(averagePace);
  const longestRunDistance = longestRun ? `${longestRun.distance.toFixed(1)} mi` : '0 mi';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Distance"
        value={totalMiles}
        icon={<Run size={24} />}
        description={`${runs.length} total runs`}
        color="blue"
      />
      <StatCard
        title="Weekly Distance"
        value={weeklyMiles}
        icon={<Zap size={24} />}
        description={`${weeklyRuns.length} runs this week`}
        color="green"
      />
      <StatCard
        title="Average Pace"
        value={avgPaceFormatted}
        icon={<Clock size={24} />}
        description="minutes per mile"
        color="purple"
      />
      <StatCard
        title="Longest Run"
        value={longestRunDistance}
        icon={<Medal size={24} />}
        description={longestRun ? `on ${longestRun.date}` : 'No runs recorded'}
        color="orange"
      />
    </div>
  );
};

export default DashboardStats;