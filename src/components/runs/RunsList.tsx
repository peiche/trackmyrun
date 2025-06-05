import React, { useState } from 'react';
import Card from '../common/Card';
import { useAppContext } from '../../context/AppContext';
import { formatDate, formatPace, formatDuration } from '../../utils/calculations';
import { Edit, Trash2, Search, Sun as Run } from 'lucide-react';
import RunForm from './RunForm';
import { Run as RunType } from '../../types';

const RunsList: React.FC = () => {
  const { runs, deleteRun } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRun, setEditingRun] = useState<RunType | null>(null);
  
  // Filter runs based on search term
  const filteredRuns = runs.filter(run => {
    const searchLower = searchTerm.toLowerCase();
    return (
      run.date.toLowerCase().includes(searchLower) ||
      (run.route && run.route.toLowerCase().includes(searchLower)) ||
      (run.notes && run.notes.toLowerCase().includes(searchLower))
    );
  });

  // Function to get feeling emoji
  const getFeelingEmoji = (rating: number): string => {
    const emojis = ['😣', '😕', '😐', '🙂', '😄'];
    return emojis[Math.min(rating - 1, 4)];
  };
  
  return (
    <>
      {editingRun ? (
        <RunForm 
          initialData={editingRun} 
          onClose={() => setEditingRun(null)} 
        />
      ) : (
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-lg font-semibold mb-2 sm:mb-0">All Runs</h2>
            <div className="w-full sm:w-auto flex items-center">
              <div className="relative flex-grow mr-2">
                <input
                  type="text"
                  placeholder="Search runs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          {filteredRuns.length > 0 ? (
            <div className="overflow-x-auto -mx-5">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pace
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Feeling
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50 dark:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(run.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {run.distance} mi
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatDuration(run.duration)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatPace(run.pace)} /mi
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {getFeelingEmoji(run.feeling_rating)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                        {run.route || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingRun(run)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteRun(run.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Run className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No runs found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Try a different search term or clear the search' : 'Start by logging your first run'}
              </p>
            </div>
          )}
        </Card>
      )}
    </>
  );
};

export default RunsList;