import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

interface Problem {
  id: string;
  title: string;
  difficulty: string;
}

const ProblemListPage: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');

  useEffect(() => {
    let isMounted = true;
    const fetchProblems = async () => {
      try {
        const { data, error } = await supabase
          .from('problems')
          .select('*')
          .order('difficulty', { ascending: true });
        if (error) throw error;
        if (isMounted) {
          setProblems(data || []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load problems');
          setLoading(false);
        }
      }
    };
    fetchProblems();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProblems = useMemo(() => {
    if (!searchTerm && difficultyFilter === 'All') {
      return problems;
    }
    
    return problems.filter(problem => {
      const matchesSearch = searchTerm === '' || 
        problem.title.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchesDifficulty = difficultyFilter === 'All' || problem.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [problems, searchTerm, difficultyFilter]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleDifficultyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDifficultyFilter(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'badge-success';
      case 'Medium':
        return 'badge-warning';
      case 'Hard':
        return 'badge-error';
      default:
        return 'badge-purple';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-xl text-gray-600">Loading problems...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Problems</h1>
        <p className="text-gray-600">Practice your low-level design skills with these problems</p>
      </div>

      {/* Search and Filter Section */}
      <div className="search-section">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          {/* Search Bar - Fixed positioning */}
          <div className="search-container flex-1">
            <div className="search-icon">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search problems by title..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
              aria-label="Search problems"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                aria-label="Clear search"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Difficulty Filter - Fixed positioning */}
          <div className="filter-container w-full lg:w-48">
            <select
              value={difficultyFilter}
              onChange={handleDifficultyChange}
              className="filter-select"
              aria-label="Filter by difficulty"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Results Count - Fixed positioning */}
        <div className="search-results">
          <p>
            {searchTerm || difficultyFilter !== 'All' ? (
              <>
                Showing {filteredProblems.length} of {problems.length} problems
                {(searchTerm || difficultyFilter !== 'All') && (
                  <span className="ml-2">
                    • <button 
                      onClick={() => { setSearchTerm(''); setDifficultyFilter('All'); }}
                    >
                      Clear filters
                    </button>
                  </span>
                )}
              </>
            ) : (
              `Showing all ${problems.length} problems`
            )}
          </p>
        </div>
      </div>

      {/* Problems List */}
      <div className="space-y-4">
        {filteredProblems.map((problem, index) => (
          <Link
            key={problem.id}
            to={`/problem/${problem.id}`}
            className="card p-6 hover:shadow-lg transition-all duration-200 block group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {problem.title}
                  </h3>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`badge ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredProblems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {searchTerm || difficultyFilter !== 'All' 
              ? 'No problems match your search criteria' 
              : 'No problems available'
            }
          </div>
          <p className="text-gray-400">
            {searchTerm || difficultyFilter !== 'All' 
              ? 'Try adjusting your search or filter settings' 
              : 'Check back later for new problems!'
            }
          </p>
          {(searchTerm || difficultyFilter !== 'All') && (
            <button
              onClick={() => { setSearchTerm(''); setDifficultyFilter('All'); }}
              className="mt-4 btn-primary"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemListPage;