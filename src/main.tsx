import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ReviewPage from './components/Review/ReviewPage.tsx';
import './index.css';

const params = new URLSearchParams(window.location.search);
const reviewToken = params.get('review');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {reviewToken ? <ReviewPage token={reviewToken} /> : <App />}
  </StrictMode>
);
