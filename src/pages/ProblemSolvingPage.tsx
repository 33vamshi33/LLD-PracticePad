import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import DiagramEditor from '../components/DiagramEditor';
import { useAuth } from '../contexts/AuthContext';

interface Problem {
  id: string;
  title: string;
  description: string;
}

interface ProblemLevel {
  id: string;
  level_number: number;
  level_description: string;
  evaluation_criteria: any;
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary flex-1"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  onClose,
  error
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-600">Evaluation Error</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm leading-relaxed">{error}</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Continue Designing
          </button>
        </div>
      </div>
    </div>
  );
};

const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const ProblemSolvingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [levels, setLevels] = useState<ProblemLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<ProblemLevel | null>(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [submissionResult, setSubmissionResult] = useState<{ score: number; feedback: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [targetLevelIndex, setTargetLevelIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [timeFilter, setTimeFilter] = useState<string>('All');

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const { data: problemData, error: problemError } = await supabase
            .from('problems')
            .select('*')
            .eq('id', id)
            .single();

          if (problemError) {
            throw problemError;
          }
          setProblem(problemData);

          const { data: levelsData, error: levelsError } = await supabase
            .from('problem_levels')
            .select('*')
            .eq('problem_id', id)
            .order('level_number');

          if (levelsError) {
            throw levelsError;
          }
          setLevels(levelsData as ProblemLevel[]);
          if (levelsData && levelsData.length > 0) {
            setCurrentLevel((levelsData as ProblemLevel[])[0]);
            setCurrentLevelIndex(0);
          }
        } catch (err: any) {
          console.error('Error fetching data:', err);
          setError(err.message || 'Failed to load problem data.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [id]);

  useEffect(() => {
    const fetchSubmissionCount = async () => {
      if (!user || !levels.length) return;

      try {
        const levelIds = levels.map(level => level.id);
        const { count, error } = await supabase
          .from('submissions')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .in('level_id', levelIds);

        if (error) {
          console.error('Error fetching submission count:', error);
        } else {
          setSubmissionCount(count || 0);
        }
      } catch (err) {
        console.error('Unexpected error fetching submission count:', err);
      }
    };

    fetchSubmissionCount();
  }, [user, levels]);

  const handleLevelClick = (levelIndex: number) => {
    if (levelIndex === currentLevelIndex) return;

    // Check if previous levels are completed with 70%+ score
    const canProceed = levelIndex === 0 || 
      (submissionResult && submissionResult.score >= 70);

    if (!canProceed) {
      setTargetLevelIndex(levelIndex);
      setShowConfirmation(true);
    } else {
      setCurrentLevelIndex(levelIndex);
      setCurrentLevel(levels[levelIndex]);
      setSubmissionResult(null);
    }
  };

  const handleConfirmLevelChange = () => {
    setCurrentLevelIndex(targetLevelIndex);
    setCurrentLevel(levels[targetLevelIndex]);
    setSubmissionResult(null);
    setShowConfirmation(false);
  };

  const fetchSubmissions = async () => {
    if (!user || !id) return;

    setLoadingSubmissions(true);
    try {
      // First, get all level IDs for the current problem
      const { data: problemLevelsData, error: problemLevelsError } = await supabase
        .from('problem_levels')
        .select('id')
        .eq('problem_id', id);

      if (problemLevelsError) throw problemLevelsError;

      const levelIds = problemLevelsData.map(level => level.id);

      if (levelIds.length === 0) {
        setSubmissions([]);
        setLoadingSubmissions(false);
        return;
      }

      // Then, fetch submissions filtered by these level IDs
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          problem_levels (
            id,
            level_number,
            level_description,
            problems (
              title
            )
          )
        `)
        .eq('user_id', user.id)
        .in('level_id', levelIds) // Filter by level_id using the fetched IDs
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleTabChange = (tab: 'problem' | 'submissions') => {
    setActiveTab(tab);
    if (tab === 'submissions') {
      fetchSubmissions();
    }
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      // Search in feedback
      const matchesSearch = searchTerm === '' || 
        (typeof submission.feedback === 'string' && 
         submission.feedback.toLowerCase().includes(searchTerm.toLowerCase()));

      // Level filter
      const matchesLevel = levelFilter === 'All' || 
        (submission.problem_levels && 
         submission.problem_levels.level_number.toString() === levelFilter);

      // Time filter
      const submissionDate = new Date(submission.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let matchesTime = true;
      if (timeFilter === 'Today') {
        matchesTime = daysDiff === 0;
      } else if (timeFilter === 'This Week') {
        matchesTime = daysDiff <= 7;
      } else if (timeFilter === 'This Month') {
        matchesTime = daysDiff <= 30;
      }

      return matchesSearch && matchesLevel && matchesTime;
    });
  }, [submissions, searchTerm, levelFilter, timeFilter]);

  const handleSubmit = async (diagram_json: any) => {
    if (!currentLevel || !user || !problem) return;

    setIsSubmitting(true);
    try {
      // Build comprehensive evaluation context
      const evaluationContext = {
        problem: {
          title: problem.title,
          description: problem.description
        },
        currentLevel: {
          number: currentLevel.level_number,
          description: currentLevel.level_description,
          criteria: currentLevel.evaluation_criteria
        },
        allLevels: levels.map(level => ({
          number: level.level_number,
          description: level.level_description,
          criteria: level.evaluation_criteria
        })),
        userLevel: currentLevelIndex + 1
      };

      // Call the deployed edge function directly
      const response = await fetch('https://gcxurhapvkrbboeepehx.supabase.co/functions/v1/judge-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          evaluation_context: evaluationContext,
          user_diagram_json: diagram_json,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error judging design:', response.status, errorText);
        
        let errorMsg = 'Failed to evaluate your design. Please try again.';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.feedback) {
            errorMsg = errorData.feedback;
          }
        } catch (e) {
          // If we can't parse the error, use the raw text
          errorMsg = `Evaluation failed: ${errorText}`;
        }
        
        setErrorMessage(errorMsg);
        setShowErrorDialog(true);
        return;
      }

      const data = await response.json();
      const score = data.score;
      const feedback = data.feedback;
      
      // Ensure feedback is a string and score is a number
      const cleanFeedback = typeof feedback === 'string' ? feedback : JSON.stringify(feedback);
      const cleanScore = typeof score === 'number' ? score : parseInt(score) || 0;
      
      setSubmissionResult({ score: cleanScore, feedback: cleanFeedback });

      const { error: submissionError } = await supabase.from('submissions').insert([
        {
          user_id: user.id,
          level_id: currentLevel.id,
          diagram_json,
          score: cleanScore,
          feedback: cleanFeedback,
        },
      ]);

      if (submissionError) {
        throw submissionError;
      }

      setSubmissionCount(prevCount => prevCount + 1); // Increment submission count
    } catch (err) {
      console.error('Error submitting:', err);
      setErrorMessage('Failed to submit your design. Please try again.');
      setShowErrorDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-xl text-gray-600">Loading problem...</div>
      </div>
    );
  }



  if (!problem || !currentLevel) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-xl text-gray-600">Problem or current level not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Modern Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{problem.title}</h1>
            <div className="flex items-center space-x-3">
              <span className="badge badge-purple">
                Level {currentLevel.level_number}
              </span>
              {levels.length > 1 && (
                <span className="text-sm text-gray-500">
                  {currentLevelIndex + 1} of {levels.length} levels
                </span>
              )}
            </div>
          </div>
          {submissionResult && (
            <div className={`badge ${
              submissionResult.score >= 80 ? 'badge-success' :
              submissionResult.score >= 60 ? 'badge-warning' : 'badge-error'
            }`}>
              Score: {submissionResult.score}/100
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="card p-0">
          <div className="flex">
            <button
              onClick={() => handleTabChange('problem')}
              className={`flex-1 py-4 px-6 text-base font-medium transition-all duration-200 ${
                activeTab === 'problem'
                  ? 'bg-purple-600 text-white border-b-2 border-purple-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-b-2 border-transparent'
              }`}
            >
              Problem
            </button>
            <button
              onClick={() => handleTabChange('submissions')}
              className={`flex-1 py-4 px-6 text-base font-medium transition-all duration-200 ${
                activeTab === 'submissions'
                  ? 'bg-purple-600 text-white border-b-2 border-purple-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-b-2 border-transparent'
              }`}
            >
              Submissions ({submissionCount})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'problem' ? (
        <>
          {/* Modern Level Progression Bar */}
          {levels.length > 1 && (
            <div className="mb-6">
              <div className="card p-6">
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-3">
                    {levels.map((level, index) => (
                      <div key={level.id} className="flex items-center">
                        <button
                          onClick={() => handleLevelClick(index)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                            index === currentLevelIndex
                              ? 'bg-purple-600 text-white shadow-lg'
                              : index < currentLevelIndex
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {index < currentLevelIndex ? '✓' : index + 1}
                        </button>
                        {index < levels.length - 1 && (
                          <div className={`w-16 h-1 mx-3 rounded-full ${
                            index < currentLevelIndex ? 'bg-green-500' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modern Problem Description */}
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Problem Description</h2>
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">{problem.description}</p>
              </div>
              
              <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Level {currentLevel.level_number} Requirements:
                </h3>
                <p className="text-gray-700 leading-relaxed">{currentLevel.level_description}</p>
              </div>
            </div>
          </div>

          {/* Modern Diagram Editor */}
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Design Your Solution</h2>
              {isSubmitting && (
                <div className="flex items-center space-x-2 text-purple-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span className="text-sm">Evaluating...</span>
                </div>
              )}
            </div>
            <div className="h-[600px] border border-gray-200 rounded-lg overflow-hidden">
              <DiagramEditor onSubmit={handleSubmit} />
            </div>
          </div>

          {/* Modern Submission Result */}
          {submissionResult && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Evaluation Result</h3>
                <div className={`badge ${
                  submissionResult.score >= 80 ? 'badge-success' :
                  submissionResult.score >= 60 ? 'badge-warning' : 'badge-error'
                }`}>
                  {submissionResult.score}/100
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Feedback:</h4>
                <p className="text-gray-700 leading-relaxed">{submissionResult.feedback}</p>
              </div>
              
              {submissionResult.score >= 70 && currentLevelIndex < levels.length - 1 && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleLevelClick(currentLevelIndex + 1)}
                    className="btn-success"
                  >
                    Continue to Next Level
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Submissions Tab */
        <div className="space-y-6">
          {/* Search and Filter Section */}
          {submissions.length > 0 && (
            <div className="search-section">
              <div className="flex gap-6 items-center">
                {/* Search Bar - Proper flex behavior */}
                <div className="search-container flex-1 min-w-0">
                  <div className="search-icon">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search in feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                {/* Level Filter - Proper spacing */}
                <div className="w-32 flex-shrink-0">
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="All">All Levels</option>
                    {Array.from(new Set(submissions.map(s => s.problem_levels?.level_number).filter(Boolean))).sort().map(level => (
                      <option key={level} value={level}>Level {level}</option>
                    ))}
                  </select>
                </div>

                {/* Time Filter - Proper spacing */}
                <div className="w-36 flex-shrink-0">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="All">All Time</option>
                    <option value="Today">Today</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <div className="search-results">
                <p className="text-sm text-gray-600">
                  Showing {filteredSubmissions.length} of {submissions.length} submissions
                </p>
              </div>
            </div>
          )}

          {loadingSubmissions ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-600">Loading submissions...</div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
              <p className="text-gray-500">Submit your first design to see it here.</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Match</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission, index) => (
                <div key={submission.id} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">#{submissions.length - index}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(submission.created_at).toLocaleDateString()} at {new Date(submission.created_at).toLocaleTimeString()}
                      </span>
                      {submission.problem_levels && (
                        <span className="badge badge-purple">
                          Level {submission.problem_levels.level_number}
                        </span>
                      )}
                    </div>
                    <div className={`badge ${
                      submission.score >= 80 ? 'badge-success' :
                      submission.score >= 60 ? 'badge-warning' : 'badge-error'
                    }`}>
                      {submission.score}/100
                    </div>
                  </div>
                  
                  {submission.problem_levels && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-1">
                        {submission.problem_levels.problems?.title} - Level {submission.problem_levels.level_number}
                      </h4>
                      <p className="text-sm text-purple-700">
                        {submission.problem_levels.level_description}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Feedback:</h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {typeof submission.feedback === 'string' 
                        ? submission.feedback 
                        : JSON.stringify(submission.feedback, null, 2)
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmLevelChange}
        title="Proceed to Level?"
        message="You haven't completed the previous level with a 70%+ score. Are you sure you want to proceed to this level?"
      />

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        error={errorMessage}
      />
    </div>
  );
};

export default ProblemSolvingPage;