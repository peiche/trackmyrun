import React, { Fragment, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ChevronDown } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { colorMode, setColorMode } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const options = [
    { value: 'light', icon: <Sun size={16} />, label: 'Light' },
    { value: 'dark', icon: <Moon size={16} />, label: 'Dark' },
    { value: 'system', icon: <Monitor size={16} />, label: 'System' },
  ] as const;

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <span className="flex items-center space-x-2">
            {options.filter(option => option.value === colorMode).map((option, index) => (
              <Fragment key={index}>
                {option.icon}
                <span className="hidden sm:inline">{option.label}</span>
              </Fragment>
            ))}
          </span>
          <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 _w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
            <div className="flex px-1">
              {options.map(({ value, icon, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setColorMode(value);
                    setShowDropdown(false);
                  }}
                  className={`
                    flex items-center space-x-2 px-3 py-1.5 rounded text-sm font-medium
                    transition-colors duration-200
                    ${colorMode === value
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThemeToggle