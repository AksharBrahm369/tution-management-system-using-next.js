'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Mail, Phone } from 'lucide-react';

interface Teacher {
  id: string;
  teacherCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  employmentType: string;
  subjects: { subject: { name: string } }[];
}

export default function TeacherListPage({ standardId, standardName, basePath = "/admin/teachers" }: { standardId?: string; standardName?: string; basePath?: string }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [standardFilter, setStandardFilter] = useState('');
  const [standards, setStandards] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let active = true;

    const loadTeachers = async () => {
      if (active) {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (standardId || standardFilter) params.set("standardId", standardId ?? standardFilter);
        const res = await fetch(`/api/admin/teachers?${params.toString()}`);
        if (!res.ok || !active) {
          return;
        }

        const data = await res.json();
        if (active) {
          setTeachers(data?.teachers ?? []);
        }
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadTeachers();

    return () => {
      active = false;
    };
  }, [standardId, standardFilter]);

  useEffect(() => {
    if (standardId) return;
    fetch("/api/admin/standards")
      .then((res) => (res.ok ? res.json() : { standards: [] }))
      .then((payload) => setStandards(payload.standards ?? []))
      .catch(() => setStandards([]));
  }, [standardId]);

  const filteredTeachers = teachers.filter(t => 
    t.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.teacherCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const addTeacherHref = standardId ? `${basePath}/add` : "/admin/teachers/add";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">{standardName ? `${standardName} Teachers` : "Teachers"}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{standardName ? `Teachers assigned to ${standardName}` : "Manage teaching staff and assignments"}</p>
        </div>
        <Link href={addTeacherHref}>
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Add Teacher
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            aria-label="Search teachers"
            type="text"
            placeholder="Search teachers by name, code or email..." 
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-4 pl-9 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800">
          <Filter className="h-4 w-4 text-slate-500" />
          Filters
        </button>
        {!standardId && (
          <select
            aria-label="Filter teachers by standard"
            value={standardFilter}
            onChange={(event) => setStandardFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="">All Standards</option>
            {standards.map((standard) => (
              <option key={standard.id} value={standard.id}>{standard.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 animate-pulse rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"></div>
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No teachers found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            We could not find any teachers matching your search criteria. Try adjusting your filters or add a new teacher.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map(teacher => (
            <div key={teacher.id} className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/70">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-base font-semibold text-blue-700 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50">
                    {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block mt-1">
                      {teacher.teacherCode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="h-4 w-4 mr-2 opacity-70" />
                  <span className="line-clamp-1">{teacher.email}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Phone className="h-4 w-4 mr-2 opacity-70" />
                  <span>{teacher.phone}</span>
                </div>
                
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-3">
                  <p className="mb-2 text-xs font-medium text-slate-500">Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.subjects.map((sub, idx) => (
                      <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md">
                        {sub.subject.name}
                      </span>
                    ))}
                    {teacher.subjects.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No subjects assigned</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    teacher.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    teacher.status === 'ON_LEAVE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {teacher.status}
                  </span>
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {teacher.employmentType.replace('_', ' ')}
                  </span>
                </div>
                
                <Link href={`${basePath}/${teacher.id}`}>
                  <button className="px-3 py-1.5 text-sm font-medium rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-500 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-all -mr-2">
                    View Profile
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
