import { motion } from 'framer-motion';

export type ListeningHabit = {
  label: string;
  value: number;
};

interface ListeningHabitsChartProps {
  habits: ListeningHabit[];
}

const ListeningHabitsChart = ({ habits }: ListeningHabitsChartProps) => (
  <div className='space-y-4'>
    {habits.map((slot) => (
      <div key={slot.label} className='flex items-center gap-3'>
        <span className='w-32 text-lg text-slate-400 text-right'>
          {slot.label}
        </span>
        <motion.div
          className='h-7 rounded-md bg-gradient-to-r from-purple-500 to-emerald-400 shadow-md flex items-center'
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(slot.value * 100, 8)}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          style={{ minWidth: '2rem', maxWidth: '100%' }}
        >
          <span className='ml-2 text-slate-50 font-semibold'>
            {Math.round(slot.value * 100)}%
          </span>
        </motion.div>
      </div>
    ))}
  </div>
);

export default ListeningHabitsChart;
