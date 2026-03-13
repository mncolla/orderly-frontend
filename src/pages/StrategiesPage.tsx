import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export function StrategiesPage() {
  return (
    <main className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Strategies / Opportunities</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI-powered insights and growth opportunities
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Lightbulb className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Opportunities</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">8</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">In Progress</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">3</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">12</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Attention Needed</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">2</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">AI-Generated Opportunities</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* High Priority */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border-l-4 border-red-500">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Increase Lunch Hours Staff
                    </h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      High Priority
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Lunch hour orders have increased 34% in the last month. Consider adding 1-2 more staff members during 12pm-2pm to reduce wait times and improve customer satisfaction.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Potential Impact:</span> +15% revenue
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                      Take Action
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Medium Priority */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Lightbulb className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Launch Weekend Brunch Menu
                    </h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Medium Priority
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Weekend foot traffic shows 45% more potential customers. Launch a limited brunch menu to capture this market segment.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Potential Impact:</span> +22% weekend revenue
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Priority */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Optimize Pricing Strategy
                    </h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Low Priority
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Analysis shows 3 menu items could support a 10% price increase without affecting demand. Consider strategic pricing adjustments.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Potential Impact:</span> +8% margin
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                      Review Items
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Story */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border-l-4 border-green-500">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Happy Hour Expansion - Success!
                    </h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Completed
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Extended happy hour by 1 hour based on previous recommendation. Result: 28% increase in afternoon orders and improved staff utilization.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Actual Impact:</span> +28% revenue
                    </div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      ✓ Completed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
