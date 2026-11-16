import { motion } from 'framer-motion';
import { Compass, BookOpen, Sparkles, Wand2, Users, History, BrainCircuit, ChevronRight, Save, PlayCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const genreOptions = ['Fantasy', 'Horror', 'Mystery', 'Thriller', 'Science Fiction', 'Adventure', 'Romance'];
const toneOptions = ['Epic', 'Dark', 'Whimsical', 'Cinematic', 'Atmospheric'];
const defaultForm = {
  title: '',
  theme: 'A forgotten prophecy beneath the sea',
  genre: 'Fantasy',
  setting: 'The drowned capital of Veyra',
  character_preferences: 'A strong heroine, a loyal ally, and a morally complex rival',
  tone: 'Epic'
};

function App() {
  const [stories, setStories] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [memory, setMemory] = useState({ characters: [], events: [], decisions: [], timeline: [] });
  const [form, setForm] = useState(defaultForm);
  const [activePage, setActivePage] = useState('landing');
  const [customDecision, setCustomDecision] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const currentChapter = useMemo(() => {
    if (!currentStory || !currentStory.chapters || currentStory.chapters.length === 0) return null;
    return currentStory.chapters[currentStory.chapters.length - 1];
  }, [currentStory]);

  const loadStories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/stories`);
      const data = await response.json();
      setStories(data.stories || []);
    } catch (error) {
      console.error('Failed to load stories', error);
    }
  };

  const fetchStory = async (storyId) => {
    const response = await fetch(`${API_BASE}/api/stories/${storyId}`);
    const data = await response.json();
    setCurrentStory(data.story);
    setActivePage('dashboard');
    const memoryResponse = await fetch(`${API_BASE}/api/stories/${storyId}/memory`);
    const memoryData = await memoryResponse.json();
    setMemory(memoryData);
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleCreateStory = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      const story = data.story;
      setCurrentStory(story);
      setStories((prev) => [story, ...prev]);
      setActivePage('dashboard');
      const memoryResponse = await fetch(`${API_BASE}/api/stories/${story.id}/memory`);
      const memoryData = await memoryResponse.json();
      setMemory(memoryData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecision = async (option, customInput = '') => {
    if (!currentStory) return;
    setIsSubmitting(true);
    setActionMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/stories/${currentStory.id}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_option: option, custom_input: customInput })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Could not save your decision.');
      }
      const result = await response.json();
      setCurrentStory(result.story);
      const memoryResponse = await fetch(`${API_BASE}/api/stories/${currentStory.id}/memory`);
      const memoryData = await memoryResponse.json();
      setMemory(memoryData);
      setCustomDecision('');
      setActionMessage('Decision saved. Your next chapter is ready.');
    } catch (error) {
      console.error('Failed to submit story decision', error);
      setActionMessage(error.message || 'Could not save your decision. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!currentStory) return;
    setIsSubmitting(true);
    setActionMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/stories/${currentStory.id}/save`, {
        method: 'POST'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Could not save this story.');
      }
      const data = await response.json();
      setCurrentStory(data.story);
      await loadStories();
      setActionMessage('Story saved. You can continue whenever you are ready.');
    } catch (error) {
      console.error('Failed to save story', error);
      setActionMessage(error.message || 'Could not save this story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLanding = () => (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-10">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">
            <Sparkles size={16} /> StoryVerse – AI Storytelling Agent
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-7xl">
            Write worlds that evolve with every choice.
          </h1>
          <p className="max-w-xl text-lg text-slate-300">
            Build cinematic, adaptive stories with persistent memories, branching plotlines, and a living world that remembers every decision.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setActivePage('create')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 font-semibold text-white shadow-glow transition hover:scale-[1.02]"
            >
              <PlayCircle size={18} /> Start Your Story
            </button>
            <button
              onClick={() => setActivePage('history')}
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3 font-semibold text-slate-100"
            >
              Explore Story History
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/60">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 p-4">
            <div className="mb-6 flex items-center justify-between text-sm text-slate-300">
              <span>Story Overview</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-300">Live narrative</span>
            </div>
            <div className="space-y-4">
              {[
                ['Plot Engine', 'Adaptive chapter planning'],
                ['Memory Graph', 'Characters, timelines, and arcs'],
                ['Decision Core', 'Branching consequences in real time']
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                  <div className="mb-1 text-sm text-cyan-300">{title}</div>
                  <div className="text-sm text-slate-300">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          { icon: Compass, title: 'Story Planning', text: 'Dynamic chapter mapping, branching arcs, and world-state tracking.' },
          { icon: BrainCircuit, title: 'Memory Explorer', text: 'Persistent character recall, decisions, and unresolved mysteries.' },
          { icon: Wand2, title: 'Narrative Generation', text: 'Cinematic writing with tone-aware chapter creation and continuity checks.' }
        ].map(({ icon: Icon, title, text }) => (
          <motion.div key={title} whileHover={{ y: -4 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 p-3 text-cyan-200">
              <Icon size={22} />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
            <p className="text-slate-300">{text}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );

  const renderCreate = () => (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/60">
        <div className="mb-8 flex items-center gap-3">
          <BookOpen className="text-cyan-300" />
          <h2 className="text-3xl font-bold text-white">Create a New Story</h2>
        </div>

        <form onSubmit={handleCreateStory} className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Story title</span>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              placeholder="The Drowned Crown"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Theme</span>
            <input
              required
              value={form.theme}
              onChange={(event) => setForm({ ...form, theme: event.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-300">Genre</span>
            <select
              value={form.genre}
              onChange={(event) => setForm({ ...form, genre: event.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
            >
              {genreOptions.map((genre) => (<option key={genre} value={genre}>{genre}</option>))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-300">Narrative tone</span>
            <select
              value={form.tone}
              onChange={(event) => setForm({ ...form, tone: event.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
            >
              {toneOptions.map((tone) => (<option key={tone} value={tone}>{tone}</option>))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Setting</span>
            <input
              value={form.setting}
              onChange={(event) => setForm({ ...form, setting: event.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Character preferences</span>
            <textarea
              value={form.character_preferences}
              onChange={(event) => setForm({ ...form, character_preferences: event.target.value })}
              rows="3"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
            />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button disabled={isSubmitting} className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 font-semibold text-white shadow-glow disabled:opacity-60">
              {isSubmitting ? 'Generating...' : 'Generate Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderDashboard = () => {
    if (!currentStory) {
      return (
        <div className="mx-auto max-w-5xl px-6 py-16 text-center text-slate-300">
          No story selected. Create a new one to begin your journey.
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Story title</p>
            <h2 className="text-2xl font-bold text-white">{currentStory.title || currentStory.theme}</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActivePage('history')} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
              Story History
            </button>
            <button onClick={handleSaveAndContinue} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-60">
              <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
        {actionMessage && (
          <p role="status" className="mb-4 text-sm text-cyan-200" aria-live="polite">
            {actionMessage}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-violet-200">
                <BookOpen size={14} /> {currentChapter?.title || 'Chapter 1'}
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-line text-slate-200">{currentChapter?.content || 'Loading story chapter...'}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">Choose the next move</h3>
              <div className="space-y-3">
                {(currentChapter?.decision_options || []).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleDecision(option)}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-left text-slate-100 transition hover:border-cyan-500 hover:bg-slate-900"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <textarea
                  value={customDecision}
                  onChange={(event) => setCustomDecision(event.target.value)}
                  rows="3"
                  placeholder="Or write your own choice..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                />
                <div className="mt-3 flex justify-end">
                  <button onClick={() => handleDecision(customDecision.trim(), customDecision.trim())} disabled={isSubmitting || !customDecision.trim()} className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 font-medium text-white disabled:opacity-50">
                    {isSubmitting ? 'Generating...' : 'Commit Decision'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="mb-3 flex items-center gap-2 text-cyan-300"><History size={18} /> Story Progress</div>
              <div className="mb-2 text-sm text-slate-400">{currentStory.chapters?.length || 1} chapters generated</div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="mb-4 flex items-center gap-2 text-cyan-300"><Users size={18} /> Character Gallery</div>
              <div className="space-y-3">
                {(currentStory.characters || []).map((character) => (
                  <div key={character.name} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">
                    <div className="font-semibold text-white">{character.name}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-violet-300">{character.role}</div>
                    <p className="mt-2 text-sm text-slate-300">{character.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Story History</h2>
        <button onClick={() => setActivePage('create')} className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 font-medium text-white">
          New Story
        </button>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {(stories.length ? stories : []).map((story) => (
          <div key={story.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm uppercase tracking-[0.2em] text-cyan-300">{story.genre}</span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">{story.status}</span>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">{story.title}</h3>
            <p className="text-sm text-slate-300">{story.theme}</p>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
              <span>{story.chapters?.length || 1} chapters</span>
              <button onClick={() => fetchStory(story.id)} className="inline-flex items-center gap-2 text-cyan-300">
                Open <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMemory = () => (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h2 className="mb-6 text-3xl font-bold text-white">Memory Explorer</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="mb-3 text-lg font-semibold text-white">Characters</h3>
          <div className="space-y-3 text-sm text-slate-300">
            {(memory.characters || []).map((character) => (
              <div key={character.name} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <div className="font-medium text-white">{character.name}</div>
                <div>{character.role}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="mb-3 text-lg font-semibold text-white">Timeline</h3>
          <div className="space-y-3 text-sm text-slate-300">
            {(memory.timeline || []).map((event) => (
              <div key={event.id || event.title} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <div className="font-medium text-white">{event.title}</div>
                <div>{event.details}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="mb-3 text-lg font-semibold text-white">Decisions</h3>
          <div className="space-y-3 text-sm text-slate-300">
            {(memory.decisions || []).map((decision) => (
              <div key={decision.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <div className="font-medium text-white">{decision.selected_option || 'Custom choice'}</div>
                <div>{decision.consequence}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/rocky-storytelling-logo.png"
              alt="Rocky Storytelling logo"
              className="h-14 w-14 rounded-full object-contain"
            />
            <div>
              <div className="text-lg font-bold tracking-tight text-white">StoryVerse</div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Interactive worldbuilder</div>
            </div>
          </div>

          <nav className="hidden items-center gap-5 md:flex">
            {[
              ['Home', 'landing'],
              ['Create', 'create'],
              ['Dashboard', 'dashboard'],
              ['Memory', 'memory'],
              ['History', 'history']
            ].map(([label, page]) => (
              <button key={page} onClick={() => setActivePage(page)} className={activePage === page ? 'text-cyan-300' : 'text-slate-300'}>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {activePage === 'landing' && renderLanding()}
      {activePage === 'create' && renderCreate()}
      {activePage === 'dashboard' && renderDashboard()}
      {activePage === 'memory' && renderMemory()}
      {activePage === 'history' && renderHistory()}
    </div>
  );
}

export default App;
