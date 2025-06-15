import React from 'react';
import { AzureResource } from '../types';

interface ResourceCardProps {
  resource: AzureResource;
  onSelect: (resourceId: string) => void;
}

const CategoryColors = {
  compute: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  network: 'bg-green-50 border-green-200 hover:bg-green-100',
  storage: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  web: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
};

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onSelect }) => {
  return (
    <div
      className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${CategoryColors[resource.category]}`}
      onClick={() => onSelect(resource.id)}
    >
      <div className="flex items-center space-x-4">
        <div className="text-4xl">{resource.icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {resource.name}
          </h3>
          <p className="text-sm text-gray-600">
            {resource.description}
          </p>
        </div>
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;