export default function Loader({ className = "h-64" }) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="flex gap-2">
        <div 
          className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" 
          style={{ animationDelay: '0ms' }}
        ></div>
        <div 
          className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" 
          style={{ animationDelay: '150ms' }}
        ></div>
        <div 
          className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" 
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
    </div>
  );
}
