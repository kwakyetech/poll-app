'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Poll App
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create and participate in polls with ease
          </p>
          
          {user ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Welcome back, {user.email}!
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/polls/create">
                  <Button size="lg">
                    Create Poll
                  </Button>
                </Link>
                <Link href="/polls">
                  <Button variant="outline" size="lg">
                    Browse Polls
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="secondary" size="lg">
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-gray-700 mb-8">
                Sign in to start creating and participating in polls
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth/login">
                  <Button size="lg">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="outline" size="lg">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Create Polls</h3>
            <p className="text-gray-600">Design custom polls with multiple choice options</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Vote & Participate</h3>
            <p className="text-gray-600">Cast your vote and see real-time results</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">View Analytics</h3>
            <p className="text-gray-600">Track poll performance and engagement</p>
          </div>
        </div>
      </div>
    </div>
  );
}