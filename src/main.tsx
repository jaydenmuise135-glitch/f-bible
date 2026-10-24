import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function BibleApp() {
return (
<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
<h1>Holy Bible</h1>
<p>Welcome to your Bible app!</p>
<div style={{ background: '#f4f0e8', padding: '20px', borderRadius: '12px' }}>
<h2>John 3:16</h2>
<p>For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.</p>
</div>
</div>
);
}

createRoot(document.getElementById('root')!).render(
<React.StrictMode>
<BibleApp />
</React.StrictMode>
);
