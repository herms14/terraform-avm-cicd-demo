import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ResourceConfig, DeploymentRequest } from '../types';

interface DeploymentFormProps {
  config: ResourceConfig;
  onSubmit: (data: Partial<DeploymentRequest>) => void;
  onCancel: () => void;
}

const DeploymentForm: React.FC<DeploymentFormProps> = ({ config, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [environment, setEnvironment] = useState<'dev' | 'prod'>('dev');
  const [subscription, setSubscription] = useState<'FireGiants-Prod' | 'Nokron-Prod'>('FireGiants-Prod');

  const onFormSubmit = (data: any) => {
    const deploymentRequest: Partial<DeploymentRequest> = {
      resourceType: config.resourceType,
      environment,
      subscription,
      tfvars: {
        ...data,
        // Add standard tags
        tags: {
          deployedBy: 'Hermes',
          managedBy: 'Terraform',
          environment: environment,
          application: 'erdtree-portal',
          resourceType: config.resourceType
        }
      }
    };
    onSubmit(deploymentRequest);
  };

  const getInputType = (varType: string) => {
    switch (varType) {
      case 'number':
        return 'number';
      case 'bool':
        return 'checkbox';
      default:
        return 'text';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Deploy {config.resourceType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          {/* Environment and Subscription Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as 'dev' | 'prod')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-azure-500"
              >
                <option value="dev">Development</option>
                <option value="prod">Production</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscription
              </label>
              <select
                value={subscription}
                onChange={(e) => setSubscription(e.target.value as 'FireGiants-Prod' | 'Nokron-Prod')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-azure-500"
              >
                <option value="FireGiants-Prod">FireGiants-Prod</option>
                <option value="Nokron-Prod">Nokron-Prod</option>
              </select>
            </div>
          </div>

          {/* Dynamic Form Fields */}
          {config.variables.map((variable) => (
            <div key={variable.name}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {variable.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {variable.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <p className="text-xs text-gray-500 mb-2">{variable.description}</p>
              
              {variable.type === 'bool' ? (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register(variable.name)}
                    defaultChecked={variable.default}
                    className="h-4 w-4 text-azure-600 focus:ring-azure-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable</span>
                </div>
              ) : (
                <input
                  type={getInputType(variable.type)}
                  {...register(variable.name, { 
                    required: variable.required ? `${variable.name} is required` : false 
                  })}
                  defaultValue={variable.default}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-azure-500"
                  placeholder={variable.default ? `Default: ${variable.default}` : ''}
                />
              )}
              
              {errors[variable.name] && (
                <p className="text-red-500 text-xs mt-1">
                  {errors[variable.name]?.message as string}
                </p>
              )}
            </div>
          ))}

          {/* Form Actions */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-azure-600 text-white rounded-md hover:bg-azure-700 focus:outline-none focus:ring-2 focus:ring-azure-500"
            >
              Submit for Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeploymentForm;