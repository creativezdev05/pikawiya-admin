// components/admin/FormSubmissionsCard.tsx
interface FormSubmissionItem {
  eventName: string;
  label: string;
  count: number;
}

export default function FormSubmissionsCard({
  formSubmissions,
}: {
  formSubmissions: FormSubmissionItem[];
}) {
  const totalCount = formSubmissions.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            Form Submissions
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Past 30 days performance
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          Total: {totalCount.toLocaleString()}
        </span>
      </div>

      {formSubmissions.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No form submissions recorded yet.
        </p>
      ) : (
        <div className="space-y-3">
          {formSubmissions.map((item) => {
            const percentage = totalCount ? Math.round((item.count / totalCount) * 100) : 0;
            return (
              <div key={item.eventName} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.count.toLocaleString()} ({percentage}%)
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}