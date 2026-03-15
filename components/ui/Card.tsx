interface CardProps {
  title: string;
  value: string | number;
}

export default function Card({ title, value }: CardProps) {
  return (
    <div className="card bg-white dark:bg-gray-800 shadow-md p-4 rounded-lg transition-colors duration-300">
      <p className="text-gray-500 dark:text-gray-300">{title}</p>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</h2>
    </div>
  );
}