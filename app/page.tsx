'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, displayName } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Welcome to Poll App
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Create and participate in polls with ease
          </p>
          
          {user ? (
            <div className="space-y-4 sm:space-y-6">
              <p className="text-base sm:text-lg text-gray-700 px-4">
                Welcome back, {displayName || user.email}!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md sm:max-w-none mx-auto">
                <Link href="/polls/create" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create Poll
                  </Button>
                </Link>
                <Link href="/polls" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse Polls
                  </Button>
                </Link>
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <p className="text-base sm:text-lg text-gray-700 mb-6 sm:mb-8 px-4">
                Sign in to start creating and participating in polls
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-sm sm:max-w-none mx-auto">
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center p-6 sm:p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Create Polls</h3>
            <p className="text-gray-600 text-sm sm:text-base">Design custom polls with multiple choice options</p>
          </div>
          
          <div className="text-center p-6 sm:p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Vote & Participate</h3>
            <p className="text-gray-600 text-sm sm:text-base">Cast your vote and see real-time results</p>
          </div>
          
          <div className="text-center p-6 sm:p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">View Analytics</h3>
            <p className="text-gray-600 text-sm sm:text-base">Track poll performance and engagement</p>
          </div>
        </div>
      </div>
    </div>
  );
}