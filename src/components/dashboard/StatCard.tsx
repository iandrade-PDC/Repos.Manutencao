
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: "blue" | "green" | "orange" | "red";
}

export function StatCard({ label, value, icon: Icon, description, color = "blue" }: StatCardProps) {


  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-marinho/10 flex items-center justify-between hover:border-marinho/30 transition-colors group">
      <div>
        <p className="text-xs font-semibold text-marinho/60 uppercase tracking-wide">{label}</p>
        <h3 className="text-2xl font-extrabold text-marinho mt-1">{value}</h3>
        {description && (
          <p className="text-[10px] text-marinho/50 mt-1 font-medium">{description}</p>
        )}
      </div>
      <div className={cn("p-2.5 rounded-md transition-colors group-hover:bg-opacity-20", 
        color === 'blue' ? "bg-marinho/10 text-marinho" :
        color === 'green' ? "bg-mata/10 text-mata" :
        color === 'orange' ? "bg-palha/10 text-palha" :
        "bg-rosa/10 text-rosa"
      )}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
    </div>
  );
}
