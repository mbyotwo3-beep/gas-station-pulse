import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// SEO Meta tags
document.title = "FuelFinder - Find Fuel Stations Near You";
const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) {
  metaDescription.setAttribute('content', 'Find fuel stations near you with real-time fuel availability updates. Track fuel status, get directions, and save your favorite stations.');
} else {
  const meta = document.createElement('meta');
  meta.name = 'description';
  meta.content = 'Find fuel stations near you with real-time fuel availability updates. Track fuel status, get directions, and save your favorite stations.';
  document.head.appendChild(meta);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
