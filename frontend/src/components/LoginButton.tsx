import React from 'react';
import { useAuth } from './AuthProvider';

const LoginButton: React.FC = () => {
  const { isAuthenticated, user, login, logout } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-700">
          <p className="font-medium">{user.name}</p>
          <p className="text-gray-500">{user.email}</p>
        </div>
        <div className="h-8 w-8 bg-azure-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="bg-azure-600 text-white px-4 py-2 rounded-md hover:bg-azure-700 focus:outline-none focus:ring-2 focus:ring-azure-500"
    >
      Sign in with Microsoft
    </button>
  );
};

export default LoginButton;