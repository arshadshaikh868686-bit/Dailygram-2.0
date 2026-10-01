import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getError } from '../lib/api';
import { saveSession } from '../lib/auth';
import { Toast, Spinner } from '../components/UI';
import { AuthShell } from './Login';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faCode,
  faServer,
  faTerminal,
  faCubes,
  faDatabase,
  faLayerGroup,
  faBoxOpen,
  faCodeBranch,
  faLaptopCode,
  faFlask,
  faBook,
  faGraduationCap,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';

const SKILL_OPTIONS = [
  { name: 'Software Engineering', icon: faLaptopCode },
  { name: 'Computer Science', icon: faLaptopCode },
  { name: 'Science', icon: faFlask },
  { name: 'Mathematics', icon: faBook },
  { name: 'Physics', icon: faFlask },
  { name: 'Chemistry', icon: faFlask },
  { name: 'Biology', icon: faFlask },

  { name: 'JEE', icon: faGraduationCap },
  { name: 'NEET', icon: faGraduationCap },

  { name: 'React.js', icon: faCode },
  { name: 'Node.js', icon: faServer },
  { name: 'Java', icon: faCubes },
  { name: 'JavaScript', icon: faTerminal },
  { name: 'TypeScript', icon: faTerminal },
  { name: 'Python', icon: faTerminal },
  { name: 'Next.js', icon: faLayerGroup },
  { name: 'Express.js', icon: faServer },
  { name: 'SQL', icon: faDatabase },
  { name: 'MongoDB', icon: faDatabase },
  { name: 'Docker', icon: faBoxOpen },
  { name: 'Git', icon: faCodeBranch },

  { name: 'C++', icon: faCode },
  { name: 'DSA', icon: faCode },
  { name: 'Cyber Security', icon: faCode },
  { name: 'Machine Learning', icon: faCode },
  { name: 'Artificial Intelligence', icon: faCode }
];

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'learner',
    skills: []
  });

  const [loading, setLoading] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Select / deselect skill
  const handleToggleSkill = (skillName) => {
    setForm((prevForm) => {
      const isSelected = prevForm.skills.some(
        (item) => item.toLowerCase() === skillName.toLowerCase()
      );

      return {
        ...prevForm,
        skills: isSelected
          ? prevForm.skills.filter(
              (item) => item.toLowerCase() !== skillName.toLowerCase()
            )
          : [...prevForm.skills, skillName]
      };
    });
  };

  // Add custom skill
  const handleAddCustomSkill = () => {
    const skill = customSkill.trim();

    if (!skill) return;

    const alreadyExists = form.skills.some(
      (item) => item.toLowerCase() === skill.toLowerCase()
    );

    if (!alreadyExists) {
      setForm((prev) => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }

    setCustomSkill('');
  };

  // Search predefined skills
  const filteredSkills = SKILL_OPTIONS.filter((skill) =>
    skill.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  // Register
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', form);

      saveSession(data);

      navigate('/dashboard');
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Dailygram as a learner or mentor."
    >

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">

          <label
            htmlFor="fullName"
            className="text-xs font-bold text-slate-500 uppercase tracking-wide"
          >
            Full name
          </label>

          <input
            id="fullName"
            type="text"
            required
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                name: e.target.value
              }))
            }
            placeholder="Your name"
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
          />

        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">

          <label
            htmlFor="email"
            className="text-xs font-bold text-slate-500 uppercase tracking-wide"
          >
            Email address
          </label>

          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                email: e.target.value
              }))
            }
            placeholder="you@example.com"
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
          />

        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">

          <label
            htmlFor="password"
            className="text-xs font-bold text-slate-500 uppercase tracking-wide"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            required
            minLength="6"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                password: e.target.value
              }))
            }
            placeholder="At least 6 characters"
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
          />

        </div>

        {/* Account Role */}
        <div className="flex flex-col gap-1.5">

          <label
            htmlFor="accountRole"
            className="text-xs font-bold text-slate-500 uppercase tracking-wide"
          >
            Account type
          </label>

          <select
            id="accountRole"
            value={form.role}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                role: e.target.value
              }))
            }
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all bg-white cursor-pointer"
          >
            <option value="learner">Learner</option>
            <option value="mentor">Mentor</option>
          </select>

        </div>

        {/* Skills */}
        <div className="space-y-3">

          <div>
            <label
              htmlFor="skillSearch"
              className="block text-sm font-medium mb-2"
            >
              Skills / Subjects
            </label>

            <input
              id="skillSearch"
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Search skills or subjects..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Available Skills */}
          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">

            {filteredSkills.map((skill) => {

              const selected = form.skills.some(
                (item) =>
                  item.toLowerCase() === skill.name.toLowerCase()
              );

              return (
                <button
                  type="button"
                  key={skill.name}
                  onClick={() => handleToggleSkill(skill.name)}
                  className={`px-3 py-2 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all ${
                    selected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >

                  <FontAwesomeIcon icon={skill.icon} />

                  <span>
                    {skill.name}
                  </span>

                </button>
              );

            })}

            {filteredSkills.length === 0 && (
              <p className="text-xs text-slate-400 py-2">
                No predefined skill found. Add your own below.
              </p>
            )}

          </div>

          {/* Custom Skill */}
          <div className="flex gap-2">

            <input
              type="text"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSkill();
                }
              }}
              placeholder="Add your own skill..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />

            <button
              type="button"
              onClick={handleAddCustomSkill}
              className="px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              + Add
            </button>

          </div>

          {/* Selected Skills */}
          {form.skills.length > 0 && (
            <div className="pt-1">

              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">
                Selected skills
              </p>

              <div className="flex flex-wrap gap-2">

                {form.skills.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => handleToggleSkill(skill)}
                    className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                  >
                    {skill} ×
                  </button>
                ))}

              </div>

            </div>
          )}

        </div>

        {/* Create Account */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2 h-10 cursor-pointer"
        >

          {loading ? (
            <>
              <Spinner />
              <span>Creating…</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faUserPlus} />
              <span>Create account</span>
            </>
          )}

        </button>

        {/* Login Link */}
        <p className="text-center text-xs text-slate-500 mt-4">

          Already registered?{' '}

          <Link
            to="/login"
            className="text-indigo-600 hover:underline font-semibold"
          >
            Log in
          </Link>

        </p>

      </form>

      <Toast
        message={error}
        onClose={() => setError('')}
      />

    </AuthShell>
  );
}