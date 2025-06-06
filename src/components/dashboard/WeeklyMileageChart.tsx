import React from 'react';
import Card from '../common/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { startOfWeek, format, subWeeks } from 'date-fns';
import { calculateTotalDistance } from '../../utils/calculations';
import { useTheme } from '../../context/ThemeContext';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 p-3 shadow-md rounded-md border border-gray-200 dark:border-gray-900">
        <p className="font-medium">{`Week of ${label}`}</p>
        <p className="text-blue-600 dark:text-blue-400">{`Total: ${payload[0].value} miles`}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{`${payload[0].payload.runCount} run${payload[0].payload.runCount !== 1 ? 's' : ''}`}</p>
      </div>
    );
  }

  return null;
};

const WeeklyMileageChart: React.FC = () => {
  const { runs } = useAppContext();
  const { isDark } = useTheme();

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

  const cursorFillColor = isDark ? 'rgb(55 65 81)' : 'rgb(204, 204, 204)';

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
              className="text-gray-500 dark:text-gray-400"
              style={{ fill: 'currentcolor' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value} mi`}
              className="text-gray-500 dark:text-gray-400"
              style={{ fill: 'currentcolor' }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: cursorFillColor }}
            />
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