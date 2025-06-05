import React from 'react';
import Card from '../common/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { startOfWeek, format, subWeeks } from 'date-fns';
import { calculateTotalDistance } from '../../utils/calculations';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
        <p className="font-medium">{`Week of ${label}`}</p>
        <p className="text-blue-600">{`Total: ${payload[0].value} miles`}</p>
        <p className="text-xs text-gray-500">{`${payload[0].payload.runCount} runs`}</p>
      </div>
    );
  }

  return null;
};

const WeeklyMileageChart: React.FC = () => {
  const { runs } = useAppContext();

  // Generate weekly stats from actual run data
  const weeklyStats = Array.from({ length: 12 }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), i));
    const weekEnd = startOfWeek(subWeeks(new Date(), i - 1));
    
    const weekRuns = runs.filter(run => {
      const runDate = new Date(run.date);
      return runDate >= weekStart && runDate < weekEnd;
    });

    return {
      week: format(weekStart, 'MMM d'),
      totalMiles: calculateTotalDistance(weekRuns),
      runCount: weekRuns.length
    };
  }).reverse();

  return (
    <Card className="mb-6">
      <h2 className="text-lg font-semibold mb-4">Weekly Mileage</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weeklyStats}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis 
              dataKey="week" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value} mi`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="totalMiles" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default WeeklyMileageChart;