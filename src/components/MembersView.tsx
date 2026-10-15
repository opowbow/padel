import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import { InterestedMember, MemberStatus } from '../types/padel';
import { RANKING_PRESETS, parseRankingScore, getRankingBadge } from '../utils/rankingData';

interface MembersViewProps {
  members: InterestedMember[];
  onAddMember: (memberData: Omit<InterestedMember, 'id' | 'joinedDate'>) => void;
  onOpenSignUpPlayer?: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  onAddMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showInterestModal, setShowInterestModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rankingMode, setRankingMode] = useState<'preset' | 'manual'>('preset');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(3);
  const [manualText, setManualText] = useState('');
  const [status, setStatus] = useState<MemberStatus>('Interested in Winter League');
  const [preferredDays, setPreferredDays] = useState('Weekday evenings & Saturdays');
  const [notes, setNotes] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80');

  const AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1534751516642-a171ed28723c?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=250&q=80',
  ];

  const currentPreset = RANKING_PRESETS[selectedPresetIndex];
  const activeRankingText = rankingMode === 'preset' ? currentPreset.label : manualText || 'Level 3.0 - Club Intermediate';
  const activeRankingScore = rankingMode === 'preset' ? currentPreset.level : parseRankingScore(manualText);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onAddMember({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      avatar,
      rankingText: activeRankingText,
      rankingScore: activeRankingScore,
      status,
      preferredDays: preferredDays.trim() || 'Anytime',
      notes: notes.trim() || 'Excited to play!',
    });

    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setShowInterestModal(false);
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.rankingText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 p-4 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 -mb-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                Community Directory
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                {members.length} Members Registered
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              PadelSlay Members & Interested Players
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Sign up as interested to join the official PadelSlay roster, find matching partners for <strong>Mixin Magic</strong> sessions, and get invited to the <strong>Winter Padel Slay League</strong>.
            </p>
          </div>

          <button
            onClick={() => setShowInterestModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4 font-bold" />
            <span>Sign Up as Interested</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, skill, or keyword..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Members' },
            { id: 'Active League Player', label: 'Active League' },
            { id: 'Interested in Winter League', label: 'Winter League Interested' },
            { id: 'Looking for Mixin Group', label: 'Mixin Magic Groups' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === f.id
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                  : 'bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const badge = getRankingBadge(member.rankingScore, member.rankingText);
          const isActiveLeague = member.status === 'Active League Player';
          const isInterested = member.status === 'Interested in Winter League';

          return (
            <div
              key={member.id}
              className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between space-y-3.5 relative overflow-hidden group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-sky-500/30 group-hover:ring-sky-400/60 transition"
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-sky-300 transition">
                        {member.name}
                      </h4>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border font-mono mt-0.5 ${badge.badgeColor}`}>
                        {member.rankingText}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      isActiveLeague
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        : isInterested
                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                        : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {member.status.replace(' Player', '')}
                  </span>
                </div>

                {member.notes && (
                  <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                    "{member.notes}"
                  </p>
                )}

                <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate">{member.preferredDays}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>

                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span className="truncate">{member.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Joined {member.joinedDate}</span>
                <span className="text-sky-400 font-bold hover:underline cursor-pointer">
                  Invite to Match →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sign Up As Interested Modal */}
      {showInterestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-950/40 to-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    Sign Up as Interested
                  </h3>
                  <p className="text-xs text-slate-400">
                    Join the PadelSlay Member Directory & get matched to games
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowInterestModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Choose Your Profile Avatar
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {AVATARS.map((av, idx) => (
                    <img
                      key={idx}
                      src={av}
                      alt="avatar"
                      onClick={() => setAvatar(av)}
                      className={`w-11 h-11 rounded-xl object-cover cursor-pointer transition ${
                        avatar === av
                          ? 'ring-3 ring-sky-400 scale-105'
                          : 'opacity-60 hover:opacity-100 ring-1 ring-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name / Padel Nickname *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tara 'The Rocket' Smith"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                  />
                </div>
              </div>

              {/* Phone & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone (Optional for WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7911 123456"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    I am Interested In:
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MemberStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                  >
                    <option value="Interested in Winter League">Interested in Winter Padel Slay League</option>
                    <option value="Looking for Mixin Group">Looking for Mixin Magic Group Sessions</option>
                    <option value="Active League Player">Active Competitive Player</option>
                    <option value="Weekend Social">Weekend Social Games</option>
                  </select>
                </div>
              </div>

              {/* Ranking Options */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Skill Level / Ranking:
                  </label>

                  <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setRankingMode('preset')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                        rankingMode === 'preset'
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setRankingMode('manual')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                        rankingMode === 'manual'
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Manual Text
                    </button>
                  </div>
                </div>

                {rankingMode === 'preset' ? (
                  <select
                    value={selectedPresetIndex}
                    onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                  >
                    {RANKING_PRESETS.map((preset, index) => (
                      <option key={preset.level} value={index}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="e.g. Level 3.75 - Intermediate Plus"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                  />
                )}
              </div>

              {/* Preferred Days */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Preferred Playing Days & Times
                </label>
                <input
                  type="text"
                  value={preferredDays}
                  onChange={(e) => setPreferredDays(e.target.value)}
                  placeholder="e.g. Tuesdays & Thursday evenings, Saturday morning"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Playing Style / Partner Preferences
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell other players about your style, preferred court side, or goals!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 mt-2"
              >
                <CheckCircle2 className="w-4 h-4 font-bold" />
                <span>Submit & Join Member List</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
