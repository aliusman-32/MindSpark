import React from 'react';
import { Link } from 'react-router-dom';

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="font-extrabold text-gray-900">{label}</div>
      <div className="font-semibold text-gray-700">{value}</div>
    </div>
  );
}

function ControlRow({ label, action = 'Edit' }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="font-extrabold text-gray-900">{label}</div>
      <button className="px-4 py-1.5 rounded-full bg-sky-300 text-white font-bold shadow">{action}</button>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-200 to-purple-300 p-6 lg:p-10">
      <div className="mx-auto max-w-5xl bg-white rounded-[28px] p-6 sm:p-8 lg:p-10 shadow-xl">
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-purple-600">Aliza's Profile</h1>

        <div className="mt-6 bg-gray-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/70 flex items-center justify-center text-2xl">👤</div>
          <div>
            <div className="font-extrabold text-gray-900">Aliza's Profile</div>
            <div className="text-sm text-gray-600 font-semibold">Age: 7 | Active since: 2 months ago</div>
          </div>
        </div>

        <div className="mt-6 bg-gray-100 rounded-2xl p-5">
          <div className="text-xl font-extrabold text-purple-700 mb-2">Progress Report</div>
          <StatRow label="Time Spent:" value="45 minutes today" />
          <StatRow label="Quizzes Completed:" value="12 quizzes" />
          <StatRow label="Average Quiz Score:" value="85%" />
        </div>

        <div className="mt-6 bg-gray-100 rounded-2xl p-5">
          <div className="text-xl font-extrabold text-purple-700 mb-2">Account Controls</div>
          <ControlRow label="Set Screen Time Limit" action="Edit" />
          <ControlRow label="Manage Saved Data" action="View" />
          <ControlRow label="Add/Remove Child Profile" action="Manage" />
        </div>

        <nav className="mt-10 grid grid-cols-4 gap-4 text-center text-gray-600">
          <Link to="/home" className="rounded-2xl bg-purple-100 py-3 font-semibold text-purple-700">Home</Link>
          <Link to="/history" className="rounded-2xl bg-gray-100 py-3 font-semibold">History</Link>
          <Link to="/assessment" className="rounded-2xl bg-gray-100 py-3 font-semibold">Assessment</Link>
          <Link to="/settings" className="rounded-2xl bg-gray-100 py-3 font-semibold">Settings</Link>
        </nav>
      </div>
    </div>
  );
}

export default ProfilePage;


