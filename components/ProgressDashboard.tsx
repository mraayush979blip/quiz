
import React, { useMemo, useState } from 'react';
import { Session } from '../types';
import { Trophy, Activity, BookOpen, Flame, Target, X } from 'lucide-react';

interface ProgressDashboardProps {
  sessions: Session[];
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ sessions }) => {
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [filterTopic, setFilterTopic] = useState<string | null>(null);

  const stats = useMemo(() => {
    const quizSessions = sessions.filter(s => s.type === 'quiz' && s.score !== undefined);
    const totalQuizzes = quizSessions.length;
    
    let totalScore = 0;
    let totalPossible = 0;
    let totalDuration = 0;
    
    quizSessions.forEach(s => {
      totalScore += s.score || 0;
      totalPossible += s.totalQuestions || 0;
      totalDuration += s.duration || 0;
    });

    const avgScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    
    // Get unique topics
    const uniqueTopics = Array.from(new Set(sessions.map(s => s.topic)));
    
    const totalCards = sessions.filter(s => s.type === 'flashcards').length;

    // Format total duration
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    const durationString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return {
      totalSessions: sessions.length,
      avgScore,
      topicsStudied: uniqueTopics.length,
      topicList: uniqueTopics,
      totalCards,
      quizCount: totalQuizzes,
      totalTime: durationString
    };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (!filterTopic) return sessions.slice(0, 10); // Default to top 10 recent
    return sessions.filter(s => s.topic === filterTopic);
  }, [sessions, filterTopic]);

  const handleTopicClick = (topic: string) => {
    setFilterTopic(topic);
    setShowTopicsModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-up pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-zinc-900 dark:text-white mb-2">Your Progress</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Track your learning journey and stats.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-violet-500/10 rounded-lg text-violet-600 dark:text-violet-400">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Avg Score</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.avgScore}%</div>
          <p className="text-xs text-zinc-500 mt-2">Across {stats.quizCount} quizzes</p>
        </div>

        {/* Clickable Topics Card */}
        <div 
          onClick={() => setShowTopicsModal(true)}
          className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-md shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-fuchsia-500/10 rounded-lg text-fuchsia-600 dark:text-fuchsia-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Topics</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.topicsStudied}</div>
          <p className="text-xs text-zinc-500 mt-2 group-hover:text-fuchsia-500 transition-colors">Click to view all</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Sessions</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.totalSessions}</div>
          <p className="text-xs text-zinc-500 mt-2">Total activities</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
              <Target className="w-6 h-6" />
            </div>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Time</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.totalTime}</div>
          <p className="text-xs text-zinc-500 mt-2">Spent quizzing</p>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm min-h-[300px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> 
            {filterTopic ? `Activity: ${filterTopic}` : 'Recent Activity'}
          </h3>
          {filterTopic && (
            <button 
              onClick={() => setFilterTopic(null)}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              Clear Filter <X className="w-3 h-3" />
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {filteredSessions.map((session, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-black/20 rounded-xl border border-zinc-100 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  session.type === 'quiz' ? 'bg-violet-500' : 
                  session.type === 'flashcards' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                <div>
                   <p className="text-zinc-900 dark:text-zinc-200 font-medium text-sm">{session.topic}</p>
                   <p className="text-zinc-500 text-xs capitalize">{session.type.replace('_', ' ')}</p>
                </div>
              </div>
              {session.score !== undefined && (
                 <div className="text-right">
                    <span className="text-violet-600 dark:text-violet-400 font-bold text-sm">{session.score} / {session.totalQuestions}</span>
                 </div>
              )}
            </div>
          ))}
          {filteredSessions.length === 0 && (
            <div className="text-center text-zinc-500 py-10">No activity found for this selection.</div>
          )}
        </div>
      </div>

      {/* Topics Modal */}
      {showTopicsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowTopicsModal(false)}>
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Topics Studied</h3>
               <button onClick={() => setShowTopicsModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors">
                 <X className="w-5 h-5 text-zinc-500" />
               </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
              {stats.topicList.length > 0 ? (
                stats.topicList.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTopicClick(topic)}
                    className="w-full text-left p-4 rounded-xl bg-zinc-50 dark:bg-black/20 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all flex justify-between items-center group"
                  >
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">{topic}</span>
                    <span className="text-xs text-zinc-400 group-hover:text-fuchsia-500 transition-colors">View History →</span>
                  </button>
                ))
              ) : (
                <p className="text-center text-zinc-500 py-8">No topics found yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressDashboard;
