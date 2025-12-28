import React, { useState, useEffect, useRef } from 'react';
import { Film, Zap, Trophy, Settings, Volume2, VolumeX, Share2 } from 'lucide-react';

// IMPORTANT: Make sure you add REACT_APP_TMDB_API_KEY to Vercel Settings!
const API_KEY = process.env.REACT_APP_TMDB_API_KEY || '3d53739c9199ab08bf7f3c044ed9f3cc'; 
const API_BASE = 'https://api.themoviedb.org/3';

const THEMES = {
  neon: { bg: '#0a0118', card: '#1a0f2e', accent: '#ff006e', secondary: '#00f5ff', text: '#ffffff' },
  retro: { bg: '#2d1b00', card: '#4a2c00', accent: '#ff6b35', secondary: '#f7931e', text: '#fff8e7' },
  cyber: { bg: '#000814', card: '#001d3d', accent: '#00ff41', secondary: '#00b4d8', text: '#caf0f8' },
  minimal: { bg: '#f8f9fa', card: '#ffffff', accent: '#495057', secondary: '#6c757d', text: '#212529' }
};

const PERSONALITIES = {
  casual: { name: '😎 Chill', responses: { correct: 'Nice one!', wrong: 'Oof, not quite!' } },
  buff: { name: '🎬 Film Buff', responses: { correct: 'Exquisite taste!', wrong: 'A rare miss!' } },
  comedian: { name: '😂 Joker', responses: { correct: 'You crushed it!', wrong: 'Swing and a miss!' } }
};

