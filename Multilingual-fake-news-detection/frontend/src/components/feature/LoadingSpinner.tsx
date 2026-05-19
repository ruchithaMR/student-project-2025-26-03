interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizes[size]} border-teal-200 border-t-teal-500 rounded-full animate-spin`}
      ></div>
      {message && (
        <p className="text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );
}