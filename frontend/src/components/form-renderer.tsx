/**
 * Dynamic Form Renderer
 * Generates forms from AVM module schemas with validation
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { ModuleSchema, TerraformVariable, SchemaFormData, FormField, TERRAFORM_TYPES } from '../types/schema';

interface FormRendererProps {
  schema: ModuleSchema;
  onSubmit: (data: SchemaFormData) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: SchemaFormData;
  isSubmitting?: boolean;
  className?: string;
}

interface FormCategory {
  name: string;
  label: string;
  description: string;
  fields: FormField[];
  icon: string;
}

const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  onSubmit,
  onCancel,
  initialData = {},
  isSubmitting = false,
  className = ''
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('basic');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Convert Terraform variables to form fields
  const formFields = useMemo(() => {
    return schema.variables.map(variable => convertToFormField(variable));
  }, [schema.variables]);

  // Group fields by categories
  const categorizedFields = useMemo(() => {
    const categories: Record<string, FormField[]> = {
      basic: [],
      networking: [],
      security: [],
      advanced: []
    };

    formFields.forEach(field => {
      const category = field.category || categorizeField(field);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(field);
    });

    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });

    return categories;
  }, [formFields]);

  const formCategories: FormCategory[] = useMemo(() => {
    return Object.entries(categorizedFields).map(([key, fields]) => ({
      name: key,
      label: getCategoryLabel(key),
      description: getCategoryDescription(key),
      fields,
      icon: getCategoryIcon(key)
    }));
  }, [categorizedFields]);

  // Initialize react-hook-form
  const { 
    control, 
    handleSubmit, 
    watch, 
    setValue, 
    formState: { errors, isValid, isDirty },
    reset
  } = useForm<SchemaFormData>({
    defaultValues: getDefaultValues(formFields, initialData),
    mode: 'onChange'
  });

  // Watch all form values for conditional fields
  const watchedValues = watch();

  // Reset form when schema changes
  useEffect(() => {
    reset(getDefaultValues(formFields, initialData));
  }, [schema.moduleId, formFields, initialData, reset]);

  // Handle form submission
  const onFormSubmit = async (data: SchemaFormData) => {
    try {
      // Process data before submission
      const processedData = processFormData(data, formFields);
      await onSubmit(processedData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Render field based on type
  const renderField = (field: FormField) => {
    const error = errors[field.name];
    const isRequired = field.required;
    const shouldShow = shouldShowField(field, watchedValues);

    if (!shouldShow) return null;

    return (
      <div key={field.name} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
          {field.sensitive && <span className="text-orange-500 ml-1">🔒</span>}
        </label>

        {field.description && (
          <p className="text-sm text-gray-500">{field.description}</p>
        )}

        <Controller
          name={field.name}
          control={control}
          rules={getValidationRules(field)}
          render={({ field: fieldProps }) => (
            <div>
              {renderFieldInput(field, fieldProps)}
              {error && (
                <p className="mt-1 text-sm text-red-600">{error.message}</p>
              )}
            </div>
          )}
        />
      </div>
    );
  };

  // Render field input based on type
  const renderFieldInput = (field: FormField, fieldProps: any) => {
    const baseClassName = `
      w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      disabled:bg-gray-50 disabled:text-gray-500
    `;

    switch (field.type) {
      case 'text':
        return (
          <input
            {...fieldProps}
            type={field.sensitive ? 'password' : 'text'}
            placeholder={field.placeholder}
            className={baseClassName}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...fieldProps}
            placeholder={field.placeholder}
            rows={4}
            className={baseClassName}
          />
        );

      case 'number':
        return (
          <input
            {...fieldProps}
            type="number"
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={baseClassName}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              {...fieldProps}
              type="checkbox"
              checked={fieldProps.value || false}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              {field.placeholder || 'Enable this option'}
            </label>
          </div>
        );

      case 'select':
        return (
          <select {...fieldProps} className={baseClassName}>
            <option value="">Select an option</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(fieldProps.value || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValue = fieldProps.value || [];
                    const newValue = e.target.checked
                      ? [...currentValue, option.value]
                      : currentValue.filter((v: any) => v !== option.value);
                    fieldProps.onChange(newValue);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'json':
        return (
          <textarea
            {...fieldProps}
            placeholder='{"key": "value"}'
            rows={6}
            className={`${baseClassName} font-mono text-sm`}
            value={typeof fieldProps.value === 'object' 
              ? JSON.stringify(fieldProps.value, null, 2) 
              : fieldProps.value || ''
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                fieldProps.onChange(parsed);
              } catch {
                fieldProps.onChange(e.target.value);
              }
            }}
          />
        );

      case 'array':
        return <ArrayField field={field} fieldProps={fieldProps} />;

      case 'location':
        return <LocationSelector fieldProps={fieldProps} />;

      case 'resourceGroup':
        return <ResourceGroupSelector fieldProps={fieldProps} />;

      default:
        return (
          <input
            {...fieldProps}
            type="text"
            placeholder={field.placeholder}
            className={baseClassName}
          />
        );
    }
  };

  // Array field component
  const ArrayField: React.FC<{ field: FormField; fieldProps: any }> = ({ field, fieldProps }) => {
    const { fields, append, remove } = useFieldArray({
      control,
      name: field.name
    });

    return (
      <div className="space-y-2">
        {fields.map((item, index) => (
          <div key={item.id} className="flex items-center space-x-2">
            <input
              value={fieldProps.value?.[index] || ''}
              onChange={(e) => {
                const newValue = [...(fieldProps.value || [])];
                newValue[index] = e.target.value;
                fieldProps.onChange(newValue);
              }}
              placeholder={field.placeholder}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="p-2 text-red-600 hover:text-red-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append('')}
          className="px-3 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
        >
          + Add Item
        </button>
      </div>
    );
  };

  // Location selector component
  const LocationSelector: React.FC<{ fieldProps: any }> = ({ fieldProps }) => {
    const azureLocations = [
      { value: 'eastus', label: 'East US' },
      { value: 'eastus2', label: 'East US 2' },
      { value: 'westus', label: 'West US' },
      { value: 'westus2', label: 'West US 2' },
      { value: 'centralus', label: 'Central US' },
      { value: 'northeurope', label: 'North Europe' },
      { value: 'westeurope', label: 'West Europe' },
      { value: 'southeastasia', label: 'Southeast Asia' },
      { value: 'eastasia', label: 'East Asia' }
    ];

    return (
      <select
        {...fieldProps}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select Azure Region</option>
        {azureLocations.map(location => (
          <option key={location.value} value={location.value}>
            {location.label}
          </option>
        ))}
      </select>
    );
  };

  // Resource group selector component
  const ResourceGroupSelector: React.FC<{ fieldProps: any }> = ({ fieldProps }) => {
    // In a real implementation, this would fetch from Azure API
    return (
      <input
        {...fieldProps}
        type="text"
        placeholder="Enter resource group name"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      />
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{schema.icon}</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Deploy {schema.name}
            </h2>
            <p className="text-sm text-gray-600">
              Version {schema.version} • {schema.metadata.maturity}
            </p>
          </div>
        </div>
        <p className="mt-2 text-gray-600">{schema.description}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
        {/* Category tabs */}
        {formCategories.length > 1 && (
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {formCategories.map(category => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setActiveCategory(category.name)}
                  className={`
                    pb-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${activeCategory === category.name
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {category.fields.length}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-6">
          {formCategories
            .filter(category => 
              formCategories.length === 1 || category.name === activeCategory
            )
            .map(category => (
              <div key={category.name} className="space-y-4">
                {formCategories.length > 1 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <span className="mr-2">{category.icon}</span>
                      {category.label}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {category.fields.map(renderField)}
                </div>
              </div>
            ))
          }
        </div>

        {/* Advanced options toggle */}
        {!showAdvanced && formCategories.some(cat => cat.name === 'advanced' && cat.fields.length > 0) && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowAdvanced(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Show Advanced Options
            </button>
          </div>
        )}

        {/* Validation summary */}
        {showValidation && Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="text-red-800 font-medium mb-2">Please fix the following errors:</h4>
            <ul className="text-red-700 text-sm space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>• {field}: {error?.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {Object.keys(watchedValues).length} of {formFields.length} fields configured
            </span>
            {!isValid && (
              <button
                type="button"
                onClick={() => setShowValidation(true)}
                className="text-sm text-orange-600 hover:text-orange-800"
              >
                Show validation errors
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                </svg>
              )}
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// Helper functions
function convertToFormField(variable: TerraformVariable): FormField {
  const fieldType = TERRAFORM_TYPES[variable.type as keyof typeof TERRAFORM_TYPES] || 'text';
  
  return {
    name: variable.name,
    label: formatFieldLabel(variable.name),
    type: fieldType as any,
    required: variable.required,
    default: variable.default,
    description: variable.description,
    placeholder: getFieldPlaceholder(variable),
    sensitive: variable.sensitive,
    validation: getFieldValidation(variable),
    category: categorizeField({ name: variable.name } as FormField)
  };
}

function formatFieldLabel(name: string): string {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getFieldPlaceholder(variable: TerraformVariable): string {
  if (variable.name.includes('name')) return 'Enter a unique name';
  if (variable.name.includes('location')) return 'Select Azure region';
  if (variable.name.includes('sku')) return 'Select SKU/size';
  return `Enter ${variable.name.replace(/_/g, ' ')}`;
}

function categorizeField(field: FormField): 'basic' | 'networking' | 'security' | 'advanced' {
  const name = field.name.toLowerCase();
  
  if (['name', 'location', 'resource_group', 'sku', 'size'].some(key => name.includes(key))) {
    return 'basic';
  }
  if (['network', 'subnet', 'vnet', 'ip', 'dns', 'port'].some(key => name.includes(key))) {
    return 'networking';
  }
  if (['key', 'secret', 'password', 'certificate', 'auth', 'security'].some(key => name.includes(key))) {
    return 'security';
  }
  return 'advanced';
}

function getCategoryLabel(category: string): string {
  const labels = {
    basic: 'Basic Configuration',
    networking: 'Networking',
    security: 'Security',
    advanced: 'Advanced Options'
  };
  return labels[category as keyof typeof labels] || category;
}

function getCategoryDescription(category: string): string {
  const descriptions = {
    basic: 'Essential settings required for deployment',
    networking: 'Network configuration and connectivity options',
    security: 'Security settings and access controls',
    advanced: 'Optional advanced configuration parameters'
  };
  return descriptions[category as keyof typeof descriptions] || '';
}

function getCategoryIcon(category: string): string {
  const icons = {
    basic: '⚙️',
    networking: '🌐',
    security: '🔒',
    advanced: '🔧'
  };
  return icons[category as keyof typeof icons] || '📋';
}

function getDefaultValues(fields: FormField[], initialData: SchemaFormData): SchemaFormData {
  const defaults: SchemaFormData = {};
  
  fields.forEach(field => {
    if (initialData[field.name] !== undefined) {
      defaults[field.name] = initialData[field.name];
    } else if (field.default !== undefined) {
      defaults[field.name] = field.default;
    } else if (field.type === 'boolean') {
      defaults[field.name] = false;
    } else if (field.type === 'array') {
      defaults[field.name] = [];
    } else if (field.type === 'object' || field.type === 'json') {
      defaults[field.name] = {};
    }
  });
  
  return defaults;
}

function getValidationRules(field: FormField): any {
  const rules: any = {};
  
  if (field.required) {
    rules.required = `${field.label} is required`;
  }
  
  if (field.validation) {
    if (field.validation.pattern) {
      rules.pattern = {
        value: field.validation.pattern,
        message: `${field.label} format is invalid`
      };
    }
    
    if (field.validation.minLength) {
      rules.minLength = {
        value: field.validation.minLength,
        message: `${field.label} must be at least ${field.validation.minLength} characters`
      };
    }
    
    if (field.validation.maxLength) {
      rules.maxLength = {
        value: field.validation.maxLength,
        message: `${field.label} must be no more than ${field.validation.maxLength} characters`
      };
    }
    
    if (field.validation.min !== undefined) {
      rules.min = {
        value: field.validation.min,
        message: `${field.label} must be at least ${field.validation.min}`
      };
    }
    
    if (field.validation.max !== undefined) {
      rules.max = {
        value: field.validation.max,
        message: `${field.label} must be no more than ${field.validation.max}`
      };
    }
  }
  
  return rules;
}

function shouldShowField(field: FormField, values: SchemaFormData): boolean {
  if (!field.conditional) return true;
  
  const dependentValue = values[field.conditional.dependsOn];
  return field.conditional.showWhen(dependentValue);
}

function getFieldValidation(variable: TerraformVariable): FormField['validation'] {
  const validation: FormField['validation'] = {};
  
  if (variable.validation && variable.validation.length > 0) {
    // Convert Terraform validation to form validation
    // This is a simplified implementation
    validation.custom = (value: any) => {
      // Implement custom validation logic based on Terraform validation rules
      return null;
    };
  }
  
  return validation;
}

function processFormData(data: SchemaFormData, fields: FormField[]): SchemaFormData {
  const processed: SchemaFormData = {};
  
  fields.forEach(field => {
    const value = data[field.name];
    
    if (value !== undefined && value !== null && value !== '') {
      if (field.type === 'json' && typeof value === 'string') {
        try {
          processed[field.name] = JSON.parse(value);
        } catch {
          processed[field.name] = value;
        }
      } else {
        processed[field.name] = value;
      }
    }
  });
  
  return processed;
}

export default FormRenderer;