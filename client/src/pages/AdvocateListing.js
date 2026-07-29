import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiX, FiSliders } from 'react-icons/fi';import toast from 'react-hot-toast';
import api from '../utils/api';
import AdvocateCard from '../components/advocates/AdvocateCard';
import { useAuth } from '../context/AuthContext';
import { SPECIALTIES, LANGUAGES } from '../utils/helpers';
import './AdvocateListing.css';

const SORTS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'experience', label: 'Most Experienced' },
  { value: 'fee_asc', label: 'Lowest Fee' },
  { value: 'fee_desc', label: 'Highest Fee' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'newest', label: 'Newest' }
];

const AdvocateListing = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [advocates, setAdvocates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [savedIds, setSavedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    specialty: searchParams.get('specialty') || '',
    language: '',
    city: '',
    minExp: '',
    maxExp: '',
    minRating: '',
    minFee: '',
    maxFee: '',
    available: false,
    sort: 'rating',
    page: 1
  });

  const fetchAdvocates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v !== '' && v !== false) params.set(k, v); });
      if (filters.available) params.set('available', 'true');

      const { data } = await api.get(`/advocates?${params.toString()}`);
      setAdvocates(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load advocates');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchAdvocates(); }, [fetchAdvocates]);

  // Load user's saved advocates
  useEffect(() => {
    if (user?.role === 'user') {
      api.get('/users/saved-advocates')
        .then(({ data }) => setSavedIds(data.data.map((a) => a._id)))
        .catch(() => {});
    }
  }, [user]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '', specialty: '', language: '', city: '',
      minExp: '', maxExp: '', minRating: '', minFee: '', maxFee: '',
      available: false, sort: 'rating', page: 1
    });
  };

  const handleSave = async (advocateId) => {
    if (!user) return toast.error('Please login to save advocates');
    if (user.role !== 'user') return;
    try {
      const { data } = await api.post(`/users/save-advocate/${advocateId}`);
      setSavedIds(data.savedAdvocates);
      toast.success(savedIds.includes(advocateId) ? 'Removed from saved' : 'Advocate saved!');
    } catch {
      toast.error('Failed to save advocate');
    }
  };

  const hasFilters = filters.specialty || filters.language || filters.city ||
    filters.minExp || filters.maxExp || filters.minRating || filters.available;

  return (
    <div className="listing-page">
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <h1>Find an Advocate</h1>
          <p>Browse {pagination.total} verified legal professionals across India</p>
        </div>
      </div>

      <div className="container">
        {/* Search bar */}
        <div className="listing-searchbar">
          <div className="input-icon-wrap" style={{ flex: 1 }}>
            <FiSearch className="input-icon" />
            <input
              type="text"
              className="form-control with-icon"
              placeholder="Search by name, specialty, location..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <select
            className="form-control sort-select"
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button className={`btn btn-outline filter-toggle ${filterOpen ? 'active' : ''}`} onClick={() => setFilterOpen(!filterOpen)}>
            <FiSliders size={16} /> Filters {hasFilters && <span className="filter-badge">!</span>}
          </button>
        </div>

        {/* Filters panel */}
        {filterOpen && (
          <div className="filters-panel card">
            <div className="filters-grid">
              <div className="form-group">
                <label>Specialty</label>
                <select className="form-control" value={filters.specialty} onChange={(e) => handleFilterChange('specialty', e.target.value)}>
                  <option value="">All Specialties</option>
                  {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Language</label>
                <select className="form-control" value={filters.language} onChange={(e) => handleFilterChange('language', e.target.value)}>
                  <option value="">Any Language</option>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" className="form-control" placeholder="e.g. Mumbai"
                  value={filters.city} onChange={(e) => handleFilterChange('city', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Min Rating</label>
                <select className="form-control" value={filters.minRating} onChange={(e) => handleFilterChange('minRating', e.target.value)}>
                  <option value="">Any Rating</option>
                  {[4, 3, 2].map((r) => <option key={r} value={r}>{r}★ & above</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Min Experience (yrs)</label>
                <input type="number" className="form-control" placeholder="0"
                  min="0" value={filters.minExp} onChange={(e) => handleFilterChange('minExp', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Max Fee (₹)</label>
                <input type="number" className="form-control" placeholder="No limit"
                  value={filters.maxFee} onChange={(e) => handleFilterChange('maxFee', e.target.value)} />
              </div>
            </div>
            <div className="filter-actions">
              <label className="checkbox-label">
                <input type="checkbox" checked={filters.available} onChange={(e) => handleFilterChange('available', e.target.checked)} />
                Available Now Only
              </label>
              {hasFilters && (
                <button className="btn btn-outline btn-sm" onClick={clearFilters}>
                  <FiX size={14} /> Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}

        <div className="listing-content">
          {/* Active filter chips */}
          {hasFilters && (
            <div className="filter-chips">
              {filters.specialty && <span className="chip">{filters.specialty} <button onClick={() => handleFilterChange('specialty', '')}>×</button></span>}
              {filters.language && <span className="chip">{filters.language} <button onClick={() => handleFilterChange('language', '')}>×</button></span>}
              {filters.city && <span className="chip">📍 {filters.city} <button onClick={() => handleFilterChange('city', '')}>×</button></span>}
              {filters.minRating && <span className="chip">{filters.minRating}★+ <button onClick={() => handleFilterChange('minRating', '')}>×</button></span>}
              {filters.available && <span className="chip">Available <button onClick={() => handleFilterChange('available', false)}>×</button></span>}
            </div>
          )}

          <div className="listing-count">
            {loading ? 'Loading...' : `${pagination.total} advocates found`}
          </div>

          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : advocates.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>No advocates found</h3>
              <p>Try adjusting your search or filters</p>
              <button className="btn btn-primary mt-2" onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-3">
              {advocates.map((adv) => (
                <AdvocateCard
                  key={adv._id} advocate={adv}
                  isSaved={savedIds.includes(adv._id)}
                  onSave={user?.role === 'user' ? handleSave : null}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => handleFilterChange('page', filters.page - 1)} disabled={filters.page <= 1}>‹</button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - filters.page) <= 2)
                .map((p) => (
                  <button key={p} className={`page-btn ${p === filters.page ? 'active' : ''}`} onClick={() => handleFilterChange('page', p)}>
                    {p}
                  </button>
                ))}
              <button className="page-btn" onClick={() => handleFilterChange('page', filters.page + 1)} disabled={filters.page >= pagination.pages}>›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvocateListing;
