
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RankingItem {
  id: string;
  name: string;
  count: number;
  avatar?: string;
}

interface RankingListProps {
  title: string;
  items: RankingItem[];
  type: "creators" | "solvers";
}

export function RankingList({ title, items, type }: RankingListProps) {
  const getIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="text-yellow-500" size={20} />;
      case 1: return <Medal className="text-gray-400" size={20} />;
      case 2: return <Medal className="text-amber-600" size={20} />;
      default: return <span className="text-slate-400 font-bold w-5 text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-marinho/10 overflow-hidden">
      <div className="p-4 border-b border-areia bg-areia/20 flex items-center justify-between">
        <h3 className="font-semibold text-marinho">{title}</h3>
        <Award className={cn("text-marinho/40", type === 'solvers' ? "text-mata" : "text-marinho")} size={20} />
      </div>
      <div className="divide-y divide-marinho/5">
        {items.map((item, index) => (
          <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-areia/10 transition-colors">
            <div className="flex items-center justify-center w-8 h-8">
              {getIcon(index)}
            </div>
            
            <div className="flex-1">
              <p className="font-medium text-marinho">{item.name}</p>
              <p className="text-xs text-marinho/60">
                {type === 'creators' ? 'Ordens criadas' : 'Ordens resolvidas'}
              </p>
            </div>
            
            <div className="text-right">
              <span className={cn(
                "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                type === 'solvers' ? "bg-mata/10 text-mata border-mata/20" : "bg-marinho/10 text-marinho border-marinho/20"
              )}>
                {item.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
