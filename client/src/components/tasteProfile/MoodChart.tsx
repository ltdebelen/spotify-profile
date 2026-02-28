export type MoodPoint = {
  axis: string;
  value: number;
};

interface MoodChartProps {
  mood: MoodPoint[];
}

const MoodChart = ({ mood }: MoodChartProps) => (
  <div
    className='relative h-40 flex items-center justify-center'
    style={{ marginTop: '10rem', marginBottom: '10rem' }}
  >
    <div className='absolute inset-6 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-emerald-400/20 blur-xl' />
    <div className='relative grid grid-cols-5 gap-1 w-full text-lg text-slate-400'>
      {mood.map((m) => (
        <div key={m.axis} className='flex flex-col items-center gap-1'>
          <div className='h-80 w-2 rounded-full bg-slate-800 overflow-hidden'>
            <div
              className='w-full bg-gradient-to-t from-emerald-400 to-purple-400'
              style={{ height: `${m.value * 100}%` }}
            />
          </div>
          <span className='text-lg text-center'>{m.axis}</span>
        </div>
      ))}
    </div>
  </div>
);

export default MoodChart;
