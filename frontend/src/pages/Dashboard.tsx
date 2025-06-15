import React, { useState } from 'react';
import ResourceCard from '../components/ResourceCard';
import DeploymentForm from '../components/DeploymentForm';
import LoginButton from '../components/LoginButton';
import { useAuth } from '../components/AuthProvider';
import { AZURE_RESOURCES, RESOURCE_CONFIGS } from '../data/resources';
import { DeploymentRequest } from '../types';

const Dashboard: React.FC = () => {
  const { getAccessToken, user } = useAuth();
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleResourceSelect = (resourceId: string) => {
    setSelectedResource(resourceId);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: Partial<DeploymentRequest>) => {
    try {
      const token = await getAccessToken();
      
      const deploymentRequest = {
        ...data,
        requestedBy: user?.email,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      };

      // Send to Logic App webhook
      const response = await fetch('/api/deployments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(deploymentRequest),
      });

      if (response.ok) {
        alert('Deployment request submitted for approval!');
        setShowForm(false);
        setSelectedResource(null);
      } else {
        alert('Failed to submit deployment request');
      }
    } catch (error) {
      console.error('Error submitting deployment:', error);
      alert('Error submitting deployment request');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedResource(null);
  };

  const groupedResources = AZURE_RESOURCES.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, typeof AZURE_RESOURCES>);

  const categoryTitles = {
    compute: 'Compute Resources',
    network: 'Network Resources',
    storage: 'Storage Resources',
    web: 'Web & Application Resources'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Erdtree Self-Service Portal
              </h1>
            </div>
            <LoginButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Deploy Azure Infrastructure
          </h2>
          <p className="text-gray-600">
            Select a resource type to deploy using Azure Verified Modules and Terraform
          </p>
        </div>

        {/* Resource Categories */}
        {Object.entries(groupedResources).map(([category, resources]) => (
          <div key={category} className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {categoryTitles[category as keyof typeof categoryTitles]}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onSelect={handleResourceSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Deployment Form Modal */}
      {showForm && selectedResource && RESOURCE_CONFIGS[selectedResource] && (
        <DeploymentForm
          config={RESOURCE_CONFIGS[selectedResource]}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default Dashboard;