export default function CineSnap() {
  const [movie, setMovie] = useState(null);
  const [hints, setHints] = useState(1);
  const [guess, setGuess] = useState('');
  const [state, setState] = useState('playing'); 
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('movie');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [theme, setTheme] = useState('neon');
  const [personality, setPersonality] = useState('casual');
  const [soundOn, setSoundOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [challenge, setChallenge] = useState(null);

  const colors = THEMES[theme];
  const persona = PERSONALITIES[personality];

  useEffect(() => {
    const savedXp = parseInt(localStorage.getItem('xp') || '0');
    const savedLevel = parseInt(localStorage.getItem('level') || '1');
    const savedStreak = parseInt(localStorage.getItem('streak') || '0');
    setXp(savedXp);
    setLevel(savedLevel);
    setStreak(savedStreak);
    fetchMovie();
  }, []);

  useEffect(() => {
    resetGameState();
    fetchMovie();
  }, [mode]);

  const resetGameState = () => {
    setHints(1);
    setGuess('');
    setState('playing');
    setSuggestions([]);
    setChallenge(null);
  };

  const fetchMovie = async () => {
    try {
      setLoading(true);
      const pg = Math.floor(Math.random() * 50) + 1;
      let res, data, item, det, d;

      if (mode === 'actor') {
        res = await fetch(`${API_BASE}/person/popular?api_key=${API_KEY}&page=${pg}`);
        data = await res.json();
        item = data.results[Math.floor(Math.random() * data.results.length)];
        det = await fetch(`${API_BASE}/person/${item.id}?api_key=${API_KEY}&append_to_response=movie_credits`);
        d = await det.json();
        const topMov = d.movie_credits.cast.sort((a, b) => b.popularity - a.popularity).slice(0, 3).map(m => m.title).join(', ');
        setMovie({
          title: d.name,
          hints: [d.place_of_birth || 'Unknown', d.movie_credits.cast.length + ' credits', 'Known for: ' + topMov, 'Popularity: ' + d.popularity.toFixed(0), d.gender === 1 ? 'Actress' : 'Actor', `Bio: ${d.biography?.slice(0, 100)}...`],
          poster: d.profile_path ? `https://image.tmdb.org/t/p/w500${d.profile_path}` : null
        });
      } else if (mode === 'tv') {
        res = await fetch(`${API_BASE}/tv/popular?api_key=${API_KEY}&page=${pg}`);
        data = await res.json();
        item = data.results[Math.floor(Math.random() * data.results.length)];
        det = await fetch(`${API_BASE}/tv/${item.id}?api_key=${API_KEY}&append_to_response=credits`);
        d = await det.json();
        setMovie({
          title: d.name,
          hints: [d.genres.map(g => g.name).join('/'), `Premiered: ${new Date(d.first_air_date).getFullYear()}`, d.vote_average.toFixed(1) + '/10 Rating', `Created by: ${d.created_by?.[0]?.name || 'Unknown'}`, `Stars: ${d.credits.cast.slice(0, 2).map(a => a.name).join(', ')}`, `Plot: ${d.overview}`],
          poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null
        });
      } else {
        res = await fetch(`${API_BASE}/movie/popular?api_key=${API_KEY}&page=${pg}`);
        data = await res.json();
        item = data.results[Math.floor(Math.random() * data.results.length)];
        det = await fetch(`${API_BASE}/movie/${item.id}?api_key=${API_KEY}&append_to_response=credits`);
        d = await det.json();
        const dir = d.credits.crew.find(p => p.job === 'Director');
        setMovie({
          title: d.title,
          hints: [d.genres.map(g => g.name).join('/'), `Released: ${new Date(d.release_date).getFullYear()}`, d.vote_average.toFixed(1) + '/10 Rating', `Director: ${dir?.name || 'Unknown'}`, `Cast: ${d.credits.cast.slice(0, 2).map(a => a.name).join(', ')}`, `Plot: ${d.overview}`],
          poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null
        });
      }
      if (Math.random() < 0.2) setChallenge(['Speed Run!', 'Hard Mode!', 'Expert: No genre!'][Math.floor(Math.random() * 3)]);
      setLoading(false);
    } catch (e) { setLoading(false); }
  };

  const searchItems = async (q) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const ep = mode === 'tv' ? 'tv' : mode === 'actor' ? 'person' : 'movie';
      const r = await fetch(`${API_BASE}/search/${ep}?api_key=${API_KEY}&query=${encodeURIComponent(q)}`);
      const dt = await r.json();
      setSuggestions(dt.results.slice(0, 8).map(i => mode === 'movie' ? i.title : i.name));
    } catch (e) {}
  };

  const makeGuess = () => {
    if (!guess.trim() || !movie) return;
    const isCorrect = guess.toLowerCase().trim() === movie.title.toLowerCase();

    if (isCorrect) {
      setState('won');
      const earnedXp = Math.max(10, 100 - (hints * 15));
      const newXp = xp + earnedXp;
      const newLevel = Math.floor(newXp / 500) + 1;
      const newStreak = streak + 1;

      setXp(newXp); setLevel(newLevel); setStreak(newStreak);
      localStorage.setItem('xp', newXp);
      localStorage.setItem('level', newLevel);
      localStorage.setItem('streak', newStreak);
    } else {
      setStreak(0);
      localStorage.setItem('streak', '0');
    }
    setGuess('');
    setShowSuggestions(false);
  };

  const generateShareLink = () => {
    const grid = Array(6).fill('⬛').map((s, i) => i < hints ? '🟩' : '⬜').join('');
    const text = `CineSnap (${mode.toUpperCase()}) 🎬\nLevel ${level} • Streak ${streak}\n${grid}\nGuess in ${hints}/6 hints!`;
    navigator.clipboard.writeText(text);
    alert('Results copied to clipboard! 📋');
  };

  const hintLabels = mode === 'actor' ? ['Birthplace', 'Experience', 'Legacy', 'Popularity', 'Type', 'Biography'] : ['Genre', 'Date', 'Reception', mode === 'tv' ? 'Creator' : 'Director', 'Starring', 'Plot Summary'];

  if (loading) return <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.accent, fontFamily: 'sans-serif' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ color: colors.accent, margin: 0, fontSize: '32px', fontWeight: '900' }}>CineSnap</h1>
            <div style={{ fontSize: '12px', color: colors.secondary }}>Level {level} • {xp % 500}/500 XP</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setSoundOn(!soundOn)} style={{ background: colors.card, border: 'none', color: colors.text, padding: '10px', borderRadius: '8px' }}>
              {soundOn ? <Volume2 size={20}/> : <VolumeX size={20}/>}
            </button>
            <button onClick={() => setShowSettings(!showSettings)} style={{ background: colors.card, border: 'none', color: colors.text, padding: '10px', borderRadius: '8px' }}>
              <Settings size={20}/>
            </button>
          </div>
        </div>

        {showSettings && (
          <div style={{ background: colors.card, padding: '20px', borderRadius: '15px', marginBottom: '20px', border: `1px solid ${colors.accent}` }}>
            <h3 style={{ marginTop: 0 }}>Game Settings</h3>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '12px', color: colors.secondary }}>THEME</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {Object.keys(THEMES).map(t => (
                  <button key={t} onClick={() => setTheme(t)} style={{ padding: '5px 10px', borderRadius: '5px', border: 'none', background: theme === t ? colors.accent : colors.bg, color: colors.text }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: colors.secondary }}>PERSONALITY</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {Object.keys(PERSONALITIES).map(p => (
                  <button key={p} onClick={() => setPersonality(p)} style={{ padding: '5px 10px', borderRadius: '5px', border: 'none', background: personality === p ? colors.accent : colors.bg, color: colors.text }}>{PERSONALITIES[p].name}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', background: colors.card, padding: '5px', borderRadius: '12px' }}>
          {['movie', 'tv', 'actor'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: mode === m ? colors.accent : 'transparent', color: colors.text, fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>{m.toUpperCase()}</button>
          ))}
        </div>

        {state === 'playing' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '18px' }}>🔥 Current Streak: <strong>{streak}</strong></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {hintLabels.map((l, i) => (
                <div key={i} style={{ background: colors.card, padding: '15px', borderRadius: '12px', opacity: hints > i ? 1 : 0.2, border: hints > i ? `1px solid ${colors.secondary}` : 'none', transition: '0.5s all' }}>
                  <div style={{ fontSize: '10px', color: colors.secondary, textTransform: 'uppercase', letterSpacing: '1px' }}>{l}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>{hints > i ? movie.hints[i] : 'Locked'}</div>
                </div>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <input 
                value={guess} 
                onChange={(e) => { setGuess(e.target.value); searchItems(e.target.value); setShowSuggestions(true); }}
                placeholder={`Type the ${mode} name...`}
                style={{ width: '100%', padding: '18px', borderRadius: '12px', border: 'none', background: colors.card, color: colors.text, marginBottom: '10px', boxSizing: 'border-box', fontSize: '16px', outline: `2px solid ${colors.accent}` }}
              />

              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', width: '100%', background: colors.card, borderRadius: '12px', zIndex: 10, top: '60px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                  {suggestions.map(s => (
                    <div key={s} onClick={() => { setGuess(s); setShowSuggestions(false); }} style={{ padding: '15px', cursor: 'pointer', borderBottom: `1px solid ${colors.bg}` }}>{s}</div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={makeGuess} style={{ flex: 2, padding: '18px', borderRadius: '12px', border: 'none', background: colors.accent, color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>SUBMIT</button>
              <button onClick={() => setHints(h => Math.min(h+1, 6))} disabled={hints >= 6} style={{ flex: 1, padding: '18px', borderRadius: '12px', border: `1px solid ${colors.secondary}`, background: 'transparent', color: colors.secondary, cursor: 'pointer' }}>+ HINT</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', background: colors.card, padding: '40px 20px', borderRadius: '24px', animation: 'fadeIn 0.5s' }}>
            <Trophy size={60} color={colors.accent} style={{ marginBottom: '20px' }} />
            <h2 style={{ fontSize: '28px', margin: '0 0 10px 0' }}>{persona.responses.correct}</h2>
            <p style={{ color: colors.secondary, marginBottom: '20px' }}>It was <strong>{movie.title}</strong></p>

            {movie.poster && <img src={movie.poster} style={{ width: '180px', borderRadius: '12px', marginBottom: '20px', boxShadow: `0 0 30px ${colors.accent}44` }} alt="poster" />}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => { resetGameState(); fetchMovie(); }} style={{ padding: '18px', borderRadius: '12px', border: 'none', background: colors.accent, color: 'white', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>PLAY AGAIN</button>
              <button onClick={generateShareLink} style={{ padding: '15px', borderRadius: '12px', border: `1px solid ${colors.secondary}`, background: 'transparent', color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}>
                <Share2 size={18} /> SHARE SCORE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
