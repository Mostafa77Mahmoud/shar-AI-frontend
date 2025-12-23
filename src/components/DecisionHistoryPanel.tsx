import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DecisionHistoryEntry } from '@/contexts/SessionContext';
import { Clock, User, Bot, UserCheck, Edit3, CheckCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DecisionHistoryPanelProps {
  history: DecisionHistoryEntry[];
  className?: string;
}

const DecisionHistoryPanel: React.FC<DecisionHistoryPanelProps> = ({ history, className }) => {
  const { t, dir } = useLanguage();

  if (!history || history.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground p-3 text-center", className)}>
        {t('history.noHistory') || 'لا يوجد سجل قرارات'}
      </div>
    );
  }

  const getActionIcon = (action: DecisionHistoryEntry['action']) => {
    switch (action) {
      case 'user_edit':
        return <Edit3 size={14} className="text-blue-500" />;
      case 'ai_review':
        return <Bot size={14} className="text-purple-500" />;
      case 'expert_feedback':
        return <UserCheck size={14} className="text-amber-500" />;
      case 'confirmation':
        return <CheckCircle size={14} className="text-shariah-green" />;
      default:
        return <MessageSquare size={14} className="text-muted-foreground" />;
    }
  };

  const getActorIcon = (actor: DecisionHistoryEntry['actor']) => {
    switch (actor) {
      case 'user':
        return <User size={12} className="text-blue-400" />;
      case 'ai':
        return <Bot size={12} className="text-purple-400" />;
      case 'expert':
        return <UserCheck size={12} className="text-amber-400" />;
      default:
        return null;
    }
  };

  const getActionLabel = (action: DecisionHistoryEntry['action']) => {
    const labels: Record<string, string> = {
      user_edit: t('history.userEdit') || 'تعديل المستخدم',
      ai_review: t('history.aiReview') || 'مراجعة الذكاء الاصطناعي',
      expert_feedback: t('history.expertFeedback') || 'ملاحظة الخبير',
      confirmation: t('history.confirmation') || 'تأكيد التعديل',
    };
    return labels[action] || action;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(dir === 'rtl' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn("bg-muted/30 rounded-lg border border-border/50", className)}>
      <div className="flex items-center gap-2 p-3 border-b border-border/50">
        <Clock size={16} className="text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">
          {t('history.title') || 'سجل القرارات'}
        </h4>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {history.length}
        </span>
      </div>
      
      <ScrollArea className="max-h-48">
        <div className="p-2 space-y-2">
          <AnimatePresence>
            {history.map((entry, index) => (
              <motion.div
                key={`${entry.timestamp}-${index}`}
                initial={{ opacity: 0, x: dir === 'rtl' ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-2 p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActionIcon(entry.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">
                      {getActionLabel(entry.action)}
                    </span>
                    <div className="flex items-center gap-1">
                      {getActorIcon(entry.actor)}
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {entry.actor === 'user' ? (t('history.user') || 'مستخدم') : 
                         entry.actor === 'ai' ? (t('history.ai') || 'ذكاء اصطناعي') : 
                         (t('history.expert') || 'خبير')}
                      </span>
                    </div>
                  </div>
                  
                  {entry.details && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {entry.details}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={10} className="text-muted-foreground/60" />
                    <span className="text-[10px] text-muted-foreground/80">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DecisionHistoryPanel;

