import React, { useState } from 'react';
import Card from '../common/Card';
import Select from '../common/Select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { startOfWeek, startOfMonth, format, subWeeks, subMonths } from 'date-fns';
import { calculateTotalDistance, calculateAveragePace } from '../../utils/calculations';
import { formatPace } from '../../utils/calculations';

const PaceChart: React.FC<{ data: any[] }> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 p-3 shadow-md rounded-md border border-gray-200 dark:border-gray-900">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600 dark:text-blue-400">Avg Pace: {formatPace(payload[0].payload.avgPace)}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="mb-6">
      <h2 className="text-lg font-semibold mb-4">Pace Trends</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="text-gray-100 dark:text-gray-800" stroke="currentColor" />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              className="text-gray-500 dark:text-gray-400"
              style={{ fill: 'currentcolor' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatPace(value)}
              domain={['dataMin - 1', 'dataMax + 1']}
              allowDecimals={false}
              className="text-gray-500 dark:text-gray-400"
              style={{ fill: 'currentcolor' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="avgPace"
              stroke="#14B8A6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6, stroke: '#14B8A6', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const MileageChart: React.FC<{ data: any[] }> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 p-3 shadow-md rounded-md border border-gray-200 dark:border-gray-900">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600 dark:text-blue-400">Total Distance: {payload[0].payload.totalMiles.toFixed(1)} miles</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="mb-6">
      <h2 className="text-lg font-semibold mb-4">Mileage Progress</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="text-gray-100 dark:text-gray-800" stroke="currentColor" />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              className="text-gray-500 dark:text-gray-400"
              style={{ fill: 'currentcolor' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value} mi`}
              className="text-gray-500 dark:text-gray-400"
              style={{ fill: 'currentcolor' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="totalMiles"
              stroke="#3B82F6"
              fill="url(#colorMiles)"
              strokeWidth={2}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              animationDuration={1500}
            />
            <defs>
              <linearGradient id="colorMiles" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const RunCountChart: React.FC<{ data: any[] }> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 p-3 shadow-md rounded-md border border-gray-200 dark:border-gray-900">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600 dark:text-blue-400">Run Count: {payload[0].payload.runCount} run{payload[0].payload.runCount !== 1 ? 's' : ''}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="mb-6">
      <h2 className="text-lg font-semibold mb-4">Run Frequency</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="text-gray-100 dark:text-gray-800" stroke="currentColor" />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              className="text-gray-500 dark:text-gray-400"
              style={{ fill: 'currentcolor' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, 'dataMax + 1']}
              allowDecimals={false}
              tickFormatter={(value) => `${value} runs`}
              className="text-gray-500 dark:text-gray-400"
              style={{ fill: 'currentcolor' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="runCount"
              stroke="#F97316"
              fill="url(#colorRuns)"
              strokeWidth={2}
              activeDot={{ r: 6, stroke: '#F97316', strokeWidth: 2 }}
              animationDuration={1500}
            />
            <defs>
              <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const ProgressCharts: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');
  const { runs } = useAppContext();

  // Generate stats based on actual run data
  const generateStats = () => {
    if (timeRange === 'weekly') {
      return Array.from({ length: 12 }, (_, i) => {
        const periodStart = startOfWeek(subWeeks(new Date(), i));
        const periodEnd = startOfWeek(subWeeks(new Date(), i - 1));

        const periodRuns = runs.filter(run => {
          const runDate = new Date(run.date);
          return runDate >= periodStart && runDate < periodEnd;
        });

        return {
          period: format(periodStart, 'MMM d'),
          totalMiles: calculateTotalDistance(periodRuns),
          avgPace: calculateAveragePace(periodRuns),
          runCount: periodRuns.length
        };
      }).reverse();
    } else {
      return Array.from({ length: 6 }, (_, i) => {
        const periodStart = startOfMonth(subMonths(new Date(), i));
        const periodEnd = startOfMonth(subMonths(new Date(), i - 1));

        const periodRuns = runs.filter(run => {
          const runDate = new Date(run.date);
          return runDate >= periodStart && runDate < periodEnd;
        });

        return {
          period: format(periodStart, 'MMM yyyy'),
          totalMiles: calculateTotalDistance(periodRuns),
          avgPace: calculateAveragePace(periodRuns),
          runCount: periodRuns.length
        };
      }).reverse();
    }
  };

  const data = generateStats();

  const timeRangeOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Select
          options={timeRangeOptions}
          value={timeRange}
          onChange={(value) => setTimeRange(value as 'weekly' | 'monthly')}
          className="w-40"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MileageChart data={data} />
        <PaceChart data={data} />
      </div>

      <RunCountChart data={data} />
    </div>
  );
};

export default ProgressCharts;