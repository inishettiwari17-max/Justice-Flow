import { formatDistanceToNow, format } from 'date-fns';

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

export const getAvatarUrl = (photo) =>
  photo ? `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${photo}` : null;

export const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
};

export const timeAgo = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const renderStars = (rating, max = 5) => {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    stars.push(i <= Math.round(rating) ? '★' : '☆');
  }
  return stars;
};

export const truncate = (str, n = 100) =>
  str?.length > n ? str.slice(0, n) + '...' : str;

export const SPECIALTIES = [
  'Criminal Law', 'Family Law', 'Civil Law', 'Corporate Law', 'Property Law',
  'Labour Law', 'Tax Law', 'Intellectual Property', 'Consumer Law', 'Environmental Law',
  'Immigration Law', 'Cyber Law', 'Constitutional Law', 'Banking Law', 'Insurance Law',
  'Matrimonial Law', 'Human Rights', 'Medical Law', 'Real Estate Law', 'Arbitration'
];

export const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Urdu', 'Odia'
];

export const CASE_TYPES = [
  'Criminal Case', 'Divorce / Matrimonial', 'Property Dispute', 'Civil Suit',
  'Labour Dispute', 'Consumer Complaint', 'Company Matter', 'Tax Matter',
  'Cyber Crime', 'Immigration', 'Intellectual Property', 'Other'
];